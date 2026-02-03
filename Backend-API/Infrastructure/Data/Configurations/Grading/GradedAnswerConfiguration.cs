using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Grading;

namespace Smart_Core.Infrastructure.Data.Configurations.Grading;

public class GradedAnswerConfiguration : IEntityTypeConfiguration<GradedAnswer>
{
    public void Configure(EntityTypeBuilder<GradedAnswer> builder)
    {
   builder.ToTable("GradedAnswers");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
        .ValueGeneratedOnAdd();

    builder.Property(x => x.SelectedOptionIdsJson)
       .HasMaxLength(1000);

      builder.Property(x => x.TextAnswer)
            .HasMaxLength(10000);

        builder.Property(x => x.Score)
   .HasPrecision(10, 2);

  builder.Property(x => x.GraderComment)
        .HasMaxLength(2000);

        builder.Property(x => x.CreatedBy)
            .HasMaxLength(450);

        builder.Property(x => x.UpdatedBy)
            .HasMaxLength(450);

    builder.Property(x => x.DeletedBy)
 .HasMaxLength(450);

     // Relationships
   builder.HasOne(x => x.GradingSession)
            .WithMany(x => x.Answers)
       .HasForeignKey(x => x.GradingSessionId)
         .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Question)
  .WithMany()
   .HasForeignKey(x => x.QuestionId)
       .OnDelete(DeleteBehavior.Restrict);

        // Indexes
     // Unique constraint: One graded answer per question per session
   builder.HasIndex(x => new { x.GradingSessionId, x.QuestionId })
            .IsUnique()
   .HasDatabaseName("IX_GradedAnswers_GradingSessionId_QuestionId");

 builder.HasIndex(x => x.GradingSessionId)
      .HasDatabaseName("IX_GradedAnswers_GradingSessionId");

 builder.HasIndex(x => x.AttemptId)
    .HasDatabaseName("IX_GradedAnswers_AttemptId");

        builder.HasIndex(x => x.IsManuallyGraded)
  .HasDatabaseName("IX_GradedAnswers_IsManuallyGraded");

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
