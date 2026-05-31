using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Notification;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Common;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Entities.Notification;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Hubs;

namespace Smart_Core.Infrastructure.Services.Notification;

public class UserNotificationService : IUserNotificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<UserNotificationService> _logger;

    public UserNotificationService(
        IUnitOfWork unitOfWork,
        IHubContext<NotificationHub> hubContext,
        UserManager<ApplicationUser> userManager,
        ILogger<UserNotificationService> logger)
    {
        _unitOfWork = unitOfWork;
        _hubContext = hubContext;
        _userManager = userManager;
        _logger = logger;
    }

    public async Task CreateAsync(
        string userId,
        UserNotificationType type,
        string titleEn, string titleAr,
        string messageEn, string messageAr,
        int? relatedExamId = null,
        int? relatedAttemptId = null)
    {
        // Enrich message with exam title (background lookup — no impact on caller)
        if (relatedExamId.HasValue)
        {
            var exam = await _unitOfWork.Context.Exams
                .Where(e => e.Id == relatedExamId.Value)
                .Select(e => new { e.TitleEn, e.TitleAr })
                .FirstOrDefaultAsync();
            if (exam != null)
            {
                messageEn += $" Exam: {exam.TitleEn}";
                messageAr += $" الاختبار: {exam.TitleAr}";
            }
        }
        var notification = new UserNotification
        {
            UserId = userId,
            Type = type,
            TitleEn = titleEn,
            TitleAr = titleAr,
            MessageEn = messageEn,
            MessageAr = messageAr,
            RelatedExamId = relatedExamId,
            RelatedAttemptId = relatedAttemptId,
            CreatedAt = UaeTimeHelper.NowUae
        };

        _unitOfWork.Context.UserNotifications.Add(notification);
        await _unitOfWork.Context.SaveChangesAsync();

        // Push real-time via SignalR (non-blocking — fire and forget)
        var dto = MapToDto(notification);
        _ = _hubContext.Clients
            .Group($"user-{userId}")
            .SendAsync("ReceiveNotification", dto);
    }

    public async Task CreateForRolesAsync(
        string[] roles,
        UserNotificationType type,
        string titleEn, string titleAr,
        string messageEn, string messageAr,
        int? relatedExamId = null,
        int? relatedAttemptId = null,
        string? actorUserId = null)
    {
        // Resolve exam name — from relatedExamId directly, or via the attempt's exam
        if (relatedExamId.HasValue)
        {
            var exam = await _unitOfWork.Context.Exams
                .Where(e => e.Id == relatedExamId.Value)
                .Select(e => new { e.TitleEn, e.TitleAr })
                .FirstOrDefaultAsync();
            if (exam != null)
            {
                messageEn += $" Exam: {exam.TitleEn}";
                messageAr += $" الاختبار: {exam.TitleAr}";
            }
        }
        else if (relatedAttemptId.HasValue)
        {
            var row = await _unitOfWork.Context.Attempts
                .Where(a => a.Id == relatedAttemptId.Value)
                .Select(a => new { a.Exam.TitleEn, a.Exam.TitleAr })
                .FirstOrDefaultAsync();
            if (row != null)
            {
                messageEn += $" Exam: {row.TitleEn}";
                messageAr += $" الاختبار: {row.TitleAr}";
            }
        }

        // Append candidate email when the actor (e.g. candidate) is known
        if (!string.IsNullOrEmpty(actorUserId))
        {
            var actor = await _userManager.FindByIdAsync(actorUserId);
            if (actor?.Email != null)
            {
                messageEn += $" Candidate: {actor.Email}";
                messageAr += $" المرشح: {actor.Email}";
            }
        }
        // Collect distinct user IDs across all given roles
        var userIds = new HashSet<string>();
        foreach (var role in roles)
        {
            var users = await _userManager.GetUsersInRoleAsync(role);
            foreach (var u in users)
                userIds.Add(u.Id);
        }

        if (userIds.Count == 0) return;

        var notifications = userIds.Select(uid => new UserNotification
        {
            UserId = uid,
            Type = type,
            TitleEn = titleEn,
            TitleAr = titleAr,
            MessageEn = messageEn,
            MessageAr = messageAr,
            RelatedExamId = relatedExamId,
            RelatedAttemptId = relatedAttemptId,
            CreatedAt = UaeTimeHelper.NowUae
        }).ToList();

        _unitOfWork.Context.UserNotifications.AddRange(notifications);
        await _unitOfWork.Context.SaveChangesAsync();

        // Push to all connected users in these roles (fire-and-forget)
        foreach (var n in notifications)
        {
            var dto = MapToDto(n);
            _ = _hubContext.Clients
                .Group($"user-{n.UserId}")
                .SendAsync("ReceiveNotification", dto);
        }
    }

    public async Task<UserNotificationPagedResultDto> GetPagedAsync(string userId, int page, int pageSize, bool? isRead = null)
    {
        var query = _unitOfWork.Context.UserNotifications
            .Where(n => n.UserId == userId);

        if (isRead.HasValue)
            query = query.Where(n => n.IsRead == isRead.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => MapToDto(n))
            .ToListAsync();

        return new UserNotificationPagedResultDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<int> GetUnreadCountAsync(string userId)
    {
        return await _unitOfWork.Context.UserNotifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task MarkAsReadAsync(string userId, int notificationId)
    {
        var notification = await _unitOfWork.Context.UserNotifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null || notification.IsRead) return;

        notification.IsRead = true;
        notification.ReadAt = UaeTimeHelper.NowUae;
        await _unitOfWork.Context.SaveChangesAsync();
    }

    public async Task MarkAllAsReadAsync(string userId)
    {
        var unread = await _unitOfWork.Context.UserNotifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        if (unread.Count == 0) return;

        var now = UaeTimeHelper.NowUae;
        foreach (var n in unread)
        {
            n.IsRead = true;
            n.ReadAt = now;
        }
        await _unitOfWork.Context.SaveChangesAsync();
    }

    public async Task CreateForRolesScopedAsync(
        string[] roles,
        UserNotificationType type,
        string titleEn, string titleAr,
        string messageEn, string messageAr,
        int? relatedExamId = null,
        int? relatedAttemptId = null,
        string? actorUserId = null)
    {
        // 1. Resolve the exam's department
        int? deptId = null;
        if (relatedExamId.HasValue)
        {
            deptId = await _unitOfWork.Context.Exams
                .Where(e => e.Id == relatedExamId.Value)
                .Select(e => (int?)e.DepartmentId)
                .FirstOrDefaultAsync();
        }
        else if (relatedAttemptId.HasValue)
        {
            deptId = await _unitOfWork.Context.Attempts
                .Where(a => a.Id == relatedAttemptId.Value)
                .Select(a => (int?)a.Exam.DepartmentId)
                .FirstOrDefaultAsync();
        }

        // If department cannot be resolved, fall back to global broadcast
        if (!deptId.HasValue)
        {
            _logger.LogWarning("CreateForRolesScopedAsync: could not resolve DepartmentId (examId={ExamId}, attemptId={AttemptId}). Falling back to unscoped broadcast.",
                relatedExamId, relatedAttemptId);
            await CreateForRolesAsync(roles, type, titleEn, titleAr, messageEn, messageAr,
                relatedExamId, relatedAttemptId, actorUserId);
            return;
        }

        // 2. Enrich messages with exam/attempt title (same pattern as CreateForRolesAsync)
        if (relatedExamId.HasValue)
        {
            var exam = await _unitOfWork.Context.Exams
                .Where(e => e.Id == relatedExamId.Value)
                .Select(e => new { e.TitleEn, e.TitleAr })
                .FirstOrDefaultAsync();
            if (exam != null)
            {
                messageEn += $" Exam: {exam.TitleEn}";
                messageAr += $" الاختبار: {exam.TitleAr}";
            }
        }
        else if (relatedAttemptId.HasValue)
        {
            var row = await _unitOfWork.Context.Attempts
                .Where(a => a.Id == relatedAttemptId.Value)
                .Select(a => new { a.Exam.TitleEn, a.Exam.TitleAr })
                .FirstOrDefaultAsync();
            if (row != null)
            {
                messageEn += $" Exam: {row.TitleEn}";
                messageAr += $" الاختبار: {row.TitleAr}";
            }
        }

        if (!string.IsNullOrEmpty(actorUserId))
        {
            var actor = await _userManager.FindByIdAsync(actorUserId);
            if (actor?.Email != null)
            {
                messageEn += $" Candidate: {actor.Email}";
                messageAr += $" المرشح: {actor.Email}";
            }
        }

        // 3. Collect scoped user IDs via direct EF query
        //    SuperAdmin → global (no department restriction)
        //    All other roles → filtered to users in the exam's department only
        var userIds = new HashSet<string>();
        foreach (var role in roles)
        {
            List<string> ids;
            if (role == AppRoles.SuperAdmin)
            {
                ids = await (
                    from u in _unitOfWork.Context.Users
                    join ur in _unitOfWork.Context.UserRoles on u.Id equals ur.UserId
                    join r in _unitOfWork.Context.Roles on ur.RoleId equals r.Id
                    where r.Name == role && !u.IsDeleted
                    select u.Id
                ).ToListAsync();
            }
            else
            {
                ids = await (
                    from u in _unitOfWork.Context.Users
                    join ur in _unitOfWork.Context.UserRoles on u.Id equals ur.UserId
                    join r in _unitOfWork.Context.Roles on ur.RoleId equals r.Id
                    where r.Name == role && !u.IsDeleted && u.DepartmentId == deptId
                    select u.Id
                ).ToListAsync();
            }
            foreach (var id in ids)
                userIds.Add(id);
        }

        if (userIds.Count == 0) return;

        // 4. Persist and push real-time via SignalR
        var notifications = userIds.Select(uid => new UserNotification
        {
            UserId = uid,
            Type = type,
            TitleEn = titleEn,
            TitleAr = titleAr,
            MessageEn = messageEn,
            MessageAr = messageAr,
            RelatedExamId = relatedExamId,
            RelatedAttemptId = relatedAttemptId,
            CreatedAt = UaeTimeHelper.NowUae
        }).ToList();

        _unitOfWork.Context.UserNotifications.AddRange(notifications);
        await _unitOfWork.Context.SaveChangesAsync();

        foreach (var n in notifications)
        {
            var dto = MapToDto(n);
            _ = _hubContext.Clients
                .Group($"user-{n.UserId}")
                .SendAsync("ReceiveNotification", dto);
        }
    }

    // ── Mapping ────────────────────────────────────────────────────────

    private static UserNotificationDto MapToDto(UserNotification n) => new()
    {
        Id = n.Id,
        TitleEn = n.TitleEn,
        TitleAr = n.TitleAr,
        MessageEn = n.MessageEn,
        MessageAr = n.MessageAr,
        Type = (int)n.Type,
        TypeName = n.Type.ToString(),
        IsRead = n.IsRead,
        ReadAt = n.ReadAt,
        CreatedAt = n.CreatedAt,
        RelatedExamId = n.RelatedExamId,
        RelatedAttemptId = n.RelatedAttemptId
    };
}
