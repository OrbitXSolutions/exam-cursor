using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Proctor;

namespace Smart_Core.Infrastructure.Data.Configurations.Proctor;

public class ProctorDecisionConfiguration : IEntityTypeConfiguration<ProctorDecision>
{
    public void Configure(EntityTypeBuilder<ProctorDecision> builder)
    {
     builder.ToTable("ProctorDecisions");

        builder.HasKey(x => x.Id);

  builder.Property(x => x.Id)
   .ValueGeneratedOnAdd();

     builder.Property(x => x.Status)
   .IsRequired();

        builder.Property(x => x.DecisionReasonEn)
.HasMaxLength(2000);

 builder.Property(x => x.DecisionReasonAr)
   .HasMaxLength(2000);

   builder.Property(x => x.InternalNotes)
      .HasMaxLength(4000);

   builder.Property(x => x.DecidedBy)
     .HasMaxLength(450);

 builder.Property(x => x.OverriddenBy)
 .HasMaxLength(450);

    builder.Property(x => x.OverrideReason)
     .HasMaxLength(2000);

   builder.Property(x => x.CreatedBy)
   .HasMaxLength(450);

        builder.Property(x => x.UpdatedBy)
        .HasMaxLength(450);

        builder.Property(x => x.DeletedBy)
     .HasMaxLength(450);

  // Relationships
   builder.HasOne(x => x.ProctorSession)
            .WithOne(x => x.Decision)
 .HasForeignKey<ProctorDecision>(x => x.ProctorSessionId)
  .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        // Unique constraint: One decision per session
        builder.HasIndex(x => x.ProctorSessionId)
.IsUnique()
       .HasDatabaseName("IX_ProctorDecisions_ProctorSessionId_Unique");

        builder.HasIndex(x => x.AttemptId)
   .HasDatabaseName("IX_ProctorDecisions_AttemptId");

   builder.HasIndex(x => x.Status)
   .HasDatabaseName("IX_ProctorDecisions_Status");

     builder.HasIndex(x => x.DecidedAt)
            .HasDatabaseName("IX_ProctorDecisions_DecidedAt");

       builder.HasIndex(x => x.IsFinalized)
.HasDatabaseName("IX_ProctorDecisions_IsFinalized");

    // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
