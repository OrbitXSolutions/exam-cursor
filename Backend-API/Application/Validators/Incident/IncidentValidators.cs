using FluentValidation;
using Smart_Core.Application.DTOs.Incident;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.Validators.Incident;

public class CreateIncidentCaseDtoValidator : AbstractValidator<CreateIncidentCaseDto>
{
    public CreateIncidentCaseDtoValidator()
{
      RuleFor(x => x.AttemptId)
   .GreaterThan(0).WithMessage("Attempt ID is required");

        RuleFor(x => x.Source)
 .IsInEnum().WithMessage("Invalid incident source");

   RuleFor(x => x.Severity)
       .IsInEnum().WithMessage("Invalid severity level");

    RuleFor(x => x.TitleEn)
    .NotEmpty().WithMessage("English title is required")
            .MaximumLength(500).WithMessage("Title too long");

     RuleFor(x => x.TitleAr)
            .NotEmpty().WithMessage("Arabic title is required")
     .MaximumLength(500).WithMessage("Title too long");

     RuleFor(x => x.SummaryEn)
 .MaximumLength(4000).WithMessage("Summary too long");

  RuleFor(x => x.SummaryAr)
   .MaximumLength(4000).WithMessage("Summary too long");
    }
}

public class UpdateIncidentCaseDtoValidator : AbstractValidator<UpdateIncidentCaseDto>
{
    public UpdateIncidentCaseDtoValidator()
    {
 RuleFor(x => x.Id)
  .GreaterThan(0).WithMessage("Case ID is required");

        When(x => x.Severity.HasValue, () =>
        {
     RuleFor(x => x.Severity)
   .IsInEnum().WithMessage("Invalid severity level");
        });

        RuleFor(x => x.TitleEn)
      .MaximumLength(500).WithMessage("Title too long");

        RuleFor(x => x.TitleAr)
         .MaximumLength(500).WithMessage("Title too long");

        RuleFor(x => x.SummaryEn)
     .MaximumLength(4000).WithMessage("Summary too long");

     RuleFor(x => x.SummaryAr)
            .MaximumLength(4000).WithMessage("Summary too long");
    }
}

public class IncidentCaseSearchDtoValidator : AbstractValidator<IncidentCaseSearchDto>
{
    public IncidentCaseSearchDtoValidator()
    {
        RuleFor(x => x.PageNumber)
     .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
       .GreaterThan(0).WithMessage("Page size must be greater than 0")
       .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100");

        When(x => x.Status.HasValue, () =>
  {
    RuleFor(x => x.Status)
      .IsInEnum().WithMessage("Invalid status");
        });

 When(x => x.Severity.HasValue, () =>
        {
     RuleFor(x => x.Severity)
.IsInEnum().WithMessage("Invalid severity");
        });

  When(x => x.Source.HasValue, () =>
        {
       RuleFor(x => x.Source)
           .IsInEnum().WithMessage("Invalid source");
        });

        RuleFor(x => x.Search)
        .MaximumLength(200).WithMessage("Search term too long");
    }
}

public class AssignCaseDtoValidator : AbstractValidator<AssignCaseDto>
{
    public AssignCaseDtoValidator()
    {
     RuleFor(x => x.CaseId)
        .GreaterThan(0).WithMessage("Case ID is required");

    RuleFor(x => x.AssigneeId)
.NotEmpty().WithMessage("Assignee ID is required")
   .MaximumLength(450).WithMessage("Assignee ID too long");
    }
}

public class ChangeStatusDtoValidator : AbstractValidator<ChangeStatusDto>
{
    public ChangeStatusDtoValidator()
    {
        RuleFor(x => x.CaseId)
      .GreaterThan(0).WithMessage("Case ID is required");

        RuleFor(x => x.NewStatus)
.IsInEnum().WithMessage("Invalid status");

  RuleFor(x => x.Reason)
  .MaximumLength(2000).WithMessage("Reason too long");
 }
}

