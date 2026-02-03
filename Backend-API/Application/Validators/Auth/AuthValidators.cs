using FluentValidation;
using Smart_Core.Application.DTOs.Auth;

namespace Smart_Core.Application.Validators.Auth;

public class RegisterDtoValidator : AbstractValidator<RegisterDto>
{
    public RegisterDtoValidator()
    {
        RuleFor(x => x.Email)
     .NotEmpty().WithMessage("Email is required")
   .EmailAddress().WithMessage("Invalid email format");

 RuleFor(x => x.Password)
       .NotEmpty().WithMessage("Password is required")
     .MinimumLength(8).WithMessage("Password must be at least 8 characters")
     .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter")
    .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter")
    .Matches("[0-9]").WithMessage("Password must contain at least one number")
       .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character");

        RuleFor(x => x.ConfirmPassword)
 .Equal(x => x.Password).WithMessage("Passwords do not match");

        RuleFor(x => x.DisplayName)
      .MaximumLength(100).WithMessage("Display name cannot exceed 100 characters");

 RuleFor(x => x.FullName)
            .MaximumLength(200).WithMessage("Full name cannot exceed 200 characters");
    }
}

public class LoginDtoValidator : AbstractValidator<LoginDto>
{
    public LoginDtoValidator()
    {
      RuleFor(x => x.Email)
    .NotEmpty().WithMessage("Email is required")
 .EmailAddress().WithMessage("Invalid email format");

  RuleFor(x => x.Password)
   .NotEmpty().WithMessage("Password is required");
    }
}

public class ForgotPasswordDtoValidator : AbstractValidator<ForgotPasswordDto>
{
    public ForgotPasswordDtoValidator()
    {
   RuleFor(x => x.Email)
         .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");
    }
}

public class ResetPasswordDtoValidator : AbstractValidator<ResetPasswordDto>
{
    public ResetPasswordDtoValidator()
    {
        RuleFor(x => x.Email)
 .NotEmpty().WithMessage("Email is required")
   .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Token is required");

        RuleFor(x => x.NewPassword)
   .NotEmpty().WithMessage("New password is required")
         .MinimumLength(8).WithMessage("Password must be at least 8 characters")
     .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter")
            .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter")
            .Matches("[0-9]").WithMessage("Password must contain at least one number")
            .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character");

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.NewPassword).WithMessage("Passwords do not match");
    }
}

public class ChangePasswordDtoValidator : AbstractValidator<ChangePasswordDto>
{
    public ChangePasswordDtoValidator()
    {
 RuleFor(x => x.CurrentPassword)
 .NotEmpty().WithMessage("Current password is required");

        RuleFor(x => x.NewPassword)
  .NotEmpty().WithMessage("New password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters")
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter")
     .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter")
          .Matches("[0-9]").WithMessage("Password must contain at least one number")
            .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character");

        RuleFor(x => x.ConfirmPassword)
    .Equal(x => x.NewPassword).WithMessage("Passwords do not match");
  }
}

public class RefreshTokenDtoValidator : AbstractValidator<RefreshTokenDto>
{
    public RefreshTokenDtoValidator()
    {
    RuleFor(x => x.AccessToken)
     .NotEmpty().WithMessage("Access token is required");

        RuleFor(x => x.RefreshToken)
   .NotEmpty().WithMessage("Refresh token is required");
    }
}
