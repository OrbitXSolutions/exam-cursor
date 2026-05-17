using FluentValidation;
using Smart_Core.Application.DTOs.Users;

namespace Smart_Core.Application.Validators.Users;

public class UpdateUserDtoValidator : AbstractValidator<UpdateUserDto>
{
    public UpdateUserDtoValidator()
    {
        RuleFor(x => x.DisplayName)
   .MaximumLength(100).WithMessage("Display name cannot exceed 100 characters");

        RuleFor(x => x.FullName)
 .MaximumLength(200).WithMessage("Full name cannot exceed 200 characters");

   RuleFor(x => x.PhoneNumber)
 .Matches(@"^\+?[1-9]\d{1,14}$").When(x => !string.IsNullOrEmpty(x.PhoneNumber))
   .WithMessage("Invalid phone number format");
  }
}

public class UserFilterDtoValidator : AbstractValidator<UserFilterDto>
{
    public UserFilterDtoValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
            .GreaterThan(0).WithMessage("Page size must be greater than 0")
            .LessThanOrEqualTo(500).WithMessage("Page size cannot exceed 500");
    }
}

public class StaffUserFilterDtoValidator : AbstractValidator<StaffUserFilterDto>
{
    public StaffUserFilterDtoValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
            .GreaterThan(0).WithMessage("Page size must be greater than 0")
            .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100");
    }
}
