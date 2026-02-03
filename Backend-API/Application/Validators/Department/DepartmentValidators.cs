using FluentValidation;
using Smart_Core.Application.DTOs.Department;

namespace Smart_Core.Application.Validators.Department;

public class CreateDepartmentRequestValidator : AbstractValidator<CreateDepartmentRequest>
{
    public CreateDepartmentRequestValidator()
    {
 RuleFor(x => x.NameEn)
     .NotEmpty().WithMessage("English name is required.")
          .MaximumLength(300).WithMessage("English name cannot exceed 300 characters.");

    RuleFor(x => x.NameAr)
   .NotEmpty().WithMessage("Arabic name is required.")
            .MaximumLength(300).WithMessage("Arabic name cannot exceed 300 characters.");

        RuleFor(x => x.DescriptionEn)
     .MaximumLength(2000).WithMessage("English description cannot exceed 2000 characters.")
      .When(x => !string.IsNullOrEmpty(x.DescriptionEn));

        RuleFor(x => x.DescriptionAr)
         .MaximumLength(2000).WithMessage("Arabic description cannot exceed 2000 characters.")
     .When(x => !string.IsNullOrEmpty(x.DescriptionAr));

   RuleFor(x => x.Code)
    .MaximumLength(50).WithMessage("Code cannot exceed 50 characters.")
         .Matches("^[A-Za-z0-9_-]*$").WithMessage("Code can only contain letters, numbers, underscores, and hyphens.")
.When(x => !string.IsNullOrEmpty(x.Code));
    }
}

public class UpdateDepartmentRequestValidator : AbstractValidator<UpdateDepartmentRequest>
{
    public UpdateDepartmentRequestValidator()
    {
        RuleFor(x => x.NameEn)
    .NotEmpty().WithMessage("English name is required.")
 .MaximumLength(300).WithMessage("English name cannot exceed 300 characters.");

        RuleFor(x => x.NameAr)
      .NotEmpty().WithMessage("Arabic name is required.")
 .MaximumLength(300).WithMessage("Arabic name cannot exceed 300 characters.");

        RuleFor(x => x.DescriptionEn)
            .MaximumLength(2000).WithMessage("English description cannot exceed 2000 characters.")
          .When(x => !string.IsNullOrEmpty(x.DescriptionEn));

   RuleFor(x => x.DescriptionAr)
  .MaximumLength(2000).WithMessage("Arabic description cannot exceed 2000 characters.")
 .When(x => !string.IsNullOrEmpty(x.DescriptionAr));

   RuleFor(x => x.Code)
            .MaximumLength(50).WithMessage("Code cannot exceed 50 characters.")
    .Matches("^[A-Za-z0-9_-]*$").WithMessage("Code can only contain letters, numbers, underscores, and hyphens.")
    .When(x => !string.IsNullOrEmpty(x.Code));
    }
}

public class AssignUserToDepartmentRequestValidator : AbstractValidator<AssignUserToDepartmentRequest>
{
    public AssignUserToDepartmentRequestValidator()
    {
 RuleFor(x => x.UserId)
   .NotEmpty().WithMessage("User ID is required.");

        RuleFor(x => x.DepartmentId)
            .GreaterThan(0).WithMessage("Valid department ID is required.");
 }
}
