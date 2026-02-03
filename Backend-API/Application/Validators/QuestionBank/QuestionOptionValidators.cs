using FluentValidation;
using Smart_Core.Application.DTOs.QuestionBank;

namespace Smart_Core.Application.Validators.QuestionBank;

public class CreateQuestionOptionDtoValidator : AbstractValidator<CreateQuestionOptionDto>
{
    public CreateQuestionOptionDtoValidator()
    {
        RuleFor(x => x.TextEn)
  .NotEmpty().WithMessage("English option text is required")
   .MaximumLength(1000).WithMessage("English option text cannot exceed 1000 characters");

        RuleFor(x => x.TextAr)
.NotEmpty().WithMessage("Arabic option text is required")
 .MaximumLength(1000).WithMessage("Arabic option text cannot exceed 1000 characters");

        RuleFor(x => x.Order)
     .GreaterThanOrEqualTo(0).WithMessage("Order must be 0 or greater");

        When(x => !string.IsNullOrEmpty(x.AttachmentPath), () =>
        {
        RuleFor(x => x.AttachmentPath)
      .MaximumLength(1000).WithMessage("Attachment path cannot exceed 1000 characters");
        });
    }
}

public class UpdateQuestionOptionDtoValidator : AbstractValidator<UpdateQuestionOptionDto>
{
    public UpdateQuestionOptionDtoValidator()
    {
      RuleFor(x => x.TextEn)
     .NotEmpty().WithMessage("English option text is required")
          .MaximumLength(1000).WithMessage("English option text cannot exceed 1000 characters");

        RuleFor(x => x.TextAr)
            .NotEmpty().WithMessage("Arabic option text is required")
        .MaximumLength(1000).WithMessage("Arabic option text cannot exceed 1000 characters");

        RuleFor(x => x.Order)
       .GreaterThanOrEqualTo(0).WithMessage("Order must be 0 or greater");

        When(x => !string.IsNullOrEmpty(x.AttachmentPath), () =>
        {
        RuleFor(x => x.AttachmentPath)
  .MaximumLength(1000).WithMessage("Attachment path cannot exceed 1000 characters");
   });
    }
}

public class BulkUpdateQuestionOptionsDtoValidator : AbstractValidator<BulkUpdateQuestionOptionsDto>
{
    public BulkUpdateQuestionOptionsDtoValidator()
    {
        RuleFor(x => x.QuestionId)
       .GreaterThan(0).WithMessage("Question ID is required");

   RuleFor(x => x.Options)
            .NotEmpty().WithMessage("At least one option is required");

        RuleForEach(x => x.Options)
  .SetValidator(new UpdateQuestionOptionDtoValidator());
    }
}
