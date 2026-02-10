using FluentValidation;
using Smart_Core.Application.DTOs.Lookups;

namespace Smart_Core.Application.Validators.Lookups;

public class CreateQuestionTopicDtoValidator : AbstractValidator<CreateQuestionTopicDto>
{
    public CreateQuestionTopicDtoValidator()
    {
        RuleFor(x => x.NameEn)
            .NotEmpty().WithMessage("English name is required")
            .MaximumLength(300).WithMessage("English name cannot exceed 300 characters");

        RuleFor(x => x.NameAr)
            .NotEmpty().WithMessage("Arabic name is required")
            .MaximumLength(300).WithMessage("Arabic name cannot exceed 300 characters");

        RuleFor(x => x.SubjectId)
            .GreaterThan(0).WithMessage("Subject is required");
    }
}

public class UpdateQuestionTopicDtoValidator : AbstractValidator<UpdateQuestionTopicDto>
{
    public UpdateQuestionTopicDtoValidator()
    {
        RuleFor(x => x.NameEn)
            .NotEmpty().WithMessage("English name is required")
            .MaximumLength(300).WithMessage("English name cannot exceed 300 characters");

        RuleFor(x => x.NameAr)
            .NotEmpty().WithMessage("Arabic name is required")
            .MaximumLength(300).WithMessage("Arabic name cannot exceed 300 characters");

        RuleFor(x => x.SubjectId)
            .GreaterThan(0).WithMessage("Subject is required");
    }
}
