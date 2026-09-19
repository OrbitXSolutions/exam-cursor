using FluentValidation;
using Smart_Core.Application.DTOs.Notification;

namespace Smart_Core.Application.Validators.Notification;

public sealed class NotificationSettingsDtoValidator : AbstractValidator<NotificationSettingsDto>
{
    public NotificationSettingsDtoValidator()
    {
        // Match the persisted column limits and the notification worker's supported bounds.
        RuleFor(x => x.SmtpHost).MaximumLength(500);
        RuleFor(x => x.SmtpUsername).MaximumLength(500);
        RuleFor(x => x.SmtpFromEmail).MaximumLength(500);
        RuleFor(x => x.SmtpFromName).MaximumLength(500);
        RuleFor(x => x.SmsAccountSid).MaximumLength(500);
        RuleFor(x => x.SmsFromNumber).MaximumLength(50);
        RuleFor(x => x.CustomSmsApiUrl).MaximumLength(2000);
        RuleFor(x => x.CustomSmsApiKey).MaximumLength(1000);
        RuleFor(x => x.LoginUrl).MaximumLength(2000);
        RuleFor(x => x.SmtpPort).InclusiveBetween(1, 65535);
        RuleFor(x => x.SmsProvider).IsInEnum();
        RuleFor(x => x.EmailBatchSize).InclusiveBetween(1, 500);
        RuleFor(x => x.SmsBatchSize).InclusiveBetween(1, 500);
        RuleFor(x => x.BatchDelayMs).InclusiveBetween(0, 60000);
    }
}

public sealed class UpdateNotificationTemplateDtoValidator : AbstractValidator<UpdateNotificationTemplateDto>
{
    public UpdateNotificationTemplateDtoValidator()
    {
        RuleFor(x => x.SubjectEn).MaximumLength(500);
        RuleFor(x => x.SubjectAr).MaximumLength(500);
    }
}

public sealed class NotificationLogFilterDtoValidator : AbstractValidator<NotificationLogFilterDto>
{
    public NotificationLogFilterDtoValidator()
    {
        RuleFor(x => x.PageNumber).GreaterThan(0);
        RuleFor(x => x.PageSize).GreaterThan(0);
    }
}
