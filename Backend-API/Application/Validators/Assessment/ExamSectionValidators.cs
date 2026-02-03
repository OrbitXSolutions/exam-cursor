using FluentValidation;
using Smart_Core.Application.DTOs.Assessment;

namespace Smart_Core.Application.Validators.Assessment;

public class SaveExamSectionDtoValidator : AbstractValidator<SaveExamSectionDto>
{
    public SaveExamSectionDtoValidator()
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

     RuleFor(x => x.Order)
 .GreaterThanOrEqualTo(0).WithMessage("Order must be 0 or greater");

        When(x => x.DurationMinutes.HasValue, () =>
        {
            RuleFor(x => x.DurationMinutes)
       .GreaterThan(0).WithMessage("Section duration must be greater than 0 if specified");
        });

      When(x => x.TotalPointsOverride.HasValue, () =>
   {
         RuleFor(x => x.TotalPointsOverride)
    .GreaterThan(0).WithMessage("Total points override must be greater than 0 if specified");
        });
    }
}

public class ReorderSectionDtoValidator : AbstractValidator<ReorderSectionDto>
{
    public ReorderSectionDtoValidator()
    {
        RuleFor(x => x.SectionId)
  .GreaterThan(0).WithMessage("Section ID is required");

   RuleFor(x => x.NewOrder)
    .GreaterThanOrEqualTo(0).WithMessage("Order must be 0 or greater");
    }
}
