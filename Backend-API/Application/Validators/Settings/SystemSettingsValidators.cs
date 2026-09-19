using FluentValidation;
using Smart_Core.Controllers.Settings;

namespace Smart_Core.Application.Validators.Settings;

public sealed class SystemSettingsDtoValidator : AbstractValidator<SystemSettingsDto>
{
    public SystemSettingsDtoValidator()
    {
        RuleFor(x => x.MaxFileUploadMb).GreaterThan(0);
        RuleFor(x => x.SessionTimeoutMinutes).GreaterThan(0);
        RuleFor(x => x.DefaultProctorMode)
            .Must(mode => mode == null || mode is "None" or "Soft" or "Hard")
            .WithMessage("Default proctor mode must be None, Soft, or Hard.");
        When(x => x.PasswordPolicy != null, () =>
            RuleFor(x => x.PasswordPolicy!.MinLength).GreaterThan(0));
    }
}
