using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Infrastructure.Data.Configurations.Assessment;

public class ExamConfiguration : IEntityTypeConfiguration<Exam>
{
    public void Configure(EntityTypeBuilder<Exam> builder)
    {
    builder.ToTable("Exams");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .ValueGeneratedOnAdd();

        builder.Property(x => x.DepartmentId)
      .IsRequired();

   builder.Property(x => x.ExamType)
            .IsRequired()
         .HasDefaultValue(ExamType.Flex);

        builder.Property(x => x.TitleEn)
 .IsRequired()
    .HasMaxLength(500);

        builder.Property(x => x.TitleAr)
            .IsRequired()
        .HasMaxLength(500);

        builder.Property(x => x.DescriptionEn)
          .HasMaxLength(2000);

        builder.Property(x => x.DescriptionAr)
    .HasMaxLength(2000);

        builder.Property(x => x.PassScore)
            .HasPrecision(10, 2);

        builder.Property(x => x.IsActive)
  .HasDefaultValue(true);

        builder.Property(x => x.IsPublished)
     .HasDefaultValue(false);

        #region Result & Review Settings

        builder.Property(x => x.ShowResults)
     .HasDefaultValue(true);

        builder.Property(x => x.AllowReview)
            .HasDefaultValue(false);

        builder.Property(x => x.ShowCorrectAnswers)
      .HasDefaultValue(false);

        #endregion

        #region Proctoring Settings

        builder.Property(x => x.RequireProctoring)
.HasDefaultValue(false);

     builder.Property(x => x.RequireIdVerification)
       .HasDefaultValue(false);

        builder.Property(x => x.RequireWebcam)
            .HasDefaultValue(false);

    #endregion

        #region Security Settings

     builder.Property(x => x.PreventCopyPaste)
 .HasDefaultValue(false);

        builder.Property(x => x.PreventScreenCapture)
       .HasDefaultValue(false);

     builder.Property(x => x.RequireFullscreen)
            .HasDefaultValue(false);

   builder.Property(x => x.BrowserLockdown)
          .HasDefaultValue(false);

    #endregion

        builder.Property(x => x.CreatedBy)
            .HasMaxLength(450);

   builder.Property(x => x.UpdatedBy)
     .HasMaxLength(450);

    builder.Property(x => x.DeletedBy)
        .HasMaxLength(450);

   // Relationships
        builder.HasOne(x => x.Department)
        .WithMany()
 .HasForeignKey(x => x.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

   builder.HasMany(x => x.Sections)
         .WithOne(x => x.Exam)
            .HasForeignKey(x => x.ExamId)
      .OnDelete(DeleteBehavior.Cascade);

 // Changed to Restrict to avoid multiple cascade paths
        // ExamQuestions will be deleted through ExamSections cascade
  builder.HasMany(x => x.Questions)
          .WithOne(x => x.Exam)
            .HasForeignKey(x => x.ExamId)
     .OnDelete(DeleteBehavior.Restrict);

      builder.HasOne(x => x.AccessPolicy)
    .WithOne(x => x.Exam)
            .HasForeignKey<ExamAccessPolicy>(x => x.ExamId)
  .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Instructions)
          .WithOne(x => x.Exam)
        .HasForeignKey(x => x.ExamId)
       .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(x => x.TitleEn)
         .HasDatabaseName("IX_Exams_TitleEn");

     builder.HasIndex(x => x.IsPublished)
            .HasDatabaseName("IX_Exams_IsPublished");

        builder.HasIndex(x => x.IsActive)
  .HasDatabaseName("IX_Exams_IsActive");

        builder.HasIndex(x => x.StartAt)
          .HasDatabaseName("IX_Exams_StartAt");

        builder.HasIndex(x => x.CreatedDate)
  .HasDatabaseName("IX_Exams_CreatedDate");

        builder.HasIndex(x => x.DepartmentId)
          .HasDatabaseName("IX_Exams_DepartmentId");

        builder.HasIndex(x => x.ExamType)
            .HasDatabaseName("IX_Exams_ExamType");

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
