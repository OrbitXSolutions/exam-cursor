using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Attempt;

namespace Smart_Core.Infrastructure.Data.Configurations.Attempt;

public class AttemptAnswerConfiguration : IEntityTypeConfiguration<AttemptAnswer>
{
    public void Configure(EntityTypeBuilder<AttemptAnswer> builder)
    {
        builder.ToTable("AttemptAnswers");

builder.HasKey(x => x.Id);

   builder.Property(x => x.Id)
  .ValueGeneratedOnAdd();

      builder.Property(x => x.SelectedOptionIdsJson)
     .HasMaxLength(1000);

        builder.Property(x => x.TextAnswer)
    .HasMaxLength(10000);

     builder.Property(x => x.Score)
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
   .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(x => x.AttemptQuestion)
  .WithMany(x => x.Answers)
    .HasForeignKey(x => x.AttemptQuestionId)
    .OnDelete(DeleteBehavior.Cascade);

    // Indexes
        // Unique constraint: (AttemptId, QuestionId) - one answer per question per attempt
        builder.HasIndex(x => new { x.AttemptId, x.QuestionId })
       .IsUnique()
 .HasDatabaseName("IX_AttemptAnswers_AttemptId_QuestionId");

 builder.HasIndex(x => x.AttemptId)
    .HasDatabaseName("IX_AttemptAnswers_AttemptId");

     builder.HasIndex(x => x.AttemptQuestionId)
  .HasDatabaseName("IX_AttemptAnswers_AttemptQuestionId");

        // Global query filter for soft delete
      builder.HasQueryFilter(x => !x.IsDeleted);
}
}
