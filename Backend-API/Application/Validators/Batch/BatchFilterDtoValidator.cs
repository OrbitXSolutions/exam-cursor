using FluentValidation;
using Smart_Core.Application.DTOs.Batch;

namespace Smart_Core.Application.Validators.Batch;

public class BatchFilterDtoValidator : AbstractValidator<BatchFilterDto>
{
    public BatchFilterDtoValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
            .GreaterThan(0).WithMessage("Page size must be greater than 0")
            .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100");
    }
}
