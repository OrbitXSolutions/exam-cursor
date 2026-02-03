using FluentValidation;
using Smart_Core.Application.DTOs.Audit;

namespace Smart_Core.Application.Validators.Audit;

public class AuditLogSearchDtoValidator : AbstractValidator<AuditLogSearchDto>
{
public AuditLogSearchDtoValidator()
    {
      RuleFor(x => x.PageNumber)
      .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
       .GreaterThan(0).WithMessage("Page size must be greater than 0")
   .LessThanOrEqualTo(500).WithMessage("Page size cannot exceed 500");

        RuleFor(x => x.Action)
   .MaximumLength(256).WithMessage("Action too long");

    RuleFor(x => x.ActionPrefix)
         .MaximumLength(128).WithMessage("Action prefix too long");

        RuleFor(x => x.EntityName)
         .MaximumLength(128).WithMessage("Entity name too long");

        RuleFor(x => x.EntityId)
         .MaximumLength(128).WithMessage("Entity ID too long");

  RuleFor(x => x.CorrelationId)
.MaximumLength(128).WithMessage("Correlation ID too long");

        RuleFor(x => x.Search)
    .MaximumLength(200).WithMessage("Search term too long");

   When(x => x.FromDate.HasValue && x.ToDate.HasValue, () =>
{
   RuleFor(x => x)
           .Must(x => x.FromDate <= x.ToDate)
  .WithMessage("FromDate must be before or equal to ToDate");
        });
    }
}

public class EntityHistoryRequestDtoValidator : AbstractValidator<EntityHistoryRequestDto>
{
    public EntityHistoryRequestDtoValidator()
    {
        RuleFor(x => x.EntityName)
            .NotEmpty().WithMessage("Entity name is required")
 .MaximumLength(128).WithMessage("Entity name too long");

      RuleFor(x => x.EntityId)
      .NotEmpty().WithMessage("Entity ID is required")
        .MaximumLength(128).WithMessage("Entity ID too long");

        RuleFor(x => x.PageNumber)
   .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
            .GreaterThan(0).WithMessage("Page size must be greater than 0")
      .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100");
    }
}

public class UserActivityRequestDtoValidator : AbstractValidator<UserActivityRequestDto>
{
    public UserActivityRequestDtoValidator()
  {
 RuleFor(x => x.UserId)
      .NotEmpty().WithMessage("User ID is required")
       .MaximumLength(450).WithMessage("User ID too long");

        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
            .GreaterThan(0).WithMessage("Page size must be greater than 0")
            .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100");

        When(x => x.FromDate.HasValue && x.ToDate.HasValue, () =>
        {
    RuleFor(x => x)
         .Must(x => x.FromDate <= x.ToDate)
          .WithMessage("FromDate must be before or equal to ToDate");
        });
    }
}

public class CreateRetentionPolicyDtoValidator : AbstractValidator<CreateRetentionPolicyDto>
{
 public CreateRetentionPolicyDtoValidator()
    {
        RuleFor(x => x.NameEn)
   .NotEmpty().WithMessage("English name is required")
            .MaximumLength(200).WithMessage("Name too long");

        RuleFor(x => x.NameAr)
            .NotEmpty().WithMessage("Arabic name is required")
    .MaximumLength(200).WithMessage("Name too long");

        RuleFor(x => x.DescriptionEn)
            .MaximumLength(1000).WithMessage("Description too long");

  RuleFor(x => x.DescriptionAr)
            .MaximumLength(1000).WithMessage("Description too long");

        RuleFor(x => x.RetentionDays)
   .GreaterThan(0).WithMessage("Retention days must be greater than 0")
            .LessThanOrEqualTo(3650).WithMessage("Retention days cannot exceed 10 years");

        RuleFor(x => x.Priority)
            .GreaterThanOrEqualTo(0).WithMessage("Priority cannot be negative");

        RuleFor(x => x.EntityName)
            .MaximumLength(128).WithMessage("Entity name too long");

        RuleFor(x => x.ActionPrefix)
    .MaximumLength(128).WithMessage("Action prefix too long");

        RuleFor(x => x.Channel)
       .MaximumLength(50).WithMessage("Channel too long");

     RuleFor(x => x.ActorType)
            .MaximumLength(50).WithMessage("Actor type too long");

   RuleFor(x => x.ArchiveTarget)
        .MaximumLength(50).WithMessage("Archive target too long");

 RuleFor(x => x.ArchivePathTemplate)
            .MaximumLength(500).WithMessage("Archive path template too long");

        When(x => x.ArchiveBeforeDelete, () =>
        {
    RuleFor(x => x.ArchiveTarget)
      .NotEmpty().WithMessage("Archive target is required when archiving is enabled");
        });
  }
}

