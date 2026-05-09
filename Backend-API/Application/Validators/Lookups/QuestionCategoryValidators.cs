using FluentValidation;
using Smart_Core.Application.DTOs.Lookups;

namespace Smart_Core.Application.Validators.Lookups;

public class CreateQuestionCategoryDtoValidator : AbstractValidator<CreateQuestionCategoryDto>
{
    public CreateQuestionCategoryDtoValidator()
    {
        RuleFor(x => x.NameEn)
            .NotEmpty().WithMessage("English name is required")
            .MaximumLength(300).WithMessage("English name cannot exceed 300 characters");

        RuleFor(x => x.NameAr)
       .NotEmpty().WithMessage("Arabic name is required")
   .MaximumLength(300).WithMessage("Arabic name cannot exceed 300 characters");
    }
}

public class UpdateQuestionCategoryDtoValidator : AbstractValidator<UpdateQuestionCategoryDto>
{
    public UpdateQuestionCategoryDtoValidator()
    {
        RuleFor(x => x.NameEn)
.NotEmpty().WithMessage("English name is required")
            .MaximumLength(300).WithMessage("English name cannot exceed 300 characters");

        RuleFor(x => x.NameAr)
       .NotEmpty().WithMessage("Arabic name is required")
        .MaximumLength(300).WithMessage("Arabic name cannot exceed 300 characters");
    }
}

public class QuestionCategorySearchDtoValidator : AbstractValidator<QuestionCategorySearchDto>
{
    public QuestionCategorySearchDtoValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
            .GreaterThan(0).WithMessage("Page size must be greater than 0")
            .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100");
    }
}
