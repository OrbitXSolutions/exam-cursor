using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Attempt;

namespace Smart_Core.Infrastructure.Data.Configurations.Attempt;

public class AttemptQuestionConfiguration : IEntityTypeConfiguration<AttemptQuestion>
{
 public void Configure(EntityTypeBuilder<AttemptQuestion> builder)
    {
 builder.ToTable("AttemptQuestions");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
         .ValueGeneratedOnAdd();

      builder.Property(x => x.Points)
  .HasPrecision(10, 2);

     builder.Property(x => x.CreatedBy)
       .HasMaxLength(450);

        builder.Property(x => x.UpdatedBy)
.HasMaxLength(450);

 builder.Property(x => x.DeletedBy)
 .HasMaxLength(450);

        // Relationships
     builder.HasOne(x => x.Attempt)
  .WithMany(x => x.Questions)
   .HasForeignKey(x => x.AttemptId)
         .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Question)
            .WithMany()
        .HasForeignKey(x => x.QuestionId)
.OnDelete(DeleteBehavior.Restrict);

  builder.HasMany(x => x.Answers)
.WithOne(x => x.AttemptQuestion)
     .HasForeignKey(x => x.AttemptQuestionId)
  .OnDelete(DeleteBehavior.Cascade);

        // Indexes
    // Unique constraint: (AttemptId, QuestionId)
     builder.HasIndex(x => new { x.AttemptId, x.QuestionId })
      .IsUnique()
 .HasDatabaseName("IX_AttemptQuestions_AttemptId_QuestionId");

        builder.HasIndex(x => x.AttemptId)
  .HasDatabaseName("IX_AttemptQuestions_AttemptId");

        builder.HasIndex(x => x.Order)
            .HasDatabaseName("IX_AttemptQuestions_Order");

        // Global query filter for soft delete
     builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
