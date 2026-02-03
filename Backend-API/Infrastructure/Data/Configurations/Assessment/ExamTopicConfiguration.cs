using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Assessment;

namespace Smart_Core.Infrastructure.Data.Configurations.Assessment;

public class ExamTopicConfiguration : IEntityTypeConfiguration<ExamTopic>
{
    public void Configure(EntityTypeBuilder<ExamTopic> builder)
    {
        builder.ToTable("ExamTopics");

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

        builder.Property(x => x.CreatedBy)
         .HasMaxLength(450);

      builder.Property(x => x.UpdatedBy)
        .HasMaxLength(450);

        builder.Property(x => x.DeletedBy)
            .HasMaxLength(450);

    // Relationships - Changed to Restrict to avoid cascade path issues
    builder.HasOne(x => x.ExamSection)
      .WithMany(x => x.Topics)
  .HasForeignKey(x => x.ExamSectionId)
      .OnDelete(DeleteBehavior.Restrict);

  builder.HasMany(x => x.Questions)
          .WithOne(x => x.ExamTopic)
          .HasForeignKey(x => x.ExamTopicId)
            .OnDelete(DeleteBehavior.NoAction);

        // Indexes
builder.HasIndex(x => x.ExamSectionId)
      .HasDatabaseName("IX_ExamTopics_ExamSectionId");

        builder.HasIndex(x => new { x.ExamSectionId, x.Order })
       .IsUnique()
            .HasDatabaseName("IX_ExamTopics_SectionId_Order");

        // Global query filter for soft delete
      builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
