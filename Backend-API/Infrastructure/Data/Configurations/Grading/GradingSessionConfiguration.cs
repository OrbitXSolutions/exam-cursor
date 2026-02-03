using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Grading;

namespace Smart_Core.Infrastructure.Data.Configurations.Grading;

public class GradingSessionConfiguration : IEntityTypeConfiguration<GradingSession>
{
    public void Configure(EntityTypeBuilder<GradingSession> builder)
    {
    builder.ToTable("GradingSessions");

    builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
 .ValueGeneratedOnAdd();

        builder.Property(x => x.GradedBy)
 .HasMaxLength(450);

        builder.Property(x => x.Status)
            .IsRequired();

        builder.Property(x => x.TotalScore)
 .HasPrecision(10, 2);

        builder.Property(x => x.CreatedBy)
            .HasMaxLength(450);

builder.Property(x => x.UpdatedBy)
  .HasMaxLength(450);

        builder.Property(x => x.DeletedBy)
            .HasMaxLength(450);

        // Relationships
        builder.HasOne(x => x.Attempt)
   .WithMany()
            .HasForeignKey(x => x.AttemptId)
  .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Grader)
   .WithMany()
            .HasForeignKey(x => x.GradedBy)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(x => x.Answers)
         .WithOne(x => x.GradingSession)
 .HasForeignKey(x => x.GradingSessionId)
            .OnDelete(DeleteBehavior.Cascade);

    // Indexes
        // Unique constraint: One grading session per attempt
        builder.HasIndex(x => x.AttemptId)
    .IsUnique()
            .HasDatabaseName("IX_GradingSessions_AttemptId_Unique");

        builder.HasIndex(x => x.Status)
       .HasDatabaseName("IX_GradingSessions_Status");

        builder.HasIndex(x => x.GradedBy)
          .HasDatabaseName("IX_GradingSessions_GradedBy");

        builder.HasIndex(x => x.GradedAt)
            .HasDatabaseName("IX_GradingSessions_GradedAt");

        // Global query filter for soft delete
 builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
