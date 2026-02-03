using FluentValidation;
using Smart_Core.Application.DTOs.Assessment;

namespace Smart_Core.Application.Validators.Assessment;

public class AddExamQuestionDtoValidator : AbstractValidator<AddExamQuestionDto>
{
    public AddExamQuestionDtoValidator()
    {
        RuleFor(x => x.QuestionId)
 .GreaterThan(0).WithMessage("Question ID is required");

 RuleFor(x => x.Order)
          .GreaterThanOrEqualTo(0).WithMessage("Order must be 0 or greater");

        When(x => x.PointsOverride.HasValue, () =>
        {
     RuleFor(x => x.PointsOverride)
          .GreaterThan(0).WithMessage("Points override must be greater than 0 if specified");
        });
    }
}

public class UpdateExamQuestionDtoValidator : AbstractValidator<UpdateExamQuestionDto>
{
    public UpdateExamQuestionDtoValidator()
    {
  RuleFor(x => x.Order)
            .GreaterThanOrEqualTo(0).WithMessage("Order must be 0 or greater");

    RuleFor(x => x.Points)
   .GreaterThan(0).WithMessage("Points must be greater than 0");
    }
}

public class BulkAddQuestionsDtoValidator : AbstractValidator<BulkAddQuestionsDto>
{
    public BulkAddQuestionsDtoValidator()
    {
RuleFor(x => x.QuestionIds)
.NotEmpty().WithMessage("At least one question ID is required");

        RuleForEach(x => x.QuestionIds)
    .GreaterThan(0).WithMessage("Question ID must be valid");
    }
}

public class ReorderQuestionDtoValidator : AbstractValidator<ReorderQuestionDto>
{
 public ReorderQuestionDtoValidator()
    {
RuleFor(x => x.ExamQuestionId)
  .GreaterThan(0).WithMessage("Exam question ID is required");

        RuleFor(x => x.NewOrder)
  .GreaterThanOrEqualTo(0).WithMessage("Order must be 0 or greater");
    }
}
