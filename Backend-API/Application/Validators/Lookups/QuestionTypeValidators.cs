using FluentValidation;
using Smart_Core.Application.DTOs.Lookups;

namespace Smart_Core.Application.Validators.Lookups;

public class CreateQuestionTypeDtoValidator : AbstractValidator<CreateQuestionTypeDto>
{
    public CreateQuestionTypeDtoValidator()
  {
        RuleFor(x => x.NameEn)
         .NotEmpty().WithMessage("English name is required")
    .MaximumLength(300).WithMessage("English name cannot exceed 300 characters");

        RuleFor(x => x.NameAr)
       .NotEmpty().WithMessage("Arabic name is required")
     .MaximumLength(300).WithMessage("Arabic name cannot exceed 300 characters");
    }
}

public class UpdateQuestionTypeDtoValidator : AbstractValidator<UpdateQuestionTypeDto>
{
    public UpdateQuestionTypeDtoValidator()
    {
      RuleFor(x => x.NameEn)
          .NotEmpty().WithMessage("English name is required")
       .MaximumLength(300).WithMessage("English name cannot exceed 300 characters");

RuleFor(x => x.NameAr)
     .NotEmpty().WithMessage("Arabic name is required")
       .MaximumLength(300).WithMessage("Arabic name cannot exceed 300 characters");
    }
}
