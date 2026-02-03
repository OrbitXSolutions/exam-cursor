using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.ExamResult;

namespace Smart_Core.Infrastructure.Data.Configurations.ExamResult;

public class QuestionPerformanceReportConfiguration : IEntityTypeConfiguration<QuestionPerformanceReport>
{
    public void Configure(EntityTypeBuilder<QuestionPerformanceReport> builder)
    {
     builder.ToTable("QuestionPerformanceReports");

     builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
     .ValueGeneratedOnAdd();

    builder.Property(x => x.CorrectRate)
   .HasPrecision(5, 4);

      builder.Property(x => x.AverageScore)
       .HasPrecision(10, 2);

        builder.Property(x => x.MaxPoints)
         .HasPrecision(10, 2);

       builder.Property(x => x.DifficultyIndex)
.HasPrecision(5, 4);

       builder.Property(x => x.GeneratedBy)
            .IsRequired()
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

        builder.HasOne(x => x.Question)
.WithMany()
          .HasForeignKey(x => x.QuestionId)
 .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(x => new { x.ExamId, x.QuestionId })
   .HasDatabaseName("IX_QuestionPerformanceReports_ExamId_QuestionId");

        builder.HasIndex(x => x.ExamId)
   .HasDatabaseName("IX_QuestionPerformanceReports_ExamId");

    builder.HasIndex(x => x.GeneratedAt)
       .HasDatabaseName("IX_QuestionPerformanceReports_GeneratedAt");

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
  }
}
