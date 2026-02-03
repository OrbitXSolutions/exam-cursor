using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.ExamResult;

namespace Smart_Core.Infrastructure.Data.Configurations.ExamResult;

public class ResultConfiguration : IEntityTypeConfiguration<Result>
{
    public void Configure(EntityTypeBuilder<Result> builder)
    {
 builder.ToTable("Results");

      builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .ValueGeneratedOnAdd();

        builder.Property(x => x.CandidateId)
            .IsRequired()
       .HasMaxLength(450);

        builder.Property(x => x.TotalScore)
            .HasPrecision(10, 2);

        builder.Property(x => x.MaxPossibleScore)
            .HasPrecision(10, 2);

        builder.Property(x => x.PassScore)
            .HasPrecision(10, 2);

        builder.Property(x => x.GradeLabel)
          .HasMaxLength(50);

  builder.Property(x => x.PublishedBy)
         .HasMaxLength(450);

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

        builder.HasOne(x => x.Attempt)
    .WithMany()
        .HasForeignKey(x => x.AttemptId)
   .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Candidate)
            .WithMany()
     .HasForeignKey(x => x.CandidateId)
          .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        // Unique constraint: One result per attempt
        builder.HasIndex(x => x.AttemptId)
         .IsUnique()
        .HasDatabaseName("IX_Results_AttemptId_Unique");

        builder.HasIndex(x => new { x.ExamId, x.CandidateId })
            .HasDatabaseName("IX_Results_ExamId_CandidateId");

        builder.HasIndex(x => new { x.ExamId, x.IsPassed })
            .HasDatabaseName("IX_Results_ExamId_IsPassed");

   builder.HasIndex(x => x.FinalizedAt)
       .HasDatabaseName("IX_Results_FinalizedAt");

        builder.HasIndex(x => x.IsPublishedToCandidate)
            .HasDatabaseName("IX_Results_IsPublishedToCandidate");

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
