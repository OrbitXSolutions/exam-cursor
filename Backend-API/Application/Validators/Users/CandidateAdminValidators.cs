using FluentValidation;
using Smart_Core.Application.DTOs.CandidateAdmin;

namespace Smart_Core.Application.Validators.Users;

public class CandidateFilterDtoValidator : AbstractValidator<CandidateFilterDto>
{
    public CandidateFilterDtoValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
            .GreaterThan(0).WithMessage("Page size must be greater than 0")
            .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100");
    }
}
