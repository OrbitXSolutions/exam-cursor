using ClosedXML.Excel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Batch;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.Interfaces.Batch;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Batch;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Batch;

public class BatchService : IBatchService
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;

    public BatchService(
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager)
    {
        _db = db;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    // ── List ───────────────────────────────────────────────────
    public async Task<ApiResponse<PaginatedResponse<BatchListDto>>> GetBatchesAsync(BatchFilterDto filter)
    {
        var query = _db.Batches.Where(b => !b.IsDeleted);

        // Search
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.ToLower();
            query = query.Where(b =>
                b.Name.ToLower().Contains(s) ||
                (b.Description != null && b.Description.ToLower().Contains(s)));
        }

        // Status filter
        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            if (filter.Status.Equals("Active", StringComparison.OrdinalIgnoreCase))
                query = query.Where(b => b.IsActive);
            else if (filter.Status.Equals("Inactive", StringComparison.OrdinalIgnoreCase))
                query = query.Where(b => !b.IsActive);
        }

        var totalCount = await query.CountAsync();

        // Sort
        query = (filter.SortBy?.ToLower(), filter.SortDir?.ToLower()) switch
        {
            ("name", "asc") => query.OrderBy(b => b.Name),
            ("name", _) => query.OrderByDescending(b => b.Name),
            ("candidatecount", "asc") => query.OrderBy(b => b.BatchCandidates.Count),
            ("candidatecount", _) => query.OrderByDescending(b => b.BatchCandidates.Count),
            ("isactive", "asc") => query.OrderBy(b => b.IsActive),
            ("isactive", _) => query.OrderByDescending(b => b.IsActive),
            _ => query.OrderByDescending(b => b.CreatedDate),
        };

        var batches = await query
            .Include(b => b.BatchCandidates)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        // Resolve creator names
        var creatorIds = batches.Where(b => b.CreatedBy != null).Select(b => b.CreatedBy!).Distinct().ToList();
        var creators = await _db.Users
            .Where(u => creatorIds.Contains(u.Id))
            .Select(u => new { u.Id, u.FullName, u.Email })
            .ToDictionaryAsync(u => u.Id);

        var items = batches.Select(b => new BatchListDto
        {
            Id = b.Id,
            Name = b.Name,
            Description = b.Description,
            IsActive = b.IsActive,
            CandidateCount = b.BatchCandidates.Count,
            CreatedDate = b.CreatedDate,
            CreatedBy = b.CreatedBy,
            CreatedByName = b.CreatedBy != null && creators.TryGetValue(b.CreatedBy, out var c)
                ? (c.FullName ?? c.Email) : null
        }).ToList();

        return ApiResponse<PaginatedResponse<BatchListDto>>.SuccessResponse(
            new PaginatedResponse<BatchListDto>
            {
                Items = items,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize,
                TotalCount = totalCount
            });
    }

    // ── Get by ID (with candidates) ───────────────────────────
    public async Task<ApiResponse<BatchDetailDto>> GetBatchByIdAsync(int id)
    {
        var batch = await _db.Batches
            .Include(b => b.BatchCandidates)
                .ThenInclude(bc => bc.Candidate)
            .FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted);

        if (batch == null)
            return ApiResponse<BatchDetailDto>.FailureResponse("Batch not found.");

        // Resolve creator
        string? creatorName = null;
        if (batch.CreatedBy != null)
        {
            var creator = await _db.Users.Where(u => u.Id == batch.CreatedBy)
                .Select(u => new { u.FullName, u.Email }).FirstOrDefaultAsync();
            creatorName = creator?.FullName ?? creator?.Email;
        }

        // Resolve AddedBy names
        var adderIds = batch.BatchCandidates.Where(bc => bc.AddedBy != null).Select(bc => bc.AddedBy!).Distinct().ToList();
        var adders = await _db.Users
            .Where(u => adderIds.Contains(u.Id))
            .Select(u => new { u.Id, u.FullName, u.Email })
            .ToDictionaryAsync(u => u.Id);

        var dto = new BatchDetailDto
        {
            Id = batch.Id,
            Name = batch.Name,
            Description = batch.Description,
            IsActive = batch.IsActive,
            CandidateCount = batch.BatchCandidates.Count,
            CreatedDate = batch.CreatedDate,
            CreatedBy = batch.CreatedBy,
            CreatedByName = creatorName,
            Candidates = batch.BatchCandidates.Select(bc => new BatchCandidateDto
            {
                Id = bc.CandidateId,
                FullName = bc.Candidate.FullName,
                FullNameAr = bc.Candidate.FullNameAr,
                Email = bc.Candidate.Email!,
                RollNo = bc.Candidate.RollNo,
                Mobile = bc.Candidate.PhoneNumber,
                IsBlocked = bc.Candidate.IsBlocked,
                AddedAt = bc.AddedAt,
                AddedBy = bc.AddedBy,
                AddedByName = bc.AddedBy != null && adders.TryGetValue(bc.AddedBy, out var a)
                    ? (a.FullName ?? a.Email) : null
            }).OrderByDescending(c => c.AddedAt).ToList()
        };

        return ApiResponse<BatchDetailDto>.SuccessResponse(dto);
    }

    // ── Create ────────────────────────────────────────────────
    public async Task<ApiResponse<BatchListDto>> CreateBatchAsync(CreateBatchDto dto, string createdBy)
    {
        // Check duplicate name
        var exists = await _db.Batches.AnyAsync(b => b.Name == dto.Name && !b.IsDeleted);
        if (exists)
            return ApiResponse<BatchListDto>.FailureResponse("A batch with this name already exists.");

        var batch = new Domain.Entities.Batch.Batch
        {
            Name = dto.Name,
            Description = dto.Description,
            IsActive = dto.IsActive,
            CreatedBy = createdBy,
            CreatedDate = DateTime.UtcNow
        };

        _db.Batches.Add(batch);
        await _db.SaveChangesAsync();

        return ApiResponse<BatchListDto>.SuccessResponse(new BatchListDto
        {
            Id = batch.Id,
            Name = batch.Name,
            Description = batch.Description,
            IsActive = batch.IsActive,
            CandidateCount = 0,
            CreatedDate = batch.CreatedDate,
            CreatedBy = batch.CreatedBy
        }, "Batch created successfully.");
    }

    // ── Update ────────────────────────────────────────────────
    public async Task<ApiResponse<BatchListDto>> UpdateBatchAsync(int id, UpdateBatchDto dto, string updatedBy)
    {
        var batch = await _db.Batches
            .Include(b => b.BatchCandidates)
            .FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted);

        if (batch == null)
            return ApiResponse<BatchListDto>.FailureResponse("Batch not found.");

        // Check duplicate name if name is changing
        if (!string.IsNullOrWhiteSpace(dto.Name) && dto.Name != batch.Name)
        {
            var exists = await _db.Batches.AnyAsync(b => b.Name == dto.Name && !b.IsDeleted && b.Id != id);
            if (exists)
                return ApiResponse<BatchListDto>.FailureResponse("A batch with this name already exists.");
            batch.Name = dto.Name;
        }

        if (dto.Description != null) batch.Description = dto.Description;
        if (dto.IsActive.HasValue) batch.IsActive = dto.IsActive.Value;

        batch.UpdatedBy = updatedBy;
        batch.UpdatedDate = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return ApiResponse<BatchListDto>.SuccessResponse(new BatchListDto
        {
            Id = batch.Id,
            Name = batch.Name,
            Description = batch.Description,
            IsActive = batch.IsActive,
            CandidateCount = batch.BatchCandidates.Count,
            CreatedDate = batch.CreatedDate,
            CreatedBy = batch.CreatedBy
        }, "Batch updated successfully.");
    }

    // ── Delete (soft) ─────────────────────────────────────────
    public async Task<ApiResponse<bool>> DeleteBatchAsync(int id, string deletedBy)
    {
        var batch = await _db.Batches.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted);
        if (batch == null)
            return ApiResponse<bool>.FailureResponse("Batch not found.");

        batch.IsDeleted = true;
        batch.DeletedBy = deletedBy;
        batch.UpdatedDate = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResponse(true, "Batch deleted successfully.");
    }

    // ── Toggle active / inactive ──────────────────────────────
    public async Task<ApiResponse<bool>> ToggleStatusAsync(int id, string updatedBy)
    {
        var batch = await _db.Batches.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted);
        if (batch == null)
            return ApiResponse<bool>.FailureResponse("Batch not found.");

        batch.IsActive = !batch.IsActive;
        batch.UpdatedBy = updatedBy;
        batch.UpdatedDate = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResponse(true,
            batch.IsActive ? "Batch activated successfully." : "Batch deactivated successfully.");
    }

    // ── Add candidates ────────────────────────────────────────
    public async Task<ApiResponse<BatchCandidateChangeResultDto>> AddCandidatesAsync(
        int batchId, BatchCandidateIdsDto dto, string addedBy)
    {
        var batch = await _db.Batches.FirstOrDefaultAsync(b => b.Id == batchId && !b.IsDeleted);
        if (batch == null)
            return ApiResponse<BatchCandidateChangeResultDto>.FailureResponse("Batch not found.");

        // Get candidate role ID
        var candidateRole = await _roleManager.FindByNameAsync(AppRoles.Candidate);
        if (candidateRole == null)
            return ApiResponse<BatchCandidateChangeResultDto>.FailureResponse("Candidate role not found.");

        var candidateUserIds = await _db.UserRoles
            .Where(ur => ur.RoleId == candidateRole.Id)
            .Select(ur => ur.UserId)
            .ToListAsync();

        // Existing members of this batch
        var existingIds = await _db.BatchCandidates
            .Where(bc => bc.BatchId == batchId)
            .Select(bc => bc.CandidateId)
            .ToHashSetAsync();

        var result = new BatchCandidateChangeResultDto
        {
            TotalRequested = dto.CandidateIds.Count
        };

        foreach (var candidateId in dto.CandidateIds.Distinct())
        {
            if (!candidateUserIds.Contains(candidateId))
            {
                result.Errors.Add($"User {candidateId} is not a candidate.");
                result.SkippedCount++;
                continue;
            }

            if (existingIds.Contains(candidateId))
            {
                result.SkippedCount++;
                continue;
            }

            _db.BatchCandidates.Add(new BatchCandidate
            {
                BatchId = batchId,
                CandidateId = candidateId,
                AddedAt = DateTime.UtcNow,
                AddedBy = addedBy
            });
            result.AffectedCount++;
        }

        await _db.SaveChangesAsync();
        return ApiResponse<BatchCandidateChangeResultDto>.SuccessResponse(result,
            $"{result.AffectedCount} candidate(s) added to batch.");
    }

    // ── Remove candidates ─────────────────────────────────────
    public async Task<ApiResponse<BatchCandidateChangeResultDto>> RemoveCandidatesAsync(
        int batchId, BatchCandidateIdsDto dto)
    {
        var batch = await _db.Batches.FirstOrDefaultAsync(b => b.Id == batchId && !b.IsDeleted);
        if (batch == null)
            return ApiResponse<BatchCandidateChangeResultDto>.FailureResponse("Batch not found.");

        var toRemove = await _db.BatchCandidates
            .Where(bc => bc.BatchId == batchId && dto.CandidateIds.Contains(bc.CandidateId))
            .ToListAsync();

        var result = new BatchCandidateChangeResultDto
        {
            TotalRequested = dto.CandidateIds.Count,
            AffectedCount = toRemove.Count,
            SkippedCount = dto.CandidateIds.Count - toRemove.Count
        };

        _db.BatchCandidates.RemoveRange(toRemove);
        await _db.SaveChangesAsync();

        return ApiResponse<BatchCandidateChangeResultDto>.SuccessResponse(result,
            $"{result.AffectedCount} candidate(s) removed from batch.");
    }

    // ── Export batch members to Excel ─────────────────────────
    public async Task<byte[]> ExportBatchCandidatesAsync(int batchId)
    {
        var batch = await _db.Batches
            .Include(b => b.BatchCandidates)
                .ThenInclude(bc => bc.Candidate)
            .FirstOrDefaultAsync(b => b.Id == batchId && !b.IsDeleted);

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Batch Candidates");

        // Header
        ws.Cell(1, 1).Value = "Full Name";
        ws.Cell(1, 2).Value = "Full Name (Arabic)";
        ws.Cell(1, 3).Value = "Email";
        ws.Cell(1, 4).Value = "Roll No";
        ws.Cell(1, 5).Value = "Mobile";
        ws.Cell(1, 6).Value = "Status";
        ws.Cell(1, 7).Value = "Added At";

        var headerRange = ws.Range(1, 1, 1, 7);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

        if (batch != null)
        {
            int row = 2;
            foreach (var bc in batch.BatchCandidates.OrderBy(c => c.Candidate.FullName))
            {
                ws.Cell(row, 1).Value = bc.Candidate.FullName ?? "";
                ws.Cell(row, 2).Value = bc.Candidate.FullNameAr ?? "";
                ws.Cell(row, 3).Value = bc.Candidate.Email ?? "";
                ws.Cell(row, 4).Value = bc.Candidate.RollNo ?? "";
                ws.Cell(row, 5).Value = bc.Candidate.PhoneNumber ?? "";
                ws.Cell(row, 6).Value = bc.Candidate.IsBlocked ? "Blocked" : "Active";
                ws.Cell(row, 7).Value = bc.AddedAt.ToString("yyyy-MM-dd HH:mm");
                row++;
            }
        }

        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
