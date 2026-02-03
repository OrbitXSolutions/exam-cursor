using FluentValidation;
using Smart_Core.Application.DTOs.ExamResult;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.Validators.ExamResult;

public class ResultSearchDtoValidator : AbstractValidator<ResultSearchDto>
{
    public ResultSearchDtoValidator()
    {
RuleFor(x => x.PageNumber)
  .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
  .GreaterThan(0).WithMessage("Page size must be greater than 0")
  .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100");

        When(x => x.FinalizedFrom.HasValue && x.FinalizedTo.HasValue, () =>
        {
      RuleFor(x => x.FinalizedTo)
 .GreaterThanOrEqualTo(x => x.FinalizedFrom)
      .WithMessage("End date must be after or equal to start date");
   });

        RuleFor(x => x.Search)
   .MaximumLength(200).WithMessage("Search term cannot exceed 200 characters");
    }
}

public class PublishResultDtoValidator : AbstractValidator<PublishResultDto>
{
public PublishResultDtoValidator()
    {
        RuleFor(x => x.ResultId)
       .GreaterThan(0).WithMessage("Result ID is required");
    }
}

public class BulkPublishResultsDtoValidator : AbstractValidator<BulkPublishResultsDto>
{
  public BulkPublishResultsDtoValidator()
    {
     RuleFor(x => x.ResultIds)
 .NotEmpty().WithMessage("At least one result ID is required")
            .Must(x => x.Count <= 500).WithMessage("Cannot publish more than 500 results at once");
    }
}

public class PublishExamResultsDtoValidator : AbstractValidator<PublishExamResultsDto>
{
    public PublishExamResultsDtoValidator()
  {
        RuleFor(x => x.ExamId)
       .GreaterThan(0).WithMessage("Exam ID is required");
}
}

public class GenerateExamReportDtoValidator : AbstractValidator<GenerateExamReportDto>
{
    public GenerateExamReportDtoValidator()
  {
      RuleFor(x => x.ExamId)
    .GreaterThan(0).WithMessage("Exam ID is required");

     When(x => x.FromDate.HasValue && x.ToDate.HasValue, () =>
        {
 RuleFor(x => x.ToDate)
      .GreaterThanOrEqualTo(x => x.FromDate)
  .WithMessage("End date must be after or equal to start date");
    });
  }
}

public class GenerateQuestionPerformanceDtoValidator : AbstractValidator<GenerateQuestionPerformanceDto>
{
    public GenerateQuestionPerformanceDtoValidator()
 {
        RuleFor(x => x.ExamId)
  .GreaterThan(0).WithMessage("Exam ID is required");
    }
}

public class RequestExportDtoValidator : AbstractValidator<RequestExportDto>
{
    public RequestExportDtoValidator()
    {
 RuleFor(x => x.ExamId)
        .GreaterThan(0).WithMessage("Exam ID is required");

        RuleFor(x => x.Format)
    .IsInEnum().WithMessage("Invalid export format");

 When(x => x.FromDate.HasValue && x.ToDate.HasValue, () =>
    {
    RuleFor(x => x.ToDate)
 .GreaterThanOrEqualTo(x => x.FromDate)
    .WithMessage("End date must be after or equal to start date");
     });
    }
}

public class ExportJobSearchDtoValidator : AbstractValidator<ExportJobSearchDto>
{
    public ExportJobSearchDtoValidator()
    {
   RuleFor(x => x.PageNumber)
.GreaterThan(0).WithMessage("Page number must be greater than 0");

    RuleFor(x => x.PageSize)
     .GreaterThan(0).WithMessage("Page size must be greater than 0")
.LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100");

      When(x => x.Status.HasValue, () =>
        {
 RuleFor(x => x.Status)
           .IsInEnum().WithMessage("Invalid export status");
     });

        When(x => x.RequestedFrom.HasValue && x.RequestedTo.HasValue, () =>
{
  RuleFor(x => x.RequestedTo)
    .GreaterThanOrEqualTo(x => x.RequestedFrom)
    .WithMessage("End date must be after or equal to start date");
        });
    }
}
