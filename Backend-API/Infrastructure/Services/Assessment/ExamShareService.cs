using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Assessment;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Assessment;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Assessment;

public class ExamShareService : IExamShareService
{
    private readonly ApplicationDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly ICacheService _cache;

    public ExamShareService(
        ApplicationDbContext context,
        ITokenService tokenService,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        ICacheService cache)
    {
        _context = context;
        _tokenService = tokenService;
        _userManager = userManager;
        _roleManager = roleManager;
        _cache = cache;
    }

    // ========== Admin endpoints ==========

    public async Task<ApiResponse<ExamShareLinkDto>> GenerateShareLinkAsync(
        int examId, GenerateShareLinkDto? dto, string createdBy, string baseUrl)
    {
        var exam = await _context.Exams
            .Include(e => e.AccessPolicy)
            .FirstOrDefaultAsync(e => e.Id == examId);

        if (exam == null)
            return ApiResponse<ExamShareLinkDto>.FailureResponse("Exam not found");

        if (!exam.IsPublished)
            return ApiResponse<ExamShareLinkDto>.FailureResponse("Exam must be published before sharing");

        if (!exam.IsActive)
            return ApiResponse<ExamShareLinkDto>.FailureResponse("Exam is not active");

        // Deactivate any existing share link for this exam (one link per exam)
        var existingLink = await _context.Set<ExamShareLink>()
            .FirstOrDefaultAsync(l => l.ExamId == examId && l.IsActive && !l.IsDeleted);

        if (existingLink != null)
        {
            existingLink.IsActive = false;
            existingLink.UpdatedDate = DateTime.UtcNow;
            existingLink.UpdatedBy = createdBy;
        }

        // Determine expiry: use custom if provided, otherwise exam EndAt
        var expiresAt = dto?.ExpiresAt ?? exam.EndAt;

        // Generate cryptographically secure token
        var tokenBytes = new byte[48];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(tokenBytes);
        }
        var shareToken = Convert.ToBase64String(tokenBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');

        var shareLink = new ExamShareLink
        {
            ExamId = examId,
            ShareToken = shareToken,
            ExpiresAt = expiresAt,
            IsActive = true,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.Set<ExamShareLink>().Add(shareLink);
        await _context.SaveChangesAsync();

        _cache.RemoveByPrefix(CacheKeys.ExamSharePrefix);
        return ApiResponse<ExamShareLinkDto>.SuccessResponse(
            MapToDto(shareLink, baseUrl),
            "Share link generated successfully");
    }

    public async Task<ApiResponse<ExamShareLinkDto>> GetShareLinkAsync(int examId, string baseUrl)
    {
        var cacheKey = CacheKeys.ShareLinkByExam(examId);
        if (_cache.TryGet<ExamShareLinkDto>(cacheKey, out var cached) && cached != null)
            return ApiResponse<ExamShareLinkDto>.SuccessResponse(cached);

        var link = await _context.Set<ExamShareLink>()
            .FirstOrDefaultAsync(l => l.ExamId == examId && l.IsActive && !l.IsDeleted);

        if (link == null)
            return ApiResponse<ExamShareLinkDto>.FailureResponse("No active share link found for this exam");

        var dto = MapToDto(link, baseUrl);
        _cache.Set(cacheKey, dto, CacheKeys.Thirty);
        return ApiResponse<ExamShareLinkDto>.SuccessResponse(dto);
    }

    public async Task<ApiResponse<bool>> RevokeShareLinkAsync(int examId, string updatedBy)
    {
        var link = await _context.Set<ExamShareLink>()
            .FirstOrDefaultAsync(l => l.ExamId == examId && l.IsActive && !l.IsDeleted);

        if (link == null)
            return ApiResponse<bool>.FailureResponse("No active share link found for this exam");

        link.IsActive = false;
        link.UpdatedDate = DateTime.UtcNow;
        link.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();

        _cache.RemoveByPrefix(CacheKeys.ExamSharePrefix);
        return ApiResponse<bool>.SuccessResponse(true, "Share link revoked successfully");
    }

    // ========== Public endpoints ==========

    public async Task<ApiResponse<PublicExamInfoDto>> GetExamByShareTokenAsync(string shareToken)
    {
        var cacheKey = CacheKeys.ShareByToken(shareToken);
        if (_cache.TryGet<PublicExamInfoDto>(cacheKey, out var cachedInfo) && cachedInfo != null)
            return ApiResponse<PublicExamInfoDto>.SuccessResponse(cachedInfo);

        var link = await ValidateShareTokenAsync(shareToken);
        if (link == null)
            return ApiResponse<PublicExamInfoDto>.FailureResponse("Invalid or expired share link");

        var exam = link.Exam;

        // Get organization branding
        var org = await _context.OrganizationSettings
            .FirstOrDefaultAsync(o => o.IsActive);

        var accessPolicy = await _context.ExamAccessPolicies
            .FirstOrDefaultAsync(ap => ap.ExamId == exam.Id);

        var examInfo = new PublicExamInfoDto
        {
            ExamId = exam.Id,
            TitleEn = exam.TitleEn,
            TitleAr = exam.TitleAr,
            DescriptionEn = exam.DescriptionEn,
            DescriptionAr = exam.DescriptionAr,
            DurationMinutes = exam.DurationMinutes,
            MaxAttempts = exam.MaxAttempts,
            ExpiresAt = link.ExpiresAt,
            OrganizationName = org?.Name,
            OrganizationLogoUrl = org?.LogoPath,
            IsWalkIn = accessPolicy?.IsWalkIn ?? false
        };
        _cache.Set(cacheKey, examInfo, CacheKeys.Thirty);
        return ApiResponse<PublicExamInfoDto>.SuccessResponse(examInfo);
    }

    public async Task<ApiResponse<List<ShareCandidateDto>>> GetCandidatesByShareTokenAsync(
        string shareToken, string? search)
    {
        var link = await ValidateShareTokenAsync(shareToken);
        if (link == null)
            return ApiResponse<List<ShareCandidateDto>>.FailureResponse("Invalid or expired share link");

        var exam = link.Exam;
        var accessPolicy = await _context.ExamAccessPolicies
            .FirstOrDefaultAsync(ap => ap.ExamId == exam.Id);

        // Determine candidate list based on access policy
        IQueryable<ApplicationUser> candidateQuery;

        if (accessPolicy != null && accessPolicy.RestrictToAssignedCandidates)
        {
            // Only assigned candidates
            var assignedCandidateIds = _context.ExamAssignments
                .Where(a => a.ExamId == exam.Id && a.IsActive && !a.IsDeleted)
                .Select(a => a.CandidateId);

            candidateQuery = _userManager.Users
                .Where(u => assignedCandidateIds.Contains(u.Id) && !u.IsDeleted && !u.IsBlocked);
        }
        else
        {
            // Public exam — list all active candidates
            var candidateRoleId = await _context.Roles
                .Where(r => r.Name == AppRoles.Candidate)
                .Select(r => r.Id)
                .FirstOrDefaultAsync();

            if (candidateRoleId == null)
                return ApiResponse<List<ShareCandidateDto>>.FailureResponse("Candidate role not configured");

            var candidateUserIds = _context.UserRoles
                .Where(ur => ur.RoleId == candidateRoleId)
                .Select(ur => ur.UserId);

            candidateQuery = _userManager.Users
                .Where(u => candidateUserIds.Contains(u.Id) && !u.IsDeleted && !u.IsBlocked);
        }

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            candidateQuery = candidateQuery.Where(u =>
                (u.FullName != null && u.FullName.ToLower().Contains(searchLower)) ||
                (u.FullNameAr != null && u.FullNameAr.ToLower().Contains(searchLower)) ||
                (u.RollNo != null && u.RollNo.ToLower().Contains(searchLower)) ||
                (u.Email != null && u.Email.ToLower().Contains(searchLower)));
        }

        var candidates = await candidateQuery
            .OrderBy(u => u.FullName)
            .Take(50) // Limit for performance
            .Select(u => new { u.Id, u.FullName, u.FullNameAr, u.RollNo })
            .ToListAsync();

        // Check attempt status for each candidate
        var candidateIds = candidates.Select(c => c.Id).ToList();
        var attemptCounts = await _context.Attempts
            .Where(a => a.ExamId == exam.Id && candidateIds.Contains(a.CandidateId) && !a.IsDeleted)
            .GroupBy(a => a.CandidateId)
            .Select(g => new
            {
                CandidateId = g.Key,
                TotalAttempts = g.Count(),
                HasActiveAttempt = g.Any(a =>
                    a.Status == AttemptStatus.Started ||
                    a.Status == AttemptStatus.InProgress ||
                    a.Status == AttemptStatus.Paused)
            })
            .ToListAsync();

        var result = candidates.Select(c =>
        {
            var attemptInfo = attemptCounts.FirstOrDefault(a => a.CandidateId == c.Id);
            var exhausted = exam.MaxAttempts > 0 && attemptInfo != null && attemptInfo.TotalAttempts >= exam.MaxAttempts;
            var hasActive = attemptInfo?.HasActiveAttempt ?? false;

            string? statusMessage = null;
            if (exhausted)
                statusMessage = "This candidate has already exhausted all attempts. Please select another candidate.";
            else if (hasActive)
                statusMessage = "This candidate has an active attempt in progress.";

            return new ShareCandidateDto
            {
                Id = c.Id,
                FullName = c.FullName,
                FullNameAr = c.FullNameAr,
                RollNo = c.RollNo,
                HasExhaustedAttempts = exhausted,
                StatusMessage = statusMessage
            };
        }).ToList();

        return ApiResponse<List<ShareCandidateDto>>.SuccessResponse(result);
    }

