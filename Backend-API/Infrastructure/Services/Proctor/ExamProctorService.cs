using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Proctor;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Proctor;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Proctor;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Proctor;

public class ExamProctorService : IExamProctorService
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICacheService _cache;
    private readonly ILogger<ExamProctorService> _logger;

    private const string CachePrefix = "exam-proctors:";

    public ExamProctorService(
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        ICacheService cache,
        ILogger<ExamProctorService> logger)
    {
        _db = db;
        _userManager = userManager;
        _cache = cache;
        _logger = logger;
    }

    // ── Get all proctors (assigned + available) for an exam ───
    public async Task<ApiResponse<ExamProctorPageDto>> GetExamProctorsAsync(int examId)
    {
        var cacheKey = $"{CachePrefix}{examId}";
        if (_cache.TryGet<ExamProctorPageDto>(cacheKey, out var cached) && cached != null)
            return ApiResponse<ExamProctorPageDto>.SuccessResponse(cached);

        var exam = await _db.Exams.AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == examId && !e.IsDeleted);

        if (exam == null)
            return ApiResponse<ExamProctorPageDto>.FailureResponse("Exam not found.");

        // All assigned proctor IDs for this exam
        var assigned = await _db.ExamProctors
            .AsNoTracking()
            .Where(ep => ep.ExamId == examId && !ep.IsDeleted)
            .Select(ep => new { ep.ProctorId, ep.AssignedAt })
            .ToListAsync();

        var assignedIds = assigned.Select(a => a.ProctorId).ToHashSet();

        // All users in Proctor role
        var proctorUsers = await _userManager.GetUsersInRoleAsync(AppRoles.Proctor);
        var activeProctors = proctorUsers.Where(u => !u.IsDeleted).ToList();

        var assignedProctors = new List<ExamProctorItemDto>();
        var availableProctors = new List<ExamProctorItemDto>();

        foreach (var u in activeProctors)
        {
            var isAssigned = assignedIds.Contains(u.Id);
            var item = new ExamProctorItemDto
            {
                Id = u.Id,
                DisplayName = u.DisplayName,
                FullName = u.FullName,
                Email = u.Email ?? string.Empty,
                IsAssigned = isAssigned,
                AssignedAt = isAssigned
                    ? assigned.First(a => a.ProctorId == u.Id).AssignedAt
                    : null
            };

            if (isAssigned)
                assignedProctors.Add(item);
            else
                availableProctors.Add(item);
        }

        var result = new ExamProctorPageDto
        {
            ExamId = exam.Id,
            ExamTitleEn = exam.TitleEn,
            ExamTitleAr = exam.TitleAr,
            AssignedProctors = assignedProctors,
            AvailableProctors = availableProctors
        };

        _cache.Set(cacheKey, result, TimeSpan.FromMinutes(5));
        return ApiResponse<ExamProctorPageDto>.SuccessResponse(result);
    }

    // ── Assign proctors to exam ────────────────────────────────
    public async Task<ApiResponse<ProctorAssignmentResultDto>> AssignAsync(
        AssignProctorToExamDto dto, string assignedBy)
    {
        if (dto.ProctorIds == null || dto.ProctorIds.Count == 0)
            return ApiResponse<ProctorAssignmentResultDto>.FailureResponse("No proctor IDs provided.");

        var exam = await _db.Exams.AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == dto.ExamId && !e.IsDeleted);
        if (exam == null)
            return ApiResponse<ProctorAssignmentResultDto>.FailureResponse("Exam not found.");

        // Load existing active assignments for this exam
        var existing = await _db.ExamProctors
            .Where(ep => ep.ExamId == dto.ExamId && !ep.IsDeleted)
            .Select(ep => ep.ProctorId)
            .ToHashSetAsync();

        int success = 0;
        int skipped = 0;
        var skippedReasons = new List<string>();

        foreach (var proctorId in dto.ProctorIds.Distinct())
        {
            if (existing.Contains(proctorId))
            {
                skipped++;
                skippedReasons.Add($"Proctor {proctorId} already assigned.");
                continue;
            }

            var user = await _userManager.FindByIdAsync(proctorId);
            if (user == null || user.IsDeleted)
            {
                skipped++;
                skippedReasons.Add($"Proctor {proctorId} not found.");
                continue;
            }

            if (!await _userManager.IsInRoleAsync(user, AppRoles.Proctor))
            {
                skipped++;
                skippedReasons.Add($"User {proctorId} does not have the Proctor role.");
                continue;
            }

            _db.ExamProctors.Add(new ExamProctor
            {
                ExamId = dto.ExamId,
                ProctorId = proctorId,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = assignedBy
            });
            success++;
        }

        if (success > 0)
        {
            await _db.SaveChangesAsync();
            _cache.Remove($"{CachePrefix}{dto.ExamId}");
        }

        _logger.LogInformation(
            "Exam {ExamId}: assigned {Success} proctor(s), skipped {Skipped}.",
            dto.ExamId, success, skipped);

        return ApiResponse<ProctorAssignmentResultDto>.SuccessResponse(
            new ProctorAssignmentResultDto
            {
                TotalTargeted = dto.ProctorIds.Count,
                SuccessCount = success,
                SkippedCount = skipped,
                SkippedReasons = skippedReasons
            },
            $"{success} proctor(s) assigned successfully.");
    }

    // ── Unassign proctors from exam ───────────────────────────
    public async Task<ApiResponse<ProctorAssignmentResultDto>> UnassignAsync(
        UnassignProctorFromExamDto dto)
    {
        if (dto.ProctorIds == null || dto.ProctorIds.Count == 0)
            return ApiResponse<ProctorAssignmentResultDto>.FailureResponse("No proctor IDs provided.");

        var records = await _db.ExamProctors
            .Where(ep => ep.ExamId == dto.ExamId
                      && dto.ProctorIds.Contains(ep.ProctorId)
                      && !ep.IsDeleted)
            .ToListAsync();

        int success = records.Count;
        int skipped = dto.ProctorIds.Count - success;

        foreach (var r in records)
        {
            r.IsDeleted = true;
            r.UpdatedDate = DateTime.UtcNow;
        }

        if (success > 0)
        {
            await _db.SaveChangesAsync();
            _cache.Remove($"{CachePrefix}{dto.ExamId}");
        }

        _logger.LogInformation(
            "Exam {ExamId}: unassigned {Success} proctor(s), skipped {Skipped}.",
            dto.ExamId, success, skipped);

        return ApiResponse<ProctorAssignmentResultDto>.SuccessResponse(
            new ProctorAssignmentResultDto
            {
                TotalTargeted = dto.ProctorIds.Count,
                SuccessCount = success,
                SkippedCount = skipped
            },
            $"{success} proctor(s) unassigned successfully.");
    }
}