public class LinkEvidenceDtoValidator : AbstractValidator<LinkEvidenceDto>
{
    public LinkEvidenceDtoValidator()
    {
        RuleFor(x => x.CaseId)
    .GreaterThan(0).WithMessage("Case ID is required");

     RuleFor(x => x)
            .Must(x => x.ProctorEvidenceId.HasValue || x.ProctorEventId.HasValue)
 .WithMessage("Either ProctorEvidenceId or ProctorEventId must be provided");

   RuleFor(x => x.NoteEn)
        .MaximumLength(2000).WithMessage("Note too long");

        RuleFor(x => x.NoteAr)
       .MaximumLength(2000).WithMessage("Note too long");
    }
}

public class RecordDecisionDtoValidator : AbstractValidator<RecordDecisionDto>
{
    public RecordDecisionDtoValidator()
    {
     RuleFor(x => x.CaseId)
   .GreaterThan(0).WithMessage("Case ID is required");

        RuleFor(x => x.Outcome)
.IsInEnum().WithMessage("Invalid outcome");

        RuleFor(x => x.ReasonEn)
     .MaximumLength(4000).WithMessage("Reason too long");

        RuleFor(x => x.ReasonAr)
 .MaximumLength(4000).WithMessage("Reason too long");

   RuleFor(x => x.InternalNotes)
            .MaximumLength(4000).WithMessage("Notes too long");
    }
}

public class AddCommentDtoValidator : AbstractValidator<AddCommentDto>
{
    public AddCommentDtoValidator()
    {
      RuleFor(x => x.CaseId)
 .GreaterThan(0).WithMessage("Case ID is required");

     RuleFor(x => x.Body)
       .NotEmpty().WithMessage("Comment body is required")
 .MaximumLength(8000).WithMessage("Comment too long");
    }
}

public class EditCommentDtoValidator : AbstractValidator<EditCommentDto>
{
    public EditCommentDtoValidator()
    {
  RuleFor(x => x.CommentId)
  .GreaterThan(0).WithMessage("Comment ID is required");

        RuleFor(x => x.Body)
  .NotEmpty().WithMessage("Comment body is required")
    .MaximumLength(8000).WithMessage("Comment too long");
    }
}

public class SubmitAppealDtoValidator : AbstractValidator<SubmitAppealDto>
{
    public SubmitAppealDtoValidator()
    {
  RuleFor(x => x.IncidentCaseId)
 .GreaterThan(0).WithMessage("Incident case ID is required");

        RuleFor(x => x.Message)
 .NotEmpty().WithMessage("Appeal message is required")
 .MaximumLength(8000).WithMessage("Message too long");

   RuleFor(x => x.SupportingInfo)
    .MaximumLength(8000).WithMessage("Supporting info too long");
    }
}

public class ReviewAppealDtoValidator : AbstractValidator<ReviewAppealDto>
{
    public ReviewAppealDtoValidator()
    {
     RuleFor(x => x.AppealId)
            .GreaterThan(0).WithMessage("Appeal ID is required");

        RuleFor(x => x.Decision)
     .IsInEnum().WithMessage("Invalid decision")
            .Must(x => x == AppealStatus.Approved || x == AppealStatus.Rejected)
  .WithMessage("Decision must be Approved or Rejected");

        RuleFor(x => x.DecisionNoteEn)
  .MaximumLength(4000).WithMessage("Decision note too long");

        RuleFor(x => x.DecisionNoteAr)
.MaximumLength(4000).WithMessage("Decision note too long");

   RuleFor(x => x.InternalNotes)
 .MaximumLength(4000).WithMessage("Internal notes too long");

        When(x => x.NewOutcome.HasValue, () =>
  {
    RuleFor(x => x.NewOutcome)
          .IsInEnum().WithMessage("Invalid outcome");
        });
    }
}

public class AppealSearchDtoValidator : AbstractValidator<AppealSearchDto>
{
    public AppealSearchDtoValidator()
    {
        RuleFor(x => x.PageNumber)
       .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
  .GreaterThan(0).WithMessage("Page size must be greater than 0")
    .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100");

 When(x => x.Status.HasValue, () =>
        {
            RuleFor(x => x.Status)
           .IsInEnum().WithMessage("Invalid status");
    });
    }
}
