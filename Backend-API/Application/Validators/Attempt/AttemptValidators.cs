using FluentValidation;
using Smart_Core.Application.DTOs.Attempt;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.Validators.Attempt;

public class StartAttemptDtoValidator : AbstractValidator<StartAttemptDto>
{
    public StartAttemptDtoValidator()
    {
    RuleFor(x => x.ExamId)
  .GreaterThan(0).WithMessage("Exam ID is required");

      RuleFor(x => x.AccessCode)
       .MaximumLength(100).WithMessage("Access code cannot exceed 100 characters");
 }
}

public class SaveAnswerDtoValidator : AbstractValidator<SaveAnswerDto>
{
  public SaveAnswerDtoValidator()
    {
     RuleFor(x => x.QuestionId)
    .GreaterThan(0).WithMessage("Question ID is required");

        // Either SelectedOptionIds or TextAnswer should be provided (validation per question type in service)
        RuleFor(x => x.SelectedOptionIds)
      .Must(x => x == null || x.Count <= 50)
            .WithMessage("Too many options selected");

        RuleFor(x => x.TextAnswer)
.MaximumLength(10000).WithMessage("Answer text cannot exceed 10000 characters");
    }
}

public class BulkSaveAnswersDtoValidator : AbstractValidator<BulkSaveAnswersDto>
{
    public BulkSaveAnswersDtoValidator()
    {
        RuleFor(x => x.Answers)
       .NotEmpty().WithMessage("At least one answer is required")
.Must(x => x.Count <= 100).WithMessage("Cannot save more than 100 answers at once");

        RuleForEach(x => x.Answers)
      .SetValidator(new SaveAnswerDtoValidator());
    }
}

public class LogAttemptEventDtoValidator : AbstractValidator<LogAttemptEventDto>
{
    public LogAttemptEventDtoValidator()
    {
        RuleFor(x => x.EventType)
      .IsInEnum().WithMessage("Invalid event type");

     RuleFor(x => x.MetadataJson)
           .MaximumLength(4000).WithMessage("Metadata cannot exceed 4000 characters");
    }
}

public class AttemptSearchDtoValidator : AbstractValidator<AttemptSearchDto>
{
 public AttemptSearchDtoValidator()
  {
        RuleFor(x => x.PageNumber)
     .GreaterThan(0).WithMessage("Page number must be greater than 0");

     RuleFor(x => x.PageSize)
 .GreaterThan(0).WithMessage("Page size must be greater than 0")
         .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100");

        When(x => x.StartedFrom.HasValue && x.StartedTo.HasValue, () =>
        {
            RuleFor(x => x.StartedTo)
          .GreaterThanOrEqualTo(x => x.StartedFrom)
.WithMessage("End date must be after or equal to start date");
 });

        When(x => x.Status.HasValue, () =>
   {
       RuleFor(x => x.Status)
     .IsInEnum().WithMessage("Invalid attempt status");
 });
    }
}

public class CancelAttemptDtoValidator : AbstractValidator<CancelAttemptDto>
{
    public CancelAttemptDtoValidator()
    {
      RuleFor(x => x.AttemptId)
.GreaterThan(0).WithMessage("Attempt ID is required");

 RuleFor(x => x.Reason)
   .MaximumLength(1000).WithMessage("Reason cannot exceed 1000 characters");
    }
}
