using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.ExamResult;
using Smart_Core.Domain.Entities.Proctor;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Authorization;

public class ResourceAuthorizationService
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICurrentUserService _currentUserService;

    public ResourceAuthorizationService(
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        ICurrentUserService currentUserService)
    {
        _db = db;
        _userManager = userManager;
        _currentUserService = currentUserService;
    }

    public string? CurrentUserId => _currentUserService.UserId;

    public Task<bool> IsCurrentUserSuperAdminAsync()
        => IsUserSuperAdminAsync(_currentUserService.UserId);

    public async Task<int?> GetCurrentUserDepartmentIdAsync()
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrWhiteSpace(userId))
            return null;

        return await _db.Users
            .Where(u => u.Id == userId && !u.IsDeleted)
            .Select(u => u.DepartmentId)
            .FirstOrDefaultAsync();
    }

    public async Task<string> GetCurrentScopeCacheKeyAsync()
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrWhiteSpace(userId))
            return "scope:anonymous";

        if (await IsUserSuperAdminAsync(userId))
            return "scope:all";

        var roles = await GetUserRolesAsync(userId);
        if (IsCandidateOnly(roles))
            return $"scope:candidate:{userId}";

        var departmentId = await GetUserDepartmentIdAsync(userId);
        return departmentId.HasValue ? $"scope:dept:{departmentId.Value}" : $"scope:user:{userId}";
    }

    public Task<bool> CanAccessExamAsync(int examId)
        => CanAccessExamForUserAsync(examId, _currentUserService.UserId);

    public Task<IQueryable<int>> GetAccessibleExamIdsAsync()
        => GetAccessibleExamIdsForUserAsync(_currentUserService.UserId);

    public async Task<IQueryable<int>> GetAccessibleExamIdsForUserAsync(string? userId)
    {
        var exams = _db.Exams.Where(e => !e.IsDeleted);
        if (string.IsNullOrWhiteSpace(userId))
            return exams.Where(_ => false).Select(e => e.Id);

        if (await IsUserSuperAdminAsync(userId))
            return exams.Select(e => e.Id);

        var roles = await GetUserRolesAsync(userId);
        if (IsCandidateOnly(roles))
        {
            var assignedExamIds = _db.ExamAssignments
                .Where(a => a.CandidateId == userId && a.IsActive && !a.IsDeleted)
                .Select(a => a.ExamId);

            var attemptedExamIds = _db.Attempts
                .Where(a => a.CandidateId == userId && !a.IsDeleted)
                .Select(a => a.ExamId);

            return assignedExamIds.Union(attemptedExamIds);
        }

        var departmentId = await GetUserDepartmentIdAsync(userId);
        if (departmentId.HasValue)
        {
            return exams
                .Where(e => e.DepartmentId == departmentId.Value ||
                    _db.ExamProctors.Any(ep => ep.ExamId == e.Id && ep.ProctorId == userId && !ep.IsDeleted))
                .Select(e => e.Id);
        }

        return _db.ExamProctors
            .Where(ep => ep.ProctorId == userId && !ep.IsDeleted)
            .Select(ep => ep.ExamId);
    }

    public async Task<bool> CanAccessExamForUserAsync(int examId, string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return false;

        if (await IsUserSuperAdminAsync(userId))
            return true;

        var user = await _db.Users
            .Where(u => u.Id == userId && !u.IsDeleted)
            .Select(u => new { u.Id, u.DepartmentId })
            .FirstOrDefaultAsync();
        if (user == null)
            return false;

        var roles = await GetUserRolesAsync(userId);
        if (IsCandidateOnly(roles))
        {
            return await _db.ExamAssignments.AnyAsync(a =>
                       a.ExamId == examId &&
                       a.CandidateId == userId &&
                       a.IsActive &&
                       !a.IsDeleted)
                   || await _db.Attempts.AnyAsync(a =>
                       a.ExamId == examId &&
                       a.CandidateId == userId &&
                       !a.IsDeleted);
        }

        var hasDepartmentAccess = user.DepartmentId.HasValue &&
            await _db.Exams.AnyAsync(e =>
                e.Id == examId &&
                !e.IsDeleted &&
                e.DepartmentId == user.DepartmentId.Value);

        if (hasDepartmentAccess)
            return true;

        return await _db.ExamProctors.AnyAsync(ep =>
            ep.ExamId == examId &&
            ep.ProctorId == userId &&
            !ep.IsDeleted);
    }

    public Task<bool> CanAccessAttemptAsync(int attemptId)
        => CanAccessAttemptForUserAsync(attemptId, _currentUserService.UserId);

    public async Task<bool> CanAccessAttemptForUserAsync(int attemptId, string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return false;

        var attempt = await _db.Attempts
            .Where(a => a.Id == attemptId && !a.IsDeleted)
            .Select(a => new { a.ExamId, a.CandidateId })
            .FirstOrDefaultAsync();
        if (attempt == null)
            return false;

        if (attempt.CandidateId == userId)
            return true;

        return await CanAccessExamForUserAsync(attempt.ExamId, userId);
    }

    public Task<bool> CanAccessResultAsync(int resultId)
        => CanAccessResultForUserAsync(resultId, _currentUserService.UserId);

    public async Task<bool> CanAccessResultForUserAsync(int resultId, string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return false;

        var result = await _db.Results
            .Where(r => r.Id == resultId)
            .Select(r => new { r.ExamId, r.CandidateId })
            .FirstOrDefaultAsync();
        if (result == null)
            return false;

        if (result.CandidateId == userId)
            return true;

        return await CanAccessExamForUserAsync(result.ExamId, userId);
    }

    public Task<bool> CanAccessProctorSessionAsync(int sessionId)
        => CanAccessProctorSessionForUserAsync(sessionId, _currentUserService.UserId);

    public async Task<bool> CanAccessProctorSessionForUserAsync(int sessionId, string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return false;

        var session = await _db.ProctorSessions
            .Where(s => s.Id == sessionId)
            .Select(s => new { s.ExamId, s.CandidateId })
            .FirstOrDefaultAsync();
        if (session == null)
            return false;

        if (session.CandidateId == userId)
            return true;

        return await CanAccessExamForUserAsync(session.ExamId, userId);
    }

    public async Task<bool> CanAccessEvidenceAsync(int evidenceId, string? userId = null)
    {
        userId ??= _currentUserService.UserId;
        if (string.IsNullOrWhiteSpace(userId))
            return false;

        var sessionId = await _db.ProctorEvidence
            .Where(e => e.Id == evidenceId)
            .Select(e => (int?)e.ProctorSessionId)
            .FirstOrDefaultAsync();
        return sessionId.HasValue && await CanAccessProctorSessionForUserAsync(sessionId.Value, userId);
    }

    public Task<bool> CanAccessCandidateAsync(string candidateId)
        => CanAccessCandidateForUserAsync(candidateId, _currentUserService.UserId);

    public async Task<bool> CanAccessCandidateForUserAsync(string candidateId, string? userId)
    {
        if (string.IsNullOrWhiteSpace(candidateId) || string.IsNullOrWhiteSpace(userId))
            return false;

        if (candidateId == userId)
            return true;

        if (await IsUserSuperAdminAsync(userId))
            return true;

        if (!await UserIsInRoleAsync(candidateId, AppRoles.Candidate))
            return false;

        var actorDepartmentId = await GetUserDepartmentIdAsync(userId);
        var candidateDepartmentId = await GetUserDepartmentIdAsync(candidateId);
        if (actorDepartmentId.HasValue && candidateDepartmentId == actorDepartmentId.Value)
            return true;

        if (actorDepartmentId.HasValue)
        {
            var hasDepartmentAttempt = await _db.Attempts.AnyAsync(a =>
                a.CandidateId == candidateId &&
                !a.IsDeleted &&
                a.Exam.DepartmentId == actorDepartmentId.Value);

            if (hasDepartmentAttempt)
                return true;

            var hasDepartmentAssignment = await _db.ExamAssignments.AnyAsync(a =>
                a.CandidateId == candidateId &&
                a.IsActive &&
                !a.IsDeleted &&
                a.Exam.DepartmentId == actorDepartmentId.Value);

            if (hasDepartmentAssignment)
                return true;
        }

        return await _db.Attempts.AnyAsync(a =>
                   a.CandidateId == candidateId &&
                   !a.IsDeleted &&
                   _db.ExamProctors.Any(ep => ep.ExamId == a.ExamId && ep.ProctorId == userId && !ep.IsDeleted))
               || await _db.ExamAssignments.AnyAsync(a =>
                   a.CandidateId == candidateId &&
                   a.IsActive &&
                   !a.IsDeleted &&
                   _db.ExamProctors.Any(ep => ep.ExamId == a.ExamId && ep.ProctorId == userId && !ep.IsDeleted));
    }

    public Task<bool> CanAccessUserAsync(string targetUserId)
        => CanAccessUserForUserAsync(targetUserId, _currentUserService.UserId);

    public async Task<bool> CanAccessUserForUserAsync(string targetUserId, string? userId)
    {
        if (string.IsNullOrWhiteSpace(targetUserId) || string.IsNullOrWhiteSpace(userId))
            return false;

        if (targetUserId == userId)
            return true;

        if (await IsUserSuperAdminAsync(userId))
            return true;

        if (await UserIsInRoleAsync(targetUserId, AppRoles.Candidate))
            return await CanAccessCandidateForUserAsync(targetUserId, userId);

        var actorDepartmentId = await GetUserDepartmentIdAsync(userId);
        if (!actorDepartmentId.HasValue)
            return false;

        return await _db.Users.AnyAsync(u =>
            u.Id == targetUserId &&
            !u.IsDeleted &&
            u.DepartmentId == actorDepartmentId.Value);
    }

    public async Task<IQueryable<Domain.Entities.Attempt.Attempt>> ScopeAttemptsAsync(
        IQueryable<Domain.Entities.Attempt.Attempt> query)
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrWhiteSpace(userId))
            return query.Where(_ => false);

        if (await IsUserSuperAdminAsync(userId))
            return query;

        var roles = await GetUserRolesAsync(userId);
        if (IsCandidateOnly(roles))
            return query.Where(a => a.CandidateId == userId);

        var departmentId = await GetUserDepartmentIdAsync(userId);
        if (departmentId.HasValue)
        {
            return query.Where(a =>
                a.Exam.DepartmentId == departmentId.Value ||
                _db.ExamProctors.Any(ep => ep.ExamId == a.ExamId && ep.ProctorId == userId && !ep.IsDeleted));
        }

        return query.Where(a =>
            _db.ExamProctors.Any(ep => ep.ExamId == a.ExamId && ep.ProctorId == userId && !ep.IsDeleted));
    }

    public Task<IQueryable<Result>> ScopeResultsAsync(IQueryable<Result> query)
        => ScopeResultsForUserAsync(query, _currentUserService.UserId);

    public async Task<IQueryable<Result>> ScopeResultsForUserAsync(IQueryable<Result> query, string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return query.Where(_ => false);

        if (await IsUserSuperAdminAsync(userId))
            return query;

        var roles = await GetUserRolesAsync(userId);
        if (IsCandidateOnly(roles))
            return query.Where(r => r.CandidateId == userId);

        var departmentId = await GetUserDepartmentIdAsync(userId);
        if (departmentId.HasValue)
        {
            return query.Where(r =>
                r.Exam.DepartmentId == departmentId.Value ||
                _db.ExamProctors.Any(ep => ep.ExamId == r.ExamId && ep.ProctorId == userId && !ep.IsDeleted));
        }

        return query.Where(r =>
            _db.ExamProctors.Any(ep => ep.ExamId == r.ExamId && ep.ProctorId == userId && !ep.IsDeleted));
    }

    public async Task<IQueryable<ProctorSession>> ScopeProctorSessionsAsync(IQueryable<ProctorSession> query)
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrWhiteSpace(userId))
            return query.Where(_ => false);

        if (await IsUserSuperAdminAsync(userId))
            return query;

        var roles = await GetUserRolesAsync(userId);
        if (IsCandidateOnly(roles))
            return query.Where(s => s.CandidateId == userId);

        var departmentId = await GetUserDepartmentIdAsync(userId);
        if (departmentId.HasValue)
        {
            return query.Where(s =>
                s.Exam.DepartmentId == departmentId.Value ||
                _db.ExamProctors.Any(ep => ep.ExamId == s.ExamId && ep.ProctorId == userId && !ep.IsDeleted));
        }

        return query.Where(s =>
            _db.ExamProctors.Any(ep => ep.ExamId == s.ExamId && ep.ProctorId == userId && !ep.IsDeleted));
    }

    public async Task<IQueryable<ApplicationUser>> ScopeUsersAsync(IQueryable<ApplicationUser> query)
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrWhiteSpace(userId))
            return query.Where(_ => false);

        if (await IsUserSuperAdminAsync(userId))
            return query;

        var roles = await GetUserRolesAsync(userId);
        if (IsCandidateOnly(roles))
            return query.Where(u => u.Id == userId);

        var departmentId = await GetUserDepartmentIdAsync(userId);
        if (departmentId.HasValue)
        {
            var departmentCandidateIdsFromAttempts = _db.Attempts
                .Where(a => !a.IsDeleted && a.Exam.DepartmentId == departmentId.Value)
                .Select(a => a.CandidateId);

            var departmentCandidateIdsFromAssignments = _db.ExamAssignments
                .Where(a => a.IsActive && !a.IsDeleted && a.Exam.DepartmentId == departmentId.Value)
                .Select(a => a.CandidateId);

            return query.Where(u =>
                u.Id == userId ||
                u.DepartmentId == departmentId.Value ||
                departmentCandidateIdsFromAttempts.Contains(u.Id) ||
                departmentCandidateIdsFromAssignments.Contains(u.Id));
        }

        var assignedCandidateIdsFromAttempts = _db.Attempts
            .Where(a => !a.IsDeleted &&
                _db.ExamProctors.Any(ep => ep.ExamId == a.ExamId && ep.ProctorId == userId && !ep.IsDeleted))
            .Select(a => a.CandidateId);

        var assignedCandidateIdsFromAssignments = _db.ExamAssignments
            .Where(a => a.IsActive && !a.IsDeleted &&
                _db.ExamProctors.Any(ep => ep.ExamId == a.ExamId && ep.ProctorId == userId && !ep.IsDeleted))
            .Select(a => a.CandidateId);

        return query.Where(u =>
            u.Id == userId ||
            assignedCandidateIdsFromAttempts.Contains(u.Id) ||
            assignedCandidateIdsFromAssignments.Contains(u.Id));
    }

    private async Task<bool> IsUserSuperAdminAsync(string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return false;

        var user = await _userManager.FindByIdAsync(userId);
        return user != null && await _userManager.IsInRoleAsync(user, AppRoles.SuperAdmin);
    }

    private async Task<IList<string>> GetUserRolesAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        return user == null ? Array.Empty<string>() : await _userManager.GetRolesAsync(user);
    }

    private async Task<bool> UserIsInRoleAsync(string userId, string roleName)
    {
        var user = await _userManager.FindByIdAsync(userId);
        return user != null && await _userManager.IsInRoleAsync(user, roleName);
    }

    private async Task<int?> GetUserDepartmentIdAsync(string userId)
    {
        return await _db.Users
            .Where(u => u.Id == userId && !u.IsDeleted)
            .Select(u => u.DepartmentId)
            .FirstOrDefaultAsync();
    }

    private static bool IsCandidateOnly(IList<string> roles)
    {
        return roles.Contains(AppRoles.Candidate) &&
               !roles.Contains(AppRoles.Admin) &&
               !roles.Contains(AppRoles.Instructor) &&
               !roles.Contains(AppRoles.Examiner) &&
               !roles.Contains(AppRoles.Proctor) &&
               !roles.Contains(AppRoles.SuperAdmin);
    }
}
