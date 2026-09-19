using Smart_Core.Application.DTOs.Notification;
using Smart_Core.Application.Validators.Notification;
using Smart_Core.Application.Validators.Settings;
using Smart_Core.Controllers.Settings;

namespace Backend_API.Tests;

public sealed class SettingsValidationTests
{
    [Theory]
    [InlineData(-1)]
    [InlineData(0)]
    public void RejectsNonpositiveSystemLimits(int value)
    {
        var result = new SystemSettingsDtoValidator().Validate(new SystemSettingsDto
        {
            MaxFileUploadMb = value, SessionTimeoutMinutes = value,
            PasswordPolicy = new PasswordPolicyDto { MinLength = value }
        });
        Assert.Contains(result.Errors, x => x.PropertyName == "MaxFileUploadMb");
        Assert.Contains(result.Errors, x => x.PropertyName == "SessionTimeoutMinutes");
        Assert.Contains(result.Errors, x => x.PropertyName == "PasswordPolicy.MinLength");
    }

    [Theory]
    [InlineData("None")]
    [InlineData("Soft")]
    [InlineData("Hard")]
    [InlineData(null)]
    public void PreservesSupportedProctorModesAndLegacyNullFallback(string? mode)
    {
        Assert.True(new SystemSettingsDtoValidator().Validate(new SystemSettingsDto
        {
            MaxFileUploadMb = 10, SessionTimeoutMinutes = 120, DefaultProctorMode = mode
        }).IsValid);
    }

    [Fact]
    public void RejectsUnknownProctorMode()
    {
        var result = new SystemSettingsDtoValidator().Validate(new SystemSettingsDto
        {
            MaxFileUploadMb = 10, SessionTimeoutMinutes = 120, DefaultProctorMode = "INVALID_MODE"
        });
        Assert.Contains(result.Errors, x => x.PropertyName == "DefaultProctorMode");
    }

    [Fact]
    public void NotificationSettingsRejectsDatabaseOverflowAndUnsupportedWorkerValues()
    {
        var result = new NotificationSettingsDtoValidator().Validate(new NotificationSettingsDto
        {
            SmtpHost = new string('x', 501), SmtpPort = -1,
            EmailBatchSize = -1, SmsBatchSize = 0, BatchDelayMs = -1
        });
        foreach (var field in new[] { "SmtpHost", "SmtpPort", "EmailBatchSize", "SmsBatchSize", "BatchDelayMs" })
            Assert.Contains(result.Errors, x => x.PropertyName == field);
        Assert.True(new NotificationSettingsDtoValidator().Validate(new NotificationSettingsDto
        {
            SmtpHost = new string('x', 500), SmtpPort = 65535,
            EmailBatchSize = 500, SmsBatchSize = 1, BatchDelayMs = 60000
        }).IsValid);
    }

    [Fact]
    public void TemplateSubjectLengthMatchesBothDatabaseColumns()
    {
        var validator = new UpdateNotificationTemplateDtoValidator();
        Assert.True(validator.Validate(new UpdateNotificationTemplateDto
            { SubjectEn = new string('x', 500), SubjectAr = new string('ش', 500) }).IsValid);
        var invalid = validator.Validate(new UpdateNotificationTemplateDto
            { SubjectEn = new string('x', 501), SubjectAr = new string('ش', 501) });
        Assert.Contains(invalid.Errors, x => x.PropertyName == "SubjectEn");
        Assert.Contains(invalid.Errors, x => x.PropertyName == "SubjectAr");
    }

    [Fact]
    public void InvalidLogPagingIsRejectedBeforeSqlExecution()
    {
        var validator = new NotificationLogFilterDtoValidator();
        Assert.False(validator.Validate(new NotificationLogFilterDto { PageNumber = 0, PageSize = -1 }).IsValid);
        Assert.True(validator.Validate(new NotificationLogFilterDto { PageNumber = 1, PageSize = 50 }).IsValid);
    }
}
