using FluentValidation;
using Smart_Core.Application.DTOs.Assessment;

namespace Smart_Core.Application.Validators.Assessment;

public class SaveWalkInFieldDtoValidator : AbstractValidator<SaveWalkInFieldDto>
{
    public SaveWalkInFieldDtoValidator()
    {
        RuleFor(x => x.LabelEn)
            .NotEmpty().WithMessage("English label is required")
            .MaximumLength(200).WithMessage("English label cannot exceed 200 characters");

        RuleFor(x => x.LabelAr)
            .NotEmpty().WithMessage("Arabic label is required")
            .MaximumLength(200).WithMessage("Arabic label cannot exceed 200 characters");

        RuleFor(x => x.FieldType)
            .IsInEnum().WithMessage("Invalid field type");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be 0 or greater");
    }
}

public class ReorderWalkInFieldDtoValidator : AbstractValidator<ReorderWalkInFieldDto>
{
    public ReorderWalkInFieldDtoValidator()
    {
        RuleFor(x => x.FieldId)
            .GreaterThan(0).WithMessage("Field ID is required");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be 0 or greater");
    }
}

/// <summary>
/// Validates the walk-in self-registration payload, including each dynamic field answer.
/// Protects against oversized values before they reach the database.
/// </summary>
public class WalkInRegisterDtoValidator : AbstractValidator<WalkInRegisterDto>
{
    public WalkInRegisterDtoValidator()
    {
        // DynamicFields is optional (null/empty is valid — backward compatible)
        When(x => x.DynamicFields != null && x.DynamicFields.Count > 0, () =>
        {
            RuleForEach(x => x.DynamicFields)
                .ChildRules(field =>
                {
                    field.RuleFor(f => f.FieldId)
                        .GreaterThan(0).WithMessage("Each dynamic field must have a valid FieldId");

                    field.RuleFor(f => f.Value)
                        .MaximumLength(500).WithMessage("Field value cannot exceed 500 characters");
                });
        });
    }
}
