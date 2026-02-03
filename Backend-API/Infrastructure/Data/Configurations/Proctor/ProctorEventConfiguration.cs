using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Proctor;

namespace Smart_Core.Infrastructure.Data.Configurations.Proctor;

public class ProctorEventConfiguration : IEntityTypeConfiguration<ProctorEvent>
{
    public void Configure(EntityTypeBuilder<ProctorEvent> builder)
    {
      builder.ToTable("ProctorEvents");

        builder.HasKey(x => x.Id);

     builder.Property(x => x.Id)
     .ValueGeneratedOnAdd();

        builder.Property(x => x.EventType)
 .IsRequired();

        builder.Property(x => x.Severity)
            .IsRequired();

        builder.Property(x => x.MetadataJson)
    .HasMaxLength(4000);

   builder.Property(x => x.CreatedBy)
       .HasMaxLength(450);

   builder.Property(x => x.UpdatedBy)
  .HasMaxLength(450);

        builder.Property(x => x.DeletedBy)
    .HasMaxLength(450);

   // Relationships - Changed to Restrict to avoid multiple cascade paths
        builder.HasOne(x => x.ProctorSession)
  .WithMany(x => x.Events)
       .HasForeignKey(x => x.ProctorSessionId)
          .OnDelete(DeleteBehavior.Restrict);

        // Indexes
    builder.HasIndex(x => x.ProctorSessionId)
    .HasDatabaseName("IX_ProctorEvents_ProctorSessionId");

      builder.HasIndex(x => x.AttemptId)
 .HasDatabaseName("IX_ProctorEvents_AttemptId");

      builder.HasIndex(x => x.EventType)
            .HasDatabaseName("IX_ProctorEvents_EventType");

      builder.HasIndex(x => x.OccurredAt)
     .HasDatabaseName("IX_ProctorEvents_OccurredAt");

        builder.HasIndex(x => x.IsViolation)
 .HasDatabaseName("IX_ProctorEvents_IsViolation");

   builder.HasIndex(x => new { x.ProctorSessionId, x.EventType, x.OccurredAt })
            .HasDatabaseName("IX_ProctorEvents_Session_Type_Time");

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