public class UpdateRetentionPolicyDtoValidator : AbstractValidator<UpdateRetentionPolicyDto>
{
    public UpdateRetentionPolicyDtoValidator()
    {
        RuleFor(x => x.Id)
      .GreaterThan(0).WithMessage("Policy ID is required");

        RuleFor(x => x.NameEn)
.MaximumLength(200).WithMessage("Name too long");

      RuleFor(x => x.NameAr)
.MaximumLength(200).WithMessage("Name too long");

        RuleFor(x => x.DescriptionEn)
            .MaximumLength(1000).WithMessage("Description too long");

        RuleFor(x => x.DescriptionAr)
          .MaximumLength(1000).WithMessage("Description too long");

        When(x => x.RetentionDays.HasValue, () =>
      {
            RuleFor(x => x.RetentionDays)
                .GreaterThan(0).WithMessage("Retention days must be greater than 0")
   .LessThanOrEqualTo(3650).WithMessage("Retention days cannot exceed 10 years");
        });

        When(x => x.Priority.HasValue, () =>
        {
            RuleFor(x => x.Priority)
      .GreaterThanOrEqualTo(0).WithMessage("Priority cannot be negative");
   });

  RuleFor(x => x.EntityName)
 .MaximumLength(128).WithMessage("Entity name too long");

    RuleFor(x => x.ActionPrefix)
            .MaximumLength(128).WithMessage("Action prefix too long");

   RuleFor(x => x.Channel)
    .MaximumLength(50).WithMessage("Channel too long");

        RuleFor(x => x.ActorType)
      .MaximumLength(50).WithMessage("Actor type too long");

     RuleFor(x => x.ArchiveTarget)
        .MaximumLength(50).WithMessage("Archive target too long");

        RuleFor(x => x.ArchivePathTemplate)
      .MaximumLength(500).WithMessage("Archive path template too long");
    }
}

public class CreateExportJobDtoValidator : AbstractValidator<CreateExportJobDto>
{
    public CreateExportJobDtoValidator()
    {
        RuleFor(x => x.FromDate)
       .NotEmpty().WithMessage("From date is required");

        RuleFor(x => x.ToDate)
     .NotEmpty().WithMessage("To date is required")
            .GreaterThanOrEqualTo(x => x.FromDate).WithMessage("To date must be after from date");

 RuleFor(x => x)
  .Must(x => (x.ToDate - x.FromDate).TotalDays <= 365)
            .WithMessage("Export date range cannot exceed 365 days");

        RuleFor(x => x.Format)
            .IsInEnum().WithMessage("Invalid export format");

        RuleFor(x => x.TenantId)
            .MaximumLength(128).WithMessage("Tenant ID too long");

 RuleFor(x => x.EntityName)
        .MaximumLength(128).WithMessage("Entity name too long");

        RuleFor(x => x.ActionPrefix)
            .MaximumLength(128).WithMessage("Action prefix too long");

      RuleFor(x => x.ActorId)
            .MaximumLength(450).WithMessage("Actor ID too long");

        When(x => x.Outcome.HasValue, () =>
        {
            RuleFor(x => x.Outcome)
 .IsInEnum().WithMessage("Invalid outcome");
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
 .IsInEnum().WithMessage("Invalid status");
        });

        When(x => x.FromDate.HasValue && x.ToDate.HasValue, () =>
      {
         RuleFor(x => x)
       .Must(x => x.FromDate <= x.ToDate)
   .WithMessage("FromDate must be before or equal to ToDate");
        });
    }
}
