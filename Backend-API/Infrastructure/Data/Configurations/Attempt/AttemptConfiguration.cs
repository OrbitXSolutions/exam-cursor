using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Attempt;

namespace Smart_Core.Infrastructure.Data.Configurations.Attempt;

public class AttemptConfiguration : IEntityTypeConfiguration<Domain.Entities.Attempt.Attempt>
{
    public void Configure(EntityTypeBuilder<Domain.Entities.Attempt.Attempt> builder)
    {
        builder.ToTable("Attempts");

    builder.HasKey(x => x.Id);

      builder.Property(x => x.Id)
 .ValueGeneratedOnAdd();

        builder.Property(x => x.CandidateId)
        .IsRequired()
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
        builder.HasOne(x => x.Exam)
        .WithMany()
            .HasForeignKey(x => x.ExamId)
       .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Candidate)
      .WithMany()
            .HasForeignKey(x => x.CandidateId)
     .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Questions)
   .WithOne(x => x.Attempt)
       .HasForeignKey(x => x.AttemptId)
 .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Events)
   .WithOne(x => x.Attempt)
         .HasForeignKey(x => x.AttemptId)
            .OnDelete(DeleteBehavior.Cascade);

     // Indexes
        // Unique constraint: (ExamId, CandidateId, AttemptNumber)
        builder.HasIndex(x => new { x.ExamId, x.CandidateId, x.AttemptNumber })
            .IsUnique()
  .HasDatabaseName("IX_Attempts_ExamId_CandidateId_AttemptNumber");

        builder.HasIndex(x => new { x.ExamId, x.CandidateId })
         .HasDatabaseName("IX_Attempts_ExamId_CandidateId");

        builder.HasIndex(x => x.Status)
.HasDatabaseName("IX_Attempts_Status");

    builder.HasIndex(x => x.StartedAt)
   .HasDatabaseName("IX_Attempts_StartedAt");

   builder.HasIndex(x => x.ExpiresAt)
   .HasDatabaseName("IX_Attempts_ExpiresAt");

        builder.HasIndex(x => x.CandidateId)
         .HasDatabaseName("IX_Attempts_CandidateId");

        // Global query filter for soft delete
     builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
