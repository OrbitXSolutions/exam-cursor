using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Audit;

namespace Smart_Core.Infrastructure.Data.Configurations.Audit;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
      builder.ToTable("AuditLogs");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
     .ValueGeneratedOnAdd();

        builder.Property(x => x.ActorId)
     .HasMaxLength(450);

     builder.Property(x => x.ActorType)
   .IsRequired();

        builder.Property(x => x.ActorDisplayName)
   .HasMaxLength(256);

        builder.Property(x => x.Action)
  .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.EntityName)
   .IsRequired()
            .HasMaxLength(128);

   builder.Property(x => x.EntityId)
     .IsRequired()
 .HasMaxLength(128);

   builder.Property(x => x.CorrelationId)
  .HasMaxLength(128);

        builder.Property(x => x.TenantId)
.HasMaxLength(128);

   builder.Property(x => x.IpAddress)
         .HasMaxLength(45);

        builder.Property(x => x.UserAgent)
     .HasMaxLength(1000);

        builder.Property(x => x.ErrorMessage)
    .HasMaxLength(4000);

        builder.Property(x => x.OccurredAt)
            .IsRequired();

        builder.Property(x => x.CreatedBy)
 .HasMaxLength(450);

        builder.Property(x => x.UpdatedBy)
.HasMaxLength(450);

        builder.Property(x => x.DeletedBy)
   .HasMaxLength(450);

        // Indexes for common query patterns
        builder.HasIndex(x => x.OccurredAt)
    .HasDatabaseName("IX_AuditLogs_OccurredAt");

      builder.HasIndex(x => new { x.EntityName, x.EntityId })
     .HasDatabaseName("IX_AuditLogs_EntityName_EntityId");

        builder.HasIndex(x => new { x.ActorId, x.OccurredAt })
       .HasDatabaseName("IX_AuditLogs_ActorId_OccurredAt");

        builder.HasIndex(x => x.CorrelationId)
      .HasDatabaseName("IX_AuditLogs_CorrelationId");

        builder.HasIndex(x => new { x.Action, x.Outcome })
   .HasDatabaseName("IX_AuditLogs_Action_Outcome");

        builder.HasIndex(x => x.Outcome)
   .HasDatabaseName("IX_AuditLogs_Outcome");

        builder.HasIndex(x => x.Source)
 .HasDatabaseName("IX_AuditLogs_Source");

        builder.HasIndex(x => x.Channel)
  .HasDatabaseName("IX_AuditLogs_Channel");

        // Composite index for retention policy queries
        builder.HasIndex(x => new { x.EntityName, x.Action, x.OccurredAt })
   .HasDatabaseName("IX_AuditLogs_Retention");

  // No soft delete filter - audit logs should not use soft delete
    // builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
