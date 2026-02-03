using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.ExamResult;

namespace Smart_Core.Infrastructure.Data.Configurations.ExamResult;

public class ExamReportConfiguration : IEntityTypeConfiguration<ExamReport>
{
    public void Configure(EntityTypeBuilder<ExamReport> builder)
    {
        builder.ToTable("ExamReports");

   builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
         .ValueGeneratedOnAdd();

   builder.Property(x => x.AverageScore)
 .HasPrecision(10, 2);

        builder.Property(x => x.HighestScore)
      .HasPrecision(10, 2);

        builder.Property(x => x.LowestScore)
 .HasPrecision(10, 2);

     builder.Property(x => x.PassRate)
            .HasPrecision(5, 2);

    builder.Property(x => x.AverageRiskScore)
      .HasPrecision(5, 2);

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

        // Indexes
        builder.HasIndex(x => new { x.ExamId, x.GeneratedAt })
            .HasDatabaseName("IX_ExamReports_ExamId_GeneratedAt");

   builder.HasIndex(x => x.GeneratedAt)
      .HasDatabaseName("IX_ExamReports_GeneratedAt");

 // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
