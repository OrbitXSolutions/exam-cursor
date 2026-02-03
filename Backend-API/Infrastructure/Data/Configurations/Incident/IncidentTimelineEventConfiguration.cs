using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Incident;

namespace Smart_Core.Infrastructure.Data.Configurations.Incident;

public class IncidentTimelineEventConfiguration : IEntityTypeConfiguration<IncidentTimelineEvent>
{
    public void Configure(EntityTypeBuilder<IncidentTimelineEvent> builder)
    {
        builder.ToTable("IncidentTimelineEvents");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
 .ValueGeneratedOnAdd();

        builder.Property(x => x.EventType)
 .IsRequired();

     builder.Property(x => x.ActorId)
      .HasMaxLength(450);

   builder.Property(x => x.ActorName)
    .HasMaxLength(200);

        builder.Property(x => x.DescriptionEn)
     .HasMaxLength(1000);

        builder.Property(x => x.DescriptionAr)
    .HasMaxLength(1000);

        builder.Property(x => x.MetadataJson)
 .HasMaxLength(4000);

        builder.Property(x => x.CreatedBy)
    .HasMaxLength(450);

  builder.Property(x => x.UpdatedBy)
 .HasMaxLength(450);

     builder.Property(x => x.DeletedBy)
  .HasMaxLength(450);

     // Relationships - Changed to Restrict to avoid cascade paths
  builder.HasOne(x => x.IncidentCase)
  .WithMany(x => x.Timeline)
    .HasForeignKey(x => x.IncidentCaseId)
        .OnDelete(DeleteBehavior.Restrict);

        // Indexes
      builder.HasIndex(x => x.IncidentCaseId)
    .HasDatabaseName("IX_IncidentTimelineEvents_IncidentCaseId");

 builder.HasIndex(x => x.EventType)
 .HasDatabaseName("IX_IncidentTimelineEvents_EventType");

     builder.HasIndex(x => x.OccurredAt)
     .HasDatabaseName("IX_IncidentTimelineEvents_OccurredAt");

     // Global query filter for soft delete
    builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