    public async Task<ApiResponse<SelectCandidateResponseDto>> SelectCandidateAsync(
        string shareToken, SelectCandidateDto dto)
    {
        var link = await ValidateShareTokenAsync(shareToken);
        if (link == null)
            return ApiResponse<SelectCandidateResponseDto>.FailureResponse("Invalid or expired share link");

        var exam = link.Exam;

        // Validate candidate exists and is active
        var candidate = await _userManager.Users
            .FirstOrDefaultAsync(u => u.Id == dto.CandidateId && !u.IsDeleted && !u.IsBlocked);

        if (candidate == null)
            return ApiResponse<SelectCandidateResponseDto>.FailureResponse("Candidate not found or is blocked");

        // Verify candidate is eligible (assigned if restricted)
        var accessPolicy = await _context.ExamAccessPolicies
            .FirstOrDefaultAsync(ap => ap.ExamId == exam.Id);

        if (accessPolicy != null && accessPolicy.RestrictToAssignedCandidates)
        {
            var isAssigned = await _context.ExamAssignments
                .AnyAsync(a => a.ExamId == exam.Id && a.CandidateId == dto.CandidateId && a.IsActive && !a.IsDeleted);

            if (!isAssigned)
                return ApiResponse<SelectCandidateResponseDto>.FailureResponse("This candidate is not assigned to this exam");
        }

        // Check attempt limits
        var attemptCount = await _context.Attempts
            .CountAsync(a => a.ExamId == exam.Id && a.CandidateId == dto.CandidateId && !a.IsDeleted);

        if (exam.MaxAttempts > 0 && attemptCount >= exam.MaxAttempts)
            return ApiResponse<SelectCandidateResponseDto>.FailureResponse(
                "This candidate has already exhausted all attempts. No attempts left. Please select another candidate.");

        // Generate JWT token for candidate
        var roles = await _userManager.GetRolesAsync(candidate);
        if (!roles.Contains(AppRoles.Candidate))
            roles.Add(AppRoles.Candidate);

        var accessToken = _tokenService.GenerateAccessToken(candidate, roles);
        var refreshToken = _tokenService.GenerateRefreshToken();

        // Store refresh token
        candidate.RefreshToken = refreshToken;
        candidate.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(candidate);

        return ApiResponse<SelectCandidateResponseDto>.SuccessResponse(new SelectCandidateResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            Expiration = DateTime.UtcNow.AddHours(1),
            ExamId = exam.Id,
            CandidateId = candidate.Id,
            CandidateName = candidate.FullName ?? candidate.DisplayName ?? candidate.Email
        });
    }

    public async Task<ApiResponse<SelectCandidateResponseDto>> WalkInRegisterAsync(
        string shareToken, WalkInRegisterDto dto)
    {
        var link = await ValidateShareTokenAsync(shareToken);
        if (link == null)
            return ApiResponse<SelectCandidateResponseDto>.FailureResponse("Invalid or expired share link");

        var exam = link.Exam;

        // Verify this exam is configured for walk-in
        var accessPolicy = await _context.ExamAccessPolicies
            .FirstOrDefaultAsync(ap => ap.ExamId == exam.Id);

        if (accessPolicy == null || !accessPolicy.IsWalkIn)
            return ApiResponse<SelectCandidateResponseDto>.FailureResponse("This exam does not allow walk-in registration");

        // Normalize email
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        // Check if a user with this email already exists
        var existingUser = await _userManager.FindByEmailAsync(normalizedEmail);

        if (existingUser != null)
        {
            // Reject if blocked or deleted
            if (existingUser.IsBlocked || existingUser.IsDeleted)
                return ApiResponse<SelectCandidateResponseDto>.FailureResponse("This account has been blocked. Please contact support.");

            // Check they have the Candidate role
            var existingRoles = await _userManager.GetRolesAsync(existingUser);
            if (!existingRoles.Contains(AppRoles.Candidate))
                return ApiResponse<SelectCandidateResponseDto>.FailureResponse("This email is already registered with a different account type. Please contact support.");

            // Check attempt limits
            var attemptCount = await _context.Attempts
                .CountAsync(a => a.ExamId == exam.Id && a.CandidateId == existingUser.Id && !a.IsDeleted);
            if (exam.MaxAttempts > 0 && attemptCount >= exam.MaxAttempts)
                return ApiResponse<SelectCandidateResponseDto>.FailureResponse("You have already used all available attempts for this exam.");

            // Re-issue JWT
            var accessToken = _tokenService.GenerateAccessToken(existingUser, existingRoles.ToList());
            var refreshToken = _tokenService.GenerateRefreshToken();
            existingUser.RefreshToken = refreshToken;
            existingUser.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _userManager.UpdateAsync(existingUser);

            return ApiResponse<SelectCandidateResponseDto>.SuccessResponse(new SelectCandidateResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                Expiration = DateTime.UtcNow.AddHours(1),
                ExamId = exam.Id,
                CandidateId = existingUser.Id,
                CandidateName = existingUser.FullName ?? existingUser.DisplayName ?? existingUser.Email
            });
        }

        // --- New walk-in candidate ---
        // All walk-in candidates share a fixed default password.
        // They authenticate via the share link each time — no password login flow.
        const string password = "Candidate@3376Exam";

        var newUser = new ApplicationUser
        {
            UserName = normalizedEmail,
            Email = normalizedEmail,
            NormalizedEmail = normalizedEmail.ToUpperInvariant(),
            NormalizedUserName = normalizedEmail.ToUpperInvariant(),
            FullName = dto.FullName.Trim(),
            DisplayName = dto.FullName.Trim(),
            PhoneNumber = dto.PhoneNumber.Trim(),
            IsWalkIn = true,
            EmailConfirmed = true, // no email verification flow for walk-in
            CreatedDate = DateTime.UtcNow,
            Status = UserStatus.Active
        };

        var createResult = await _userManager.CreateAsync(newUser, password);
        if (!createResult.Succeeded)
        {
            var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
            return ApiResponse<SelectCandidateResponseDto>.FailureResponse($"Registration failed: {errors}");
        }

        // Ensure Candidate role exists and assign it
        if (!await _roleManager.RoleExistsAsync(AppRoles.Candidate))
            await _roleManager.CreateAsync(new ApplicationRole { Name = AppRoles.Candidate });

        await _userManager.AddToRoleAsync(newUser, AppRoles.Candidate);

        // Issue JWT
        var roles = new List<string> { AppRoles.Candidate };
        var token = _tokenService.GenerateAccessToken(newUser, roles);
        var refresh = _tokenService.GenerateRefreshToken();
        newUser.RefreshToken = refresh;
        newUser.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(newUser);

        return ApiResponse<SelectCandidateResponseDto>.SuccessResponse(new SelectCandidateResponseDto
        {
            AccessToken = token,
            RefreshToken = refresh,
            Expiration = DateTime.UtcNow.AddHours(1),
            ExamId = exam.Id,
            CandidateId = newUser.Id,
            CandidateName = newUser.FullName
        });
    }

    // ========== Helpers ==========

    private async Task<ExamShareLink?> ValidateShareTokenAsync(string shareToken)
    {
        var link = await _context.Set<ExamShareLink>()
            .Include(l => l.Exam)
            .FirstOrDefaultAsync(l =>
                l.ShareToken == shareToken &&
                l.IsActive &&
                !l.IsDeleted);

        if (link == null)
            return null;

        // Check expiry
        if (link.ExpiresAt.HasValue && link.ExpiresAt.Value < DateTime.UtcNow)
            return null;

        // Verify exam is still published and active
        if (!link.Exam.IsPublished || !link.Exam.IsActive)
            return null;

        return link;
    }

    private static ExamShareLinkDto MapToDto(ExamShareLink link, string baseUrl)
    {
        var cleanBase = baseUrl.TrimEnd('/');
        return new ExamShareLinkDto
        {
            Id = link.Id,
            ExamId = link.ExamId,
            ShareToken = link.ShareToken,
            ShareUrl = $"{cleanBase}/share/{link.ShareToken}",
            ExpiresAt = link.ExpiresAt,
            IsActive = link.IsActive,
            CreatedDate = link.CreatedDate
        };
    }
}
