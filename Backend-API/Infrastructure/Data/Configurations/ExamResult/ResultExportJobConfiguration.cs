using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.ExamResult;

namespace Smart_Core.Infrastructure.Data.Configurations.ExamResult;

public class ResultExportJobConfiguration : IEntityTypeConfiguration<ResultExportJob>
{
    public void Configure(EntityTypeBuilder<ResultExportJob> builder)
    {
        builder.ToTable("ResultExportJobs");

        builder.HasKey(x => x.Id);

    builder.Property(x => x.Id)
    .ValueGeneratedOnAdd();

     builder.Property(x => x.Format)
 .IsRequired();

     builder.Property(x => x.Status)
      .IsRequired();

        builder.Property(x => x.RequestedBy)
         .IsRequired()
         .HasMaxLength(450);

    builder.Property(x => x.FileName)
 .HasMaxLength(500);

        builder.Property(x => x.FilePath)
    .HasMaxLength(2000);

        builder.Property(x => x.ErrorMessage)
   .HasMaxLength(4000);

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
   builder.HasIndex(x => new { x.ExamId, x.Status, x.RequestedAt })
    .HasDatabaseName("IX_ResultExportJobs_ExamId_Status_RequestedAt");

  builder.HasIndex(x => x.Status)
   .HasDatabaseName("IX_ResultExportJobs_Status");

 builder.HasIndex(x => x.RequestedBy)
    .HasDatabaseName("IX_ResultExportJobs_RequestedBy");

      builder.HasIndex(x => x.RequestedAt)
     .HasDatabaseName("IX_ResultExportJobs_RequestedAt");

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
