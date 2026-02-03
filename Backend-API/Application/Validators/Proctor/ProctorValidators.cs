using FluentValidation;
using Smart_Core.Application.DTOs.Proctor;

namespace Smart_Core.Application.Validators.Proctor;

public class CreateProctorSessionDtoValidator : AbstractValidator<CreateProctorSessionDto>
{
    public CreateProctorSessionDtoValidator()
    {
    RuleFor(x => x.AttemptId)
         .GreaterThan(0).WithMessage("Attempt ID is required");

        RuleFor(x => x.Mode)
         .IsInEnum().WithMessage("Invalid proctor mode");

        RuleFor(x => x.DeviceFingerprint)
    .MaximumLength(500).WithMessage("Device fingerprint too long");

   RuleFor(x => x.UserAgent)
    .MaximumLength(1000).WithMessage("User agent too long");
    }
}

public class LogProctorEventDtoValidator : AbstractValidator<LogProctorEventDto>
{
    public LogProctorEventDtoValidator()
  {
    RuleFor(x => x.ProctorSessionId)
 .GreaterThan(0).WithMessage("Proctor session ID is required");

     RuleFor(x => x.EventType)
     .IsInEnum().WithMessage("Invalid event type");

    RuleFor(x => x.Severity)
  .LessThanOrEqualTo((byte)5).WithMessage("Severity must be between 0 and 5");

     RuleFor(x => x.MetadataJson)
        .MaximumLength(4000).WithMessage("Metadata too long");
    }
}

public class LogProctorEventItemDtoValidator : AbstractValidator<LogProctorEventItemDto>
{
    public LogProctorEventItemDtoValidator()
    {
    RuleFor(x => x.EventType)
      .IsInEnum().WithMessage("Invalid event type");

    RuleFor(x => x.Severity)
          .LessThanOrEqualTo((byte)5).WithMessage("Severity must be between 0 and 5");

     RuleFor(x => x.MetadataJson)
   .MaximumLength(4000).WithMessage("Metadata too long");
    }
}

public class BulkLogProctorEventsDtoValidator : AbstractValidator<BulkLogProctorEventsDto>
{
    public BulkLogProctorEventsDtoValidator()
    {
      RuleFor(x => x.ProctorSessionId)
            .GreaterThan(0).WithMessage("Proctor session ID is required");

        RuleFor(x => x.Events)
     .NotEmpty().WithMessage("At least one event is required")
     .Must(x => x.Count <= 100).WithMessage("Cannot log more than 100 events at once");

     RuleForEach(x => x.Events)
       .SetValidator(new LogProctorEventItemDtoValidator());
    }
}

public class HeartbeatDtoValidator : AbstractValidator<HeartbeatDto>
{
    public HeartbeatDtoValidator()
    {
    RuleFor(x => x.ProctorSessionId)
            .GreaterThan(0).WithMessage("Proctor session ID is required");

     RuleFor(x => x.MetadataJson)
 .MaximumLength(4000).WithMessage("Metadata too long");
}
}

public class SaveProctorRiskRuleDtoValidator : AbstractValidator<SaveProctorRiskRuleDto>
{
    public SaveProctorRiskRuleDtoValidator()
    {
     RuleFor(x => x.NameEn)
   .NotEmpty().WithMessage("English name is required")
  .MaximumLength(200).WithMessage("Name too long");

      RuleFor(x => x.NameAr)
  .NotEmpty().WithMessage("Arabic name is required")
   .MaximumLength(200).WithMessage("Name too long");

 RuleFor(x => x.EventType)
     .IsInEnum().WithMessage("Invalid event type");

        RuleFor(x => x.ThresholdCount)
  .GreaterThan(0).WithMessage("Threshold count must be greater than 0");

 RuleFor(x => x.WindowSeconds)
    .GreaterThanOrEqualTo(0).WithMessage("Window seconds must be 0 or greater");

        RuleFor(x => x.RiskPoints)
         .InclusiveBetween(0, 100).WithMessage("Risk points must be between 0 and 100");

        When(x => x.MinSeverity.HasValue, () =>
        {
            RuleFor(x => x.MinSeverity)
           .LessThanOrEqualTo((byte)5).WithMessage("Min severity must be between 0 and 5");
  });
    }
}

public class UploadEvidenceDtoValidator : AbstractValidator<UploadEvidenceDto>
{
 public UploadEvidenceDtoValidator()
    {
      RuleFor(x => x.ProctorSessionId)
 .GreaterThan(0).WithMessage("Proctor session ID is required");

    RuleFor(x => x.Type)
 .IsInEnum().WithMessage("Invalid evidence type");

        RuleFor(x => x.FileName)
   .NotEmpty().WithMessage("File name is required")
 .MaximumLength(500).WithMessage("File name too long");

       RuleFor(x => x.MetadataJson)
   .MaximumLength(4000).WithMessage("Metadata too long");
 }
}

public class MakeDecisionDtoValidator : AbstractValidator<MakeDecisionDto>
{
  public MakeDecisionDtoValidator()
    {
        RuleFor(x => x.ProctorSessionId)
.GreaterThan(0).WithMessage("Proctor session ID is required");

        RuleFor(x => x.Status)
    .IsInEnum().WithMessage("Invalid decision status");

    RuleFor(x => x.DecisionReasonEn)
      .MaximumLength(2000).WithMessage("Reason too long");

   RuleFor(x => x.DecisionReasonAr)
 .MaximumLength(2000).WithMessage("Reason too long");

    RuleFor(x => x.InternalNotes)
    .MaximumLength(4000).WithMessage("Notes too long");
    }
}

public class OverrideDecisionDtoValidator : AbstractValidator<OverrideDecisionDto>
{
    public OverrideDecisionDtoValidator()
    {
        RuleFor(x => x.DecisionId)
   .GreaterThan(0).WithMessage("Decision ID is required");

        RuleFor(x => x.NewStatus)
            .IsInEnum().WithMessage("Invalid decision status");

 RuleFor(x => x.OverrideReason)
  .NotEmpty().WithMessage("Override reason is required")
  .MaximumLength(2000).WithMessage("Reason too long");
    }
}

public class ProctorSessionSearchDtoValidator : AbstractValidator<ProctorSessionSearchDto>
{
    public ProctorSessionSearchDtoValidator()
    {
        RuleFor(x => x.PageNumber)
   .GreaterThan(0).WithMessage("Page number must be greater than 0");

     RuleFor(x => x.PageSize)
      .GreaterThan(0).WithMessage("Page size must be greater than 0")
          .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100");

        When(x => x.Mode.HasValue, () =>
    {
    RuleFor(x => x.Mode)
   .IsInEnum().WithMessage("Invalid proctor mode");
        });

        When(x => x.Status.HasValue, () =>
      {
RuleFor(x => x.Status)
      .IsInEnum().WithMessage("Invalid session status");
        });

      When(x => x.MinRiskScore.HasValue, () =>
  {
      RuleFor(x => x.MinRiskScore)
          .InclusiveBetween(0, 100).WithMessage("Risk score must be between 0 and 100");
        });
    }
}
