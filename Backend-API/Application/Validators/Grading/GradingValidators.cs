using FluentValidation;
using Smart_Core.Application.DTOs.Grading;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.Validators.Grading;

public class InitiateGradingDtoValidator : AbstractValidator<InitiateGradingDto>
{
    public InitiateGradingDtoValidator()
    {
        RuleFor(x => x.AttemptId)
 .GreaterThan(0).WithMessage("Attempt ID is required");
 }
}

public class ManualGradeDtoValidator : AbstractValidator<ManualGradeDto>
{
    public ManualGradeDtoValidator()
    {
 RuleFor(x => x.GradingSessionId)
     .GreaterThan(0).WithMessage("Grading Session ID is required");

        RuleFor(x => x.QuestionId)
    .GreaterThan(0).WithMessage("Question ID is required");

        RuleFor(x => x.Score)
            .GreaterThanOrEqualTo(0).WithMessage("Score must be 0 or greater");

        RuleFor(x => x.GraderComment)
  .MaximumLength(2000).WithMessage("Comment cannot exceed 2000 characters");
    }
}

public class ManualGradeItemDtoValidator : AbstractValidator<ManualGradeItemDto>
{
 public ManualGradeItemDtoValidator()
    {
     RuleFor(x => x.QuestionId)
       .GreaterThan(0).WithMessage("Question ID is required");

  RuleFor(x => x.Score)
.GreaterThanOrEqualTo(0).WithMessage("Score must be 0 or greater");

 RuleFor(x => x.GraderComment)
     .MaximumLength(2000).WithMessage("Comment cannot exceed 2000 characters");
  }
}

public class BulkManualGradeDtoValidator : AbstractValidator<BulkManualGradeDto>
{
    public BulkManualGradeDtoValidator()
    {
     RuleFor(x => x.GradingSessionId)
 .GreaterThan(0).WithMessage("Grading Session ID is required");

        RuleFor(x => x.Grades)
     .NotEmpty().WithMessage("At least one grade is required")
    .Must(x => x.Count <= 100).WithMessage("Cannot submit more than 100 grades at once");

    RuleForEach(x => x.Grades)
         .SetValidator(new ManualGradeItemDtoValidator());
    }
}

public class CompleteGradingDtoValidator : AbstractValidator<CompleteGradingDto>
{
    public CompleteGradingDtoValidator()
{
    RuleFor(x => x.GradingSessionId)
    .GreaterThan(0).WithMessage("Grading Session ID is required");
    }
}

public class RegradeDtoValidator : AbstractValidator<RegradeDto>
{
    public RegradeDtoValidator()
    {
     RuleFor(x => x.GradingSessionId)
  .GreaterThan(0).WithMessage("Grading Session ID is required");

        RuleFor(x => x.QuestionId)
            .GreaterThan(0).WithMessage("Question ID is required");

 RuleFor(x => x.NewScore)
  .GreaterThanOrEqualTo(0).WithMessage("Score must be 0 or greater");

   RuleFor(x => x.Comment)
.MaximumLength(2000).WithMessage("Comment cannot exceed 2000 characters");

  RuleFor(x => x.Reason)
    .MaximumLength(1000).WithMessage("Reason cannot exceed 1000 characters");
    }
}

public class GradingSearchDtoValidator : AbstractValidator<GradingSearchDto>
{
    public GradingSearchDtoValidator()
    {
        RuleFor(x => x.PageNumber)
   .GreaterThan(0).WithMessage("Page number must be greater than 0");

   RuleFor(x => x.PageSize)
       .GreaterThan(0).WithMessage("Page size must be greater than 0")
  .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100");

  When(x => x.GradedFrom.HasValue && x.GradedTo.HasValue, () =>
        {
        RuleFor(x => x.GradedTo)
           .GreaterThanOrEqualTo(x => x.GradedFrom)
       .WithMessage("End date must be after or equal to start date");
        });

  When(x => x.Status.HasValue, () =>
        {
     RuleFor(x => x.Status)
      .IsInEnum().WithMessage("Invalid grading status");
      });
    }
}
