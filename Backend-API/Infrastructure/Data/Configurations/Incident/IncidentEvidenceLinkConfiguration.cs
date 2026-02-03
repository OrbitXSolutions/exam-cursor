using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Incident;

namespace Smart_Core.Infrastructure.Data.Configurations.Incident;

public class IncidentEvidenceLinkConfiguration : IEntityTypeConfiguration<IncidentEvidenceLink>
{
    public void Configure(EntityTypeBuilder<IncidentEvidenceLink> builder)
    {
        builder.ToTable("IncidentEvidenceLinks");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
         .ValueGeneratedOnAdd();

   builder.Property(x => x.NoteEn)
  .HasMaxLength(2000);

   builder.Property(x => x.NoteAr)
         .HasMaxLength(2000);

  builder.Property(x => x.LinkedBy)
  .HasMaxLength(450);

  builder.Property(x => x.CreatedBy)
 .HasMaxLength(450);

  builder.Property(x => x.UpdatedBy)
       .HasMaxLength(450);

   builder.Property(x => x.DeletedBy)
 .HasMaxLength(450);

        // Relationships - All Restrict/NoAction to avoid cascade paths
        builder.HasOne(x => x.IncidentCase)
        .WithMany(x => x.EvidenceLinks)
       .HasForeignKey(x => x.IncidentCaseId)
      .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ProctorEvidence)
    .WithMany()
   .HasForeignKey(x => x.ProctorEvidenceId)
  .OnDelete(DeleteBehavior.NoAction);

      builder.HasOne(x => x.ProctorEvent)
 .WithMany()
   .HasForeignKey(x => x.ProctorEventId)
         .OnDelete(DeleteBehavior.NoAction);

        // Indexes
   builder.HasIndex(x => x.IncidentCaseId)
   .HasDatabaseName("IX_IncidentEvidenceLinks_IncidentCaseId");

     builder.HasIndex(x => x.ProctorEvidenceId)
    .HasDatabaseName("IX_IncidentEvidenceLinks_ProctorEvidenceId");

     builder.HasIndex(x => x.ProctorEventId)
        .HasDatabaseName("IX_IncidentEvidenceLinks_ProctorEventId");

        // Global query filter for soft delete
 builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
