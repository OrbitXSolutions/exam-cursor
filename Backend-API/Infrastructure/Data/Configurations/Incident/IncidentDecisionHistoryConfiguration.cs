using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Incident;

namespace Smart_Core.Infrastructure.Data.Configurations.Incident;

public class IncidentDecisionHistoryConfiguration : IEntityTypeConfiguration<IncidentDecisionHistory>
{
    public void Configure(EntityTypeBuilder<IncidentDecisionHistory> builder)
    {
 builder.ToTable("IncidentDecisionHistory");

        builder.HasKey(x => x.Id);

   builder.Property(x => x.Id)
.ValueGeneratedOnAdd();

  builder.Property(x => x.Outcome)
   .IsRequired();

      builder.Property(x => x.ReasonEn)
     .HasMaxLength(4000);

    builder.Property(x => x.ReasonAr)
        .HasMaxLength(4000);

    builder.Property(x => x.InternalNotes)
      .HasMaxLength(4000);

        builder.Property(x => x.DecidedBy)
 .IsRequired()
    .HasMaxLength(450);

  builder.Property(x => x.RiskScoreAtDecision)
    .HasPrecision(5, 2);

        builder.Property(x => x.CreatedBy)
  .HasMaxLength(450);

  builder.Property(x => x.UpdatedBy)
      .HasMaxLength(450);

      builder.Property(x => x.DeletedBy)
         .HasMaxLength(450);

    // Relationships - Changed to Restrict to avoid cascade paths
      builder.HasOne(x => x.IncidentCase)
  .WithMany(x => x.Decisions)
   .HasForeignKey(x => x.IncidentCaseId)
     .OnDelete(DeleteBehavior.Restrict);

    // Changed to NoAction to avoid cascade paths
        builder.HasOne(x => x.AppealRequest)
            .WithMany()
        .HasForeignKey(x => x.AppealRequestId)
    .OnDelete(DeleteBehavior.NoAction);

        // Indexes
     builder.HasIndex(x => x.IncidentCaseId)
   .HasDatabaseName("IX_IncidentDecisionHistory_IncidentCaseId");

      builder.HasIndex(x => x.AppealRequestId)
     .HasDatabaseName("IX_IncidentDecisionHistory_AppealRequestId");

        builder.HasIndex(x => x.Outcome)
            .HasDatabaseName("IX_IncidentDecisionHistory_Outcome");

     builder.HasIndex(x => x.DecidedAt)
    .HasDatabaseName("IX_IncidentDecisionHistory_DecidedAt");

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
