using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Assessment;

namespace Smart_Core.Infrastructure.Data.Configurations.Assessment;

public class ExamSectionConfiguration : IEntityTypeConfiguration<ExamSection>
{
    public void Configure(EntityTypeBuilder<ExamSection> builder)
    {
   builder.ToTable("ExamSections");

 builder.HasKey(x => x.Id);

 builder.Property(x => x.Id)
     .ValueGeneratedOnAdd();

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

     builder.Property(x => x.TotalPointsOverride)
.HasPrecision(10, 2);

        builder.Property(x => x.CreatedBy)
    .HasMaxLength(450);

        builder.Property(x => x.UpdatedBy)
     .HasMaxLength(450);

     builder.Property(x => x.DeletedBy)
 .HasMaxLength(450);

        // Relationships
      builder.HasMany(x => x.Questions)
            .WithOne(x => x.ExamSection)
     .HasForeignKey(x => x.ExamSectionId)
         .OnDelete(DeleteBehavior.Cascade);

        // Indexes - Unique order within exam
   builder.HasIndex(x => new { x.ExamId, x.Order })
            .IsUnique()
   .HasDatabaseName("IX_ExamSections_ExamId_Order");

    builder.HasIndex(x => x.ExamId)
        .HasDatabaseName("IX_ExamSections_ExamId");

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
  }
}
