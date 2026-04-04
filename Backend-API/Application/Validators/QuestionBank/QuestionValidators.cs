using FluentValidation;
using Smart_Core.Application.DTOs.QuestionBank;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.Validators.QuestionBank;

public class CreateQuestionDtoValidator : AbstractValidator<CreateQuestionDto>
{
    public CreateQuestionDtoValidator()
    {
        RuleFor(x => x.BodyEn)
   .NotEmpty().WithMessage("English question body is required")
            .MaximumLength(5000).WithMessage("English question body cannot exceed 5000 characters");

        RuleFor(x => x.BodyAr)
            .NotEmpty().WithMessage("Arabic question body is required")
            .MaximumLength(5000).WithMessage("Arabic question body cannot exceed 5000 characters");

        RuleFor(x => x.ExplanationEn)
            .MaximumLength(5000).WithMessage("English explanation cannot exceed 5000 characters");

        RuleFor(x => x.ExplanationAr)
 .MaximumLength(5000).WithMessage("Arabic explanation cannot exceed 5000 characters");

        RuleFor(x => x.QuestionTypeId)
             .GreaterThan(0).WithMessage("Question type is required");

        RuleFor(x => x.QuestionCategoryId)
         .GreaterThan(0).WithMessage("Question category is required");

        RuleFor(x => x.SubjectId)
            .GreaterThan(0).WithMessage("Subject is required");

        RuleFor(x => x.Points)
      .GreaterThan(0).WithMessage("Points must be greater than 0")
        .LessThanOrEqualTo(1000).WithMessage("Points cannot exceed 1000");

        RuleFor(x => x.DifficultyLevel)
            .IsInEnum().WithMessage("Invalid difficulty level");

        RuleForEach(x => x.Options)
          .SetValidator(new CreateQuestionOptionDtoValidator());

        // Cross-validation: option points sum must equal question points for MCQ_Multi
        When(x => x.QuestionTypeId == 2 && x.Options.Any(o => o.Points.HasValue), () =>
        {
            RuleFor(x => x)
                .Must(x => Math.Abs(x.Options.Sum(o => o.Points ?? 0) - x.Points) < 0.01m)
                .WithMessage("Sum of option points must equal the question total points");

            RuleForEach(x => x.Options)
                .Must(o => !o.Points.HasValue || o.Points.Value >= 0)
                .WithMessage("Each option points must be 0 or greater");
        });
    }
}

public class UpdateQuestionDtoValidator : AbstractValidator<UpdateQuestionDto>
{
    public UpdateQuestionDtoValidator()
    {
        RuleFor(x => x.BodyEn)
 .NotEmpty().WithMessage("English question body is required")
            .MaximumLength(5000).WithMessage("English question body cannot exceed 5000 characters");

        RuleFor(x => x.BodyAr)
            .NotEmpty().WithMessage("Arabic question body is required")
         .MaximumLength(5000).WithMessage("Arabic question body cannot exceed 5000 characters");

        RuleFor(x => x.ExplanationEn)
            .MaximumLength(5000).WithMessage("English explanation cannot exceed 5000 characters");

        RuleFor(x => x.ExplanationAr)
                 .MaximumLength(5000).WithMessage("Arabic explanation cannot exceed 5000 characters");

        RuleFor(x => x.QuestionTypeId)
     .GreaterThan(0).WithMessage("Question type is required");

        RuleFor(x => x.QuestionCategoryId)
            .GreaterThan(0).WithMessage("Question category is required");

        RuleFor(x => x.SubjectId)
            .GreaterThan(0).WithMessage("Subject is required");

        RuleFor(x => x.Points)
               .GreaterThan(0).WithMessage("Points must be greater than 0")
    .LessThanOrEqualTo(1000).WithMessage("Points cannot exceed 1000");

        RuleFor(x => x.DifficultyLevel)
       .IsInEnum().WithMessage("Invalid difficulty level");
    }
}

public class QuestionSearchDtoValidator : AbstractValidator<QuestionSearchDto>
{
    public QuestionSearchDtoValidator()
    {
        RuleFor(x => x.PageNumber)
   .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
        .GreaterThan(0).WithMessage("Page size must be greater than 0")
         .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100");

        When(x => x.DifficultyLevel.HasValue, () =>
        {
            RuleFor(x => x.DifficultyLevel)
        .IsInEnum().WithMessage("Invalid difficulty level");
        });
    }
}
