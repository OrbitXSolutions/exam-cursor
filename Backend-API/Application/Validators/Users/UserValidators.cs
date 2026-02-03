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
