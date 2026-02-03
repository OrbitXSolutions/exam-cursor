using FluentValidation;
using Smart_Core.Application.DTOs.Assessment;

namespace Smart_Core.Application.Validators.Assessment;

public class SaveExamDtoValidator : AbstractValidator<SaveExamDto>
{
 private const int MaxDurationMinutes = 600;

    public SaveExamDtoValidator()
    {
        RuleFor(x => x.TitleEn)
     .NotEmpty().WithMessage("English title is required")
            .MaximumLength(500).WithMessage("English title cannot exceed 500 characters");

   RuleFor(x => x.TitleAr)
        .NotEmpty().WithMessage("Arabic title is required")
      .MaximumLength(500).WithMessage("Arabic title cannot exceed 500 characters");

  RuleFor(x => x.DescriptionEn)
        .MaximumLength(2000).WithMessage("English description cannot exceed 2000 characters");

        RuleFor(x => x.DescriptionAr)
         .MaximumLength(2000).WithMessage("Arabic description cannot exceed 2000 characters");

        RuleFor(x => x.DurationMinutes)
  .GreaterThan(0).WithMessage("Duration must be greater than 0")
            .LessThanOrEqualTo(MaxDurationMinutes).WithMessage($"Duration cannot exceed {MaxDurationMinutes} minutes");

        RuleFor(x => x.MaxAttempts)
         .GreaterThanOrEqualTo(0).WithMessage("Max attempts must be 0 (unlimited) or greater");

        RuleFor(x => x.PassScore)
    .GreaterThanOrEqualTo(0).WithMessage("Pass score must be 0 or greater");

        // Scheduling validation: EndAt must be after StartAt
        When(x => x.StartAt.HasValue && x.EndAt.HasValue, () =>
        {
            RuleFor(x => x.EndAt)
   .GreaterThan(x => x.StartAt)
           .WithMessage("End date must be after start date");
 });
    }
}

public class ExamSearchDtoValidator : AbstractValidator<ExamSearchDto>
{
    public ExamSearchDtoValidator()
 {
        RuleFor(x => x.PageNumber)
 .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
  .GreaterThan(0).WithMessage("Page size must be greater than 0")
  .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100");

        When(x => x.StartDateFrom.HasValue && x.StartDateTo.HasValue, () =>
        {
     RuleFor(x => x.StartDateTo)
.GreaterThanOrEqualTo(x => x.StartDateFrom)
       .WithMessage("End date must be after or equal to start date");
  });
    }
}
