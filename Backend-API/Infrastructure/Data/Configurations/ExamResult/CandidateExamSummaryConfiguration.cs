using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.ExamResult;

namespace Smart_Core.Infrastructure.Data.Configurations.ExamResult;

public class CandidateExamSummaryConfiguration : IEntityTypeConfiguration<CandidateExamSummary>
{
    public void Configure(EntityTypeBuilder<CandidateExamSummary> builder)
    {
     builder.ToTable("CandidateExamSummaries");

   builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
   .ValueGeneratedOnAdd();

 builder.Property(x => x.CandidateId)
.IsRequired()
            .HasMaxLength(450);

 builder.Property(x => x.BestScore)
      .HasPrecision(10, 2);

    builder.Property(x => x.LatestScore)
     .HasPrecision(10, 2);

        builder.Property(x => x.CreatedBy)
            .HasMaxLength(450);

builder.Property(x => x.UpdatedBy)
   .HasMaxLength(450);

        builder.Property(x => x.DeletedBy)
  .HasMaxLength(450);

      // Relationships
        builder.HasOne(x => x.Exam)
   .WithMany()
      .HasForeignKey(x => x.ExamId)
          .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Candidate)
  .WithMany()
 .HasForeignKey(x => x.CandidateId)
   .OnDelete(DeleteBehavior.Restrict);

      builder.HasOne(x => x.BestAttempt)
      .WithMany()
 .HasForeignKey(x => x.BestAttemptId)
     .OnDelete(DeleteBehavior.SetNull);

 builder.HasOne(x => x.BestResult)
 .WithMany()
     .HasForeignKey(x => x.BestResultId)
    .OnDelete(DeleteBehavior.SetNull);

   // Indexes
        // Unique constraint: One summary per (ExamId, CandidateId)
        builder.HasIndex(x => new { x.ExamId, x.CandidateId })
  .IsUnique()
  .HasDatabaseName("IX_CandidateExamSummaries_ExamId_CandidateId_Unique");

      builder.HasIndex(x => x.CandidateId)
        .HasDatabaseName("IX_CandidateExamSummaries_CandidateId");

    builder.HasIndex(x => x.ExamId)
     .HasDatabaseName("IX_CandidateExamSummaries_ExamId");

        // Global query filter for soft delete
    builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
