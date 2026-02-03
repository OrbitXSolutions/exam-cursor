using FluentValidation;
using Smart_Core.Application.DTOs.Assessment;

namespace Smart_Core.Application.Validators.Assessment;

public class SaveExamAccessPolicyDtoValidator : AbstractValidator<SaveExamAccessPolicyDto>
{
    public SaveExamAccessPolicyDtoValidator()
    {
     When(x => !string.IsNullOrEmpty(x.AccessCode), () =>
{
         RuleFor(x => x.AccessCode)
            .MinimumLength(6).WithMessage("Access code must be at least 6 characters")
    .MaximumLength(50).WithMessage("Access code cannot exceed 50 characters");
        });

        // If restricted to assigned candidates, should not be public
        RuleFor(x => x)
      .Must(x => !(x.IsPublic && x.RestrictToAssignedCandidates))
          .WithMessage("Exam cannot be both public and restricted to assigned candidates");
    }
}

public class SaveExamInstructionDtoValidator : AbstractValidator<SaveExamInstructionDto>
{
 public SaveExamInstructionDtoValidator()
    {
  RuleFor(x => x.ContentEn)
  .NotEmpty().WithMessage("English content is required")
            .MaximumLength(5000).WithMessage("English content cannot exceed 5000 characters");

  RuleFor(x => x.ContentAr)
          .NotEmpty().WithMessage("Arabic content is required")
  .MaximumLength(5000).WithMessage("Arabic content cannot exceed 5000 characters");

        RuleFor(x => x.Order)
   .GreaterThanOrEqualTo(0).WithMessage("Order must be 0 or greater");
    }
}

public class ReorderInstructionDtoValidator : AbstractValidator<ReorderInstructionDto>
{
    public ReorderInstructionDtoValidator()
    {
   RuleFor(x => x.InstructionId)
 .GreaterThan(0).WithMessage("Instruction ID is required");

        RuleFor(x => x.NewOrder)
  .GreaterThanOrEqualTo(0).WithMessage("Order must be 0 or greater");
    }
}
