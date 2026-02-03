using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Assessment;

namespace Smart_Core.Infrastructure.Data.Configurations.Assessment;

public class ExamQuestionConfiguration : IEntityTypeConfiguration<ExamQuestion>
{
    public void Configure(EntityTypeBuilder<ExamQuestion> builder)
    {
        builder.ToTable("ExamQuestions");

        builder.HasKey(x => x.Id);

     builder.Property(x => x.Id)
     .ValueGeneratedOnAdd();

  builder.Property(x => x.Points)
   .HasPrecision(10, 2);

        builder.Property(x => x.IsRequired)
 .HasDefaultValue(true);

        builder.Property(x => x.CreatedBy)
            .HasMaxLength(450);

    builder.Property(x => x.UpdatedBy)
         .HasMaxLength(450);

  builder.Property(x => x.DeletedBy)
      .HasMaxLength(450);

    // Relationships
    builder.HasOne(x => x.Question)
      .WithMany()
       .HasForeignKey(x => x.QuestionId)
     .OnDelete(DeleteBehavior.Restrict);

        // ExamTopic relationship is configured in ExamTopicConfiguration

        // Indexes
   // Unique order within section
        builder.HasIndex(x => new { x.ExamSectionId, x.Order })
   .IsUnique()
      .HasDatabaseName("IX_ExamQuestions_SectionId_Order");

        // Prevent duplicate questions in same exam
        builder.HasIndex(x => new { x.ExamId, x.QuestionId })
            .IsUnique()
    .HasDatabaseName("IX_ExamQuestions_ExamId_QuestionId");

        builder.HasIndex(x => x.ExamId)
  .HasDatabaseName("IX_ExamQuestions_ExamId");

  builder.HasIndex(x => x.ExamSectionId)
      .HasDatabaseName("IX_ExamQuestions_ExamSectionId");

        builder.HasIndex(x => x.ExamTopicId)
      .HasDatabaseName("IX_ExamQuestions_ExamTopicId");

        builder.HasIndex(x => x.QuestionId)
            .HasDatabaseName("IX_ExamQuestions_QuestionId");

   // Global query filter for soft delete
  builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
