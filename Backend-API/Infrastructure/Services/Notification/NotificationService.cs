using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Notification;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Notification;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Notification;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _db;
    private readonly IEncryptionService _encryption;
    private readonly IEmailService _emailService;
    private readonly ISmsService _smsService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        ApplicationDbContext db,
        IEncryptionService encryption,
        IEmailService emailService,
        ISmsService smsService,
        ILogger<NotificationService> logger)
    {
        _db = db;
        _encryption = encryption;
        _emailService = emailService;
        _smsService = smsService;
        _logger = logger;
    }

    // ── Settings ────────────────────────────────────────────────

    public async Task<ApiResponse<NotificationSettingsDto>> GetNotificationSettingsAsync()
    {
        var entity = await GetOrCreateSettingsAsync();
        return ApiResponse<NotificationSettingsDto>.SuccessResponse(MapSettingsToDto(entity));
    }

    public async Task<ApiResponse<NotificationSettingsDto>> UpdateNotificationSettingsAsync(
        NotificationSettingsDto dto, string updatedBy)
    {
        var entity = await GetOrCreateSettingsAsync();

        entity.SmtpHost = dto.SmtpHost;
        entity.SmtpPort = dto.SmtpPort;
        entity.SmtpUsername = dto.SmtpUsername;
        entity.SmtpFromEmail = dto.SmtpFromEmail;
        entity.SmtpFromName = dto.SmtpFromName;
        entity.SmtpEnableSsl = dto.SmtpEnableSsl;
        entity.EnableEmail = dto.EnableEmail;

        // Only update password if provided (not masked)
        if (!string.IsNullOrEmpty(dto.SmtpPassword) && dto.SmtpPassword != "********")
            entity.SmtpPasswordEncrypted = _encryption.Encrypt(dto.SmtpPassword);

        entity.EnableSms = dto.EnableSms;
        entity.SmsProvider = dto.SmsProvider;
        entity.SmsAccountSid = dto.SmsAccountSid;
        entity.SmsFromNumber = dto.SmsFromNumber;
        entity.CustomSmsApiUrl = dto.CustomSmsApiUrl;
        entity.CustomSmsApiKey = dto.CustomSmsApiKey;

        if (!string.IsNullOrEmpty(dto.SmsAuthToken) && dto.SmsAuthToken != "********")
            entity.SmsAuthTokenEncrypted = _encryption.Encrypt(dto.SmsAuthToken);

        entity.EmailBatchSize = dto.EmailBatchSize;
        entity.SmsBatchSize = dto.SmsBatchSize;
        entity.BatchDelayMs = dto.BatchDelayMs;
        entity.LoginUrl = dto.LoginUrl;

        entity.UpdatedBy = updatedBy;
        entity.UpdatedDate = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ApiResponse<NotificationSettingsDto>.SuccessResponse(MapSettingsToDto(entity), "Notification settings updated.");
    }

    // ── Templates ───────────────────────────────────────────────

    public async Task<ApiResponse<List<NotificationTemplateDto>>> GetTemplatesAsync()
    {
        var templates = await _db.NotificationTemplates
            .OrderBy(t => t.EventType)
            .ToListAsync();

        // Seed default templates if none exist
        if (templates.Count == 0)
        {
            templates = await SeedDefaultTemplatesAsync();
        }

        var dtos = templates.Select(MapTemplateToDto).ToList();
        return ApiResponse<List<NotificationTemplateDto>>.SuccessResponse(dtos);
    }

    public async Task<ApiResponse<NotificationTemplateDto>> GetTemplateByEventAsync(int eventType)
    {
        var template = await _db.NotificationTemplates
            .FirstOrDefaultAsync(t => (int)t.EventType == eventType);

        if (template == null)
            return ApiResponse<NotificationTemplateDto>.FailureResponse("Template not found.");

        return ApiResponse<NotificationTemplateDto>.SuccessResponse(MapTemplateToDto(template));
    }

    public async Task<ApiResponse<NotificationTemplateDto>> UpdateTemplateAsync(
        int eventType, UpdateNotificationTemplateDto dto, string updatedBy)
    {
        var template = await _db.NotificationTemplates
            .FirstOrDefaultAsync(t => (int)t.EventType == eventType);

        if (template == null)
            return ApiResponse<NotificationTemplateDto>.FailureResponse("Template not found.");

        template.SubjectEn = dto.SubjectEn;
        template.SubjectAr = dto.SubjectAr;
        template.BodyEn = dto.BodyEn;
        template.BodyAr = dto.BodyAr;
        template.IsActive = dto.IsActive;
        template.UpdatedBy = updatedBy;
        template.UpdatedDate = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ApiResponse<NotificationTemplateDto>.SuccessResponse(
            MapTemplateToDto(template), "Template updated.");
    }

    // ── Logs ────────────────────────────────────────────────────

    public async Task<ApiResponse<PaginatedResponse<NotificationLogDto>>> GetLogsAsync(
        NotificationLogFilterDto filter)
    {
        var query = _db.NotificationLogs
            .Include(l => l.Candidate)
            .Include(l => l.Exam)
            .AsQueryable();

        if (filter.Status.HasValue)
            query = query.Where(l => l.Status == filter.Status.Value);

        if (filter.Channel.HasValue)
            query = query.Where(l => l.Channel == filter.Channel.Value);

        if (filter.EventType.HasValue)
            query = query.Where(l => l.EventType == filter.EventType.Value);

        if (filter.ExamId.HasValue)
            query = query.Where(l => l.ExamId == filter.ExamId.Value);

        if (filter.DateFrom.HasValue)
            query = query.Where(l => l.CreatedDate >= filter.DateFrom.Value);

        if (filter.DateTo.HasValue)
            query = query.Where(l => l.CreatedDate <= filter.DateTo.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(l =>
                l.RecipientEmail.ToLower().Contains(search) ||
                (l.Candidate.FullName != null && l.Candidate.FullName.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync();

        var logs = await query
            .OrderByDescending(l => l.CreatedDate)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        var dtos = logs.Select(MapLogToDto).ToList();

        return ApiResponse<PaginatedResponse<NotificationLogDto>>.SuccessResponse(
            new PaginatedResponse<NotificationLogDto>
            {
                Items = dtos,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize,
                TotalCount = totalCount
            });
    }

    public async Task<ApiResponse<bool>> RetryNotificationAsync(int logId)
    {
        var log = await _db.NotificationLogs.FindAsync(logId);
        if (log == null)
            return ApiResponse<bool>.FailureResponse("Notification log not found.");

        if (log.Status != NotificationStatus.Failed)
            return ApiResponse<bool>.FailureResponse("Only failed notifications can be retried.");

        log.Status = NotificationStatus.Pending;
        log.ErrorMessage = null;
        log.RetryCount++;
        log.UpdatedDate = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResponse(true, "Notification queued for retry.");
    }

    // ── Test ────────────────────────────────────────────────────

    public async Task<ApiResponse<bool>> SendTestEmailAsync(TestEmailDto dto)
    {
        var result = await _emailService.SendEmailAsync(
            dto.ToEmail,
            "Smart Exam - Test Email",
            "<h2>Test Email</h2><p>This is a test email from Smart Exam notification system. If you received this, your SMTP configuration is working correctly.</p>");

        return result
            ? ApiResponse<bool>.SuccessResponse(true, "Test email sent successfully.")
            : ApiResponse<bool>.FailureResponse("Failed to send test email. Check your SMTP settings.");
    }

    public async Task<ApiResponse<bool>> SendTestSmsAsync(TestSmsDto dto)
    {
        var result = await _smsService.SendSmsAsync(
            dto.ToPhone,
            "Smart Exam - Test SMS. If you received this, your SMS configuration is working correctly.");

        return result
            ? ApiResponse<bool>.SuccessResponse(true, "Test SMS sent successfully.")
            : ApiResponse<bool>.FailureResponse("Failed to send test SMS. Check your SMS settings.");
    }

    // ── Event: Exam Published ───────────────────────────────────

    public async Task QueueExamPublishedNotificationsAsync(int examId)
    {
        var settings = await _db.NotificationSettings.FirstOrDefaultAsync();
        if (settings == null || (!settings.EnableEmail && !settings.EnableSms))
        {
            _logger.LogInformation("Notifications disabled. Skipping for exam {ExamId}.", examId);
            return;
        }

        var exam = await _db.Exams
            .Include(e => e.AccessPolicy)
            .FirstOrDefaultAsync(e => e.Id == examId);

        if (exam == null) return;

        // Determine candidates
        List<ApplicationUser> candidates;
        var accessPolicy = exam.AccessPolicy;

        if (accessPolicy != null && accessPolicy.RestrictToAssignedCandidates)
        {
            // Only assigned candidates
            var assignedUserIds = await _db.ExamAssignments
                .Where(a => a.ExamId == examId && a.IsActive)
                .Select(a => a.CandidateId)
                .ToListAsync();

            candidates = await _db.Users
                .Where(u => assignedUserIds.Contains(u.Id) && !u.IsDeleted && !u.IsBlocked)
                .ToListAsync();
        }
        else
        {
            // Public exam → all active candidates
            var candidateRole = "Candidate";
            var candidateRoleEntity = await _db.Roles.FirstOrDefaultAsync(r => r.Name == candidateRole);
            if (candidateRoleEntity == null) return;

            var candidateUserIds = await _db.UserRoles
                .Where(ur => ur.RoleId == candidateRoleEntity.Id)
                .Select(ur => ur.UserId)
                .ToListAsync();

            candidates = await _db.Users
                .Where(u => candidateUserIds.Contains(u.Id) && !u.IsDeleted && !u.IsBlocked
                    && u.Status == UserStatus.Active)
                .ToListAsync();
        }

        if (candidates.Count == 0)
        {
            _logger.LogInformation("No candidates to notify for exam {ExamId}.", examId);
            return;
        }

        // Create notification log entries (Pending)
        var logs = new List<NotificationLog>();

        foreach (var candidate in candidates)
        {
            if (settings.EnableEmail && !string.IsNullOrWhiteSpace(candidate.Email))
            {
                logs.Add(new NotificationLog
                {
                    CandidateId = candidate.Id,
                    ExamId = examId,
                    EventType = NotificationEventType.ExamPublished,
                    Channel = NotificationChannel.Email,
                    Status = NotificationStatus.Pending,
                    RecipientEmail = candidate.Email,
                    RecipientPhone = candidate.PhoneNumber,
                    CreatedDate = DateTime.UtcNow
                });
            }

            if (settings.EnableSms && !string.IsNullOrWhiteSpace(candidate.PhoneNumber))
            {
                logs.Add(new NotificationLog
                {
                    CandidateId = candidate.Id,
                    ExamId = examId,
                    EventType = NotificationEventType.ExamPublished,
                    Channel = NotificationChannel.Sms,
                    Status = NotificationStatus.Pending,
                    RecipientEmail = candidate.Email ?? string.Empty,
                    RecipientPhone = candidate.PhoneNumber,
                    CreatedDate = DateTime.UtcNow
                });
            }
        }

        if (logs.Count > 0)
        {
            _db.NotificationLogs.AddRange(logs);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Queued {Count} notifications for exam {ExamId}.", logs.Count, examId);
        }
    }

    // ── Helpers ──────────────────────────────────────────────────

    private async Task<NotificationSettings> GetOrCreateSettingsAsync()
    {
        var entity = await _db.NotificationSettings.FirstOrDefaultAsync();
        if (entity == null)
        {
            entity = new NotificationSettings();
            _db.NotificationSettings.Add(entity);
            await _db.SaveChangesAsync();
        }
        return entity;
    }

    private async Task<List<NotificationTemplate>> SeedDefaultTemplatesAsync()
    {
        var templates = new List<NotificationTemplate>
        {
            new()
            {
                EventType = NotificationEventType.ExamPublished,
                SubjectEn = "You're Invited: {{ExamTitle}} is Now Available",
                SubjectAr = "دعوة: {{ExamTitle}} متاح الآن",
                BodyEn = @"Dear {{CandidateName}},

You have been invited to take the following exam:

Exam: {{ExamTitle}}
Available From: {{ExamStartDate}}
Available Until: {{ExamEndDate}}
Duration: {{ExamDuration}} minutes

Your Login Credentials:
Username/Email: {{Username}}
Password: {{Password}}

Click here to login and start: {{LoginUrl}}

If you did not expect this email, please contact support at {{SupportEmail}}.

Good luck!",
                BodyAr = @"عزيزي {{CandidateName}}،

لقد تمت دعوتك لإجراء الاختبار التالي:

الاختبار: {{ExamTitle}}
متاح من: {{ExamStartDate}}
متاح حتى: {{ExamEndDate}}
المدة: {{ExamDuration}} دقيقة

بيانات تسجيل الدخول الخاصة بك:
اسم المستخدم/البريد الإلكتروني: {{Username}}
كلمة المرور: {{Password}}

انقر هنا لتسجيل الدخول والبدء: {{LoginUrl}}

إذا لم تكن تتوقع هذا البريد الإلكتروني، يرجى الاتصال بالدعم على {{SupportEmail}}.

بالتوفيق!",
                IsActive = true,
                CreatedDate = DateTime.UtcNow
            },
            new()
            {
                EventType = NotificationEventType.ResultPublished,
                SubjectEn = "Your Results for {{ExamTitle}} Are Ready",
                SubjectAr = "نتائج {{ExamTitle}} جاهزة",
                BodyEn = @"Dear {{CandidateName}},

Your results for the exam ""{{ExamTitle}}"" are now available.

Click here to view your results: {{LoginUrl}}

Best regards,
{{BrandName}} Team",
                BodyAr = @"عزيزي {{CandidateName}}،

نتائج اختبار ""{{ExamTitle}}"" متاحة الآن.

انقر هنا لعرض نتائجك: {{LoginUrl}}

مع أطيب التحيات،
فريق {{BrandName}}",
                IsActive = true,
                CreatedDate = DateTime.UtcNow
            },
            new()
            {
                EventType = NotificationEventType.ExamExpired,
                SubjectEn = "Exam {{ExamTitle}} Has Expired",
                SubjectAr = "انتهت صلاحية اختبار {{ExamTitle}}",
                BodyEn = @"Dear {{CandidateName}},

The exam ""{{ExamTitle}}"" has expired and is no longer available.

If you have any questions, please contact support at {{SupportEmail}}.

Best regards,
{{BrandName}} Team",
                BodyAr = @"عزيزي {{CandidateName}}،

انتهت صلاحية اختبار ""{{ExamTitle}}"" ولم يعد متاحاً.

إذا كان لديك أي أسئلة، يرجى الاتصال بالدعم على {{SupportEmail}}.

مع أطيب التحيات،
فريق {{BrandName}}",
                IsActive = true,
                CreatedDate = DateTime.UtcNow
            }
        };

        _db.NotificationTemplates.AddRange(templates);
        await _db.SaveChangesAsync();
        return templates;
    }

    private static NotificationSettingsDto MapSettingsToDto(NotificationSettings entity)
    {
        return new NotificationSettingsDto
        {
            SmtpHost = entity.SmtpHost,
            SmtpPort = entity.SmtpPort,
            SmtpUsername = entity.SmtpUsername,
            SmtpPassword = string.IsNullOrWhiteSpace(entity.SmtpPasswordEncrypted) ? null : "********",
            SmtpFromEmail = entity.SmtpFromEmail,
            SmtpFromName = entity.SmtpFromName,
            SmtpEnableSsl = entity.SmtpEnableSsl,
            EnableEmail = entity.EnableEmail,
            EnableSms = entity.EnableSms,
            SmsProvider = entity.SmsProvider,
            SmsAccountSid = entity.SmsAccountSid,
            SmsAuthToken = string.IsNullOrWhiteSpace(entity.SmsAuthTokenEncrypted) ? null : "********",
            SmsFromNumber = entity.SmsFromNumber,
            CustomSmsApiUrl = entity.CustomSmsApiUrl,
            CustomSmsApiKey = entity.CustomSmsApiKey,
            EmailBatchSize = entity.EmailBatchSize,
            SmsBatchSize = entity.SmsBatchSize,
            BatchDelayMs = entity.BatchDelayMs,
            LoginUrl = entity.LoginUrl
        };
    }

    private static NotificationTemplateDto MapTemplateToDto(NotificationTemplate entity)
    {
        return new NotificationTemplateDto
        {
            Id = entity.Id,
            EventType = entity.EventType,
            EventName = entity.EventType.ToString(),
            SubjectEn = entity.SubjectEn,
            SubjectAr = entity.SubjectAr,
            BodyEn = entity.BodyEn,
            BodyAr = entity.BodyAr,
            IsActive = entity.IsActive
        };
    }

    private static NotificationLogDto MapLogToDto(NotificationLog entity)
    {
        return new NotificationLogDto
        {
            Id = entity.Id,
            CandidateId = entity.CandidateId,
            CandidateName = entity.Candidate?.FullName ?? entity.Candidate?.DisplayName ?? "Unknown",
            ExamId = entity.ExamId,
            ExamTitle = entity.Exam?.TitleEn,
            EventType = entity.EventType,
            EventName = entity.EventType.ToString(),
            Channel = entity.Channel,
            ChannelName = entity.Channel.ToString(),
            Status = entity.Status,
            StatusName = entity.Status.ToString(),
            RecipientEmail = entity.RecipientEmail,
            RecipientPhone = entity.RecipientPhone,
            Subject = entity.Subject,
            ErrorMessage = entity.ErrorMessage,
            SentAt = entity.SentAt,
            CreatedDate = entity.CreatedDate,
            RetryCount = entity.RetryCount
        };
    }
}
