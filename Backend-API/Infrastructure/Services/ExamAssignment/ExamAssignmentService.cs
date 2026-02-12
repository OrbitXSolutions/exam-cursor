using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.ExamAssignment;
using Smart_Core.Application.Interfaces.ExamAssignment;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.ExamAssignment;

public class ExamAssignmentService : IExamAssignmentService
{
    private readonly ApplicationDbContext _db;
    private readonly RoleManager<ApplicationRole> _roleManager;

    public ExamAssignmentService(ApplicationDbContext db, RoleManager<ApplicationRole> roleManager)
    {
        _db = db;
        _roleManager = roleManager;
    }

    // ── Candidate list with computed flags ─────────────────────
    public async Task<ApiResponse<PaginatedResponse<AssignmentCandidateDto>>> GetCandidatesAsync(
        AssignmentCandidateFilterDto filter)
    {
        // Validate required fields
        if (filter.ExamId <= 0)
            return ApiResponse<PaginatedResponse<AssignmentCandidateDto>>.FailureResponse("ExamId is required.");
        if (filter.ScheduleFrom >= filter.ScheduleTo)
            return ApiResponse<PaginatedResponse<AssignmentCandidateDto>>.FailureResponse("ScheduleTo must be after ScheduleFrom.");

        // Get candidate role IDs
        var candidateRole = await _roleManager.FindByNameAsync(AppRoles.Candidate);
        if (candidateRole == null)
            return ApiResponse<PaginatedResponse<AssignmentCandidateDto>>.SuccessResponse(
                new PaginatedResponse<AssignmentCandidateDto>());

        var candidateUserIds = await _db.UserRoles
            .Where(ur => ur.RoleId == candidateRole.Id)
            .Select(ur => ur.UserId)
            .ToListAsync();

        var query = _db.Users
            .Where(u => candidateUserIds.Contains(u.Id) && !u.IsDeleted);

        // Filter by batch
        if (filter.BatchId.HasValue && filter.BatchId > 0)
        {
            var batchCandidateIds = await _db.BatchCandidates
                .Where(bc => bc.BatchId == filter.BatchId.Value)
                .Select(bc => bc.CandidateId)
                .ToListAsync();
            query = query.Where(u => batchCandidateIds.Contains(u.Id));
        }

        // Search
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.ToLower();
            query = query.Where(u =>
                (u.FullName != null && u.FullName.ToLower().Contains(s)) ||
                (u.FullNameAr != null && u.FullNameAr.ToLower().Contains(s)) ||
                u.Email!.ToLower().Contains(s) ||
                (u.RollNo != null && u.RollNo.ToLower().Contains(s)) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(s)));
        }

        // Status filter
        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            if (filter.Status.Equals("Blocked", StringComparison.OrdinalIgnoreCase))
                query = query.Where(u => u.IsBlocked);
            else if (filter.Status.Equals("Active", StringComparison.OrdinalIgnoreCase))
                query = query.Where(u => !u.IsBlocked);
        }

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderByDescending(u => u.CreatedDate)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        // Batch-load assignment & attempt flags for the page of users
        var userIds = users.Select(u => u.Id).ToList();

        // Active assignments for this exam
        var assignedSet = await _db.ExamAssignments
            .Where(a => a.ExamId == filter.ExamId && a.IsActive && !a.IsDeleted
                        && userIds.Contains(a.CandidateId))
            .Select(a => a.CandidateId)
            .ToHashSetAsync();

        // Users who have started the exam (any attempt exists)
        var startedSet = await _db.Attempts
            .Where(a => a.ExamId == filter.ExamId && userIds.Contains(a.CandidateId))
            .Select(a => a.CandidateId)
            .Distinct()
            .ToHashSetAsync();

        var items = users.Select(u => new AssignmentCandidateDto
        {
            Id = u.Id,
            RollNo = u.RollNo,
            FullName = u.FullName,
            FullNameAr = u.FullNameAr,
            Email = u.Email!,
            Mobile = u.PhoneNumber,
            IsActive = !u.IsBlocked,
            IsBlocked = u.IsBlocked,
            ExamAssigned = assignedSet.Contains(u.Id),
            ExamStarted = startedSet.Contains(u.Id),
        }).ToList();

        return ApiResponse<PaginatedResponse<AssignmentCandidateDto>>.SuccessResponse(
            new PaginatedResponse<AssignmentCandidateDto>
            {
                Items = items,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize,
                TotalCount = totalCount
            });
    }

    // ── Assign ─────────────────────────────────────────────────
    public async Task<ApiResponse<AssignmentResultDto>> AssignAsync(AssignExamDto dto, string assignedBy)
    {
        // Validate
        if (dto.ExamId <= 0)
            return ApiResponse<AssignmentResultDto>.FailureResponse("ExamId is required.");
        if (dto.ScheduleFrom >= dto.ScheduleTo)
            return ApiResponse<AssignmentResultDto>.FailureResponse("ScheduleTo must be after ScheduleFrom.");

        var exam = await _db.Exams.FirstOrDefaultAsync(e => e.Id == dto.ExamId && !e.IsDeleted);
        if (exam == null)
            return ApiResponse<AssignmentResultDto>.FailureResponse("Exam not found.");
        if (!exam.IsPublished)
            return ApiResponse<AssignmentResultDto>.FailureResponse("Only published exams can be assigned.");

        // Resolve target candidate IDs
        var targetIds = await ResolveTargetCandidateIds(dto);
        if (targetIds.Count == 0)
            return ApiResponse<AssignmentResultDto>.FailureResponse("No candidates matched the criteria.");

        // Existing active assignments for this exam
        var existingAssignments = await _db.ExamAssignments
            .Where(a => a.ExamId == dto.ExamId && a.IsActive && !a.IsDeleted
                        && targetIds.Contains(a.CandidateId))
            .ToDictionaryAsync(a => a.CandidateId);

        // Candidates who have started the exam
        var startedSet = await _db.Attempts
            .Where(a => a.ExamId == dto.ExamId && targetIds.Contains(a.CandidateId))
            .Select(a => a.CandidateId)
            .Distinct()
            .ToHashSetAsync();

        // Load candidate info for skip details
        var candidateMap = await _db.Users
            .Where(u => targetIds.Contains(u.Id))
            .Select(u => new { u.Id, u.FullName, u.Email, u.IsBlocked })
            .ToDictionaryAsync(u => u.Id);

        var result = new AssignmentResultDto { TotalTargeted = targetIds.Count };

        foreach (var candidateId in targetIds)
        {
            var info = candidateMap.GetValueOrDefault(candidateId);
            var name = info?.FullName ?? info?.Email ?? candidateId;

            // Skip blocked
            if (info?.IsBlocked == true)
            {
                result.SkippedCount++;
                result.SkippedDetails.Add(new AssignmentSkippedDto
                { CandidateId = candidateId, CandidateName = name, Reason = "Candidate is blocked" });
                continue;
            }

            // Already assigned — update schedule if not started
            if (existingAssignments.TryGetValue(candidateId, out var existing))
            {
                if (startedSet.Contains(candidateId))
                {
                    result.SkippedCount++;
                    result.SkippedDetails.Add(new AssignmentSkippedDto
                    { CandidateId = candidateId, CandidateName = name, Reason = "Exam already started" });
                }
                else
                {
                    // Update schedule
                    existing.ScheduleFrom = dto.ScheduleFrom;
                    existing.ScheduleTo = dto.ScheduleTo;
                    existing.UpdatedDate = DateTime.UtcNow;
                    existing.UpdatedBy = assignedBy;
                    result.SuccessCount++;
                }
                continue;
            }

            // New assignment
            _db.ExamAssignments.Add(new Domain.Entities.ExamAssignment.ExamAssignment
            {
                ExamId = dto.ExamId,
                CandidateId = candidateId,
                ScheduleFrom = dto.ScheduleFrom,
                ScheduleTo = dto.ScheduleTo,
                IsActive = true,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = assignedBy,
                CreatedBy = assignedBy,
                CreatedDate = DateTime.UtcNow
            });
            result.SuccessCount++;
        }

        await _db.SaveChangesAsync();

        return ApiResponse<AssignmentResultDto>.SuccessResponse(result,
            $"{result.SuccessCount} candidate(s) assigned successfully.");
    }

    // ── Unassign ───────────────────────────────────────────────
    public async Task<ApiResponse<AssignmentResultDto>> UnassignAsync(UnassignExamDto dto)
    {
        if (dto.ExamId <= 0)
            return ApiResponse<AssignmentResultDto>.FailureResponse("ExamId is required.");
        if (dto.CandidateIds.Count == 0)
            return ApiResponse<AssignmentResultDto>.FailureResponse("No candidates specified.");

        var assignments = await _db.ExamAssignments
            .Where(a => a.ExamId == dto.ExamId && a.IsActive && !a.IsDeleted
                        && dto.CandidateIds.Contains(a.CandidateId))
            .ToListAsync();

        var startedSet = await _db.Attempts
            .Where(a => a.ExamId == dto.ExamId && dto.CandidateIds.Contains(a.CandidateId))
            .Select(a => a.CandidateId)
            .Distinct()
            .ToHashSetAsync();

        var candidateMap = await _db.Users
            .Where(u => dto.CandidateIds.Contains(u.Id))
            .Select(u => new { u.Id, u.FullName, u.Email })
            .ToDictionaryAsync(u => u.Id);

        var result = new AssignmentResultDto { TotalTargeted = dto.CandidateIds.Count };

        var assignmentMap = assignments.ToDictionary(a => a.CandidateId);

        foreach (var candidateId in dto.CandidateIds)
        {
            var info = candidateMap.GetValueOrDefault(candidateId);
            var name = info?.FullName ?? info?.Email ?? candidateId;

            if (!assignmentMap.TryGetValue(candidateId, out var assignment))
            {
                result.SkippedCount++;
                result.SkippedDetails.Add(new AssignmentSkippedDto
                { CandidateId = candidateId, CandidateName = name, Reason = "Not currently assigned" });
                continue;
            }

            if (startedSet.Contains(candidateId))
            {
                result.SkippedCount++;
                result.SkippedDetails.Add(new AssignmentSkippedDto
                { CandidateId = candidateId, CandidateName = name, Reason = "Exam already started — cannot unassign" });
                continue;
            }

            // Soft-deactivate
            assignment.IsActive = false;
            assignment.UpdatedDate = DateTime.UtcNow;
            result.SuccessCount++;
        }

        await _db.SaveChangesAsync();

        return ApiResponse<AssignmentResultDto>.SuccessResponse(result,
            $"{result.SuccessCount} candidate(s) unassigned successfully.");
    }

    // ── Helper: resolve target candidates from DTO ─────────────
    private async Task<List<string>> ResolveTargetCandidateIds(AssignExamDto dto)
    {
        // Explicit list
        if (dto.CandidateIds != null && dto.CandidateIds.Count > 0)
            return dto.CandidateIds.Distinct().ToList();

        // Batch
        if (dto.BatchId.HasValue && dto.BatchId > 0)
        {
            return await _db.BatchCandidates
                .Where(bc => bc.BatchId == dto.BatchId.Value)
                .Select(bc => bc.CandidateId)
                .Distinct()
                .ToListAsync();
        }

        // Apply to all matching filters
        if (dto.ApplyToAllMatchingFilters)
        {
            var candidateRole = await _roleManager.FindByNameAsync(AppRoles.Candidate);
            if (candidateRole == null) return new List<string>();

            var roleUserIds = await _db.UserRoles
                .Where(ur => ur.RoleId == candidateRole.Id)
                .Select(ur => ur.UserId)
                .ToListAsync();

            var query = _db.Users.Where(u => roleUserIds.Contains(u.Id) && !u.IsDeleted);

            if (!string.IsNullOrWhiteSpace(dto.Search))
            {
                var s = dto.Search.ToLower();
                query = query.Where(u =>
                    (u.FullName != null && u.FullName.ToLower().Contains(s)) ||
                    (u.FullNameAr != null && u.FullNameAr.ToLower().Contains(s)) ||
                    u.Email!.ToLower().Contains(s) ||
                    (u.RollNo != null && u.RollNo.ToLower().Contains(s)));
            }

            if (!string.IsNullOrWhiteSpace(dto.FilterStatus))
            {
                if (dto.FilterStatus.Equals("Blocked", StringComparison.OrdinalIgnoreCase))
                    query = query.Where(u => u.IsBlocked);
                else if (dto.FilterStatus.Equals("Active", StringComparison.OrdinalIgnoreCase))
                    query = query.Where(u => !u.IsBlocked);
            }

            return await query.Select(u => u.Id).ToListAsync();
        }

        return new List<string>();
    }
}
