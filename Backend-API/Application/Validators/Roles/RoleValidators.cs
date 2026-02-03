using FluentValidation;
using Smart_Core.Application.DTOs.Roles;

namespace Smart_Core.Application.Validators.Roles;

public class CreateRoleDtoValidator : AbstractValidator<CreateRoleDto>
{
    public CreateRoleDtoValidator()
    {
        RuleFor(x => x.Name)
      .NotEmpty().WithMessage("Role name is required")
   .MinimumLength(2).WithMessage("Role name must be at least 2 characters")
            .MaximumLength(50).WithMessage("Role name cannot exceed 50 characters")
   .Matches("^[a-zA-Z0-9_]+$").WithMessage("Role name can only contain letters, numbers, and underscores");
    }
}

public class UpdateRoleDtoValidator : AbstractValidator<UpdateRoleDto>
{
    public UpdateRoleDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Role name is required")
            .MinimumLength(2).WithMessage("Role name must be at least 2 characters")
     .MaximumLength(50).WithMessage("Role name cannot exceed 50 characters")
 .Matches("^[a-zA-Z0-9_]+$").WithMessage("Role name can only contain letters, numbers, and underscores");
    }
}

public class UserRoleDtoValidator : AbstractValidator<UserRoleDto>
{
    public UserRoleDtoValidator()
    {
      RuleFor(x => x.UserId)
 .NotEmpty().WithMessage("User ID is required");

     RuleFor(x => x.RoleName)
    .NotEmpty().WithMessage("Role name is required");
    }
}
