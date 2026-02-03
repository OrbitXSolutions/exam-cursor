using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.QuestionBank;

namespace Smart_Core.Infrastructure.Data.Configurations.QuestionBank;

public class QuestionAttachmentConfiguration : IEntityTypeConfiguration<QuestionAttachment>
{
    public void Configure(EntityTypeBuilder<QuestionAttachment> builder)
{
        builder.ToTable("QuestionAttachments");

  builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
       .ValueGeneratedOnAdd();

   builder.Property(x => x.FileName)
    .IsRequired()
   .HasMaxLength(255);

   builder.Property(x => x.FilePath)
        .IsRequired()
.HasMaxLength(1000);

      builder.Property(x => x.FileType)
   .IsRequired()
            .HasMaxLength(50);

    builder.Property(x => x.IsPrimary)
 .HasDefaultValue(false);

   builder.Property(x => x.CreatedBy)
          .HasMaxLength(450);

 builder.Property(x => x.UpdatedBy)
.HasMaxLength(450);

    builder.Property(x => x.DeletedBy)
  .HasMaxLength(450);

   // Indexes
        builder.HasIndex(x => x.QuestionId)
      .HasDatabaseName("IX_QuestionAttachments_QuestionId");

  builder.HasIndex(x => new { x.QuestionId, x.IsPrimary })
    .HasDatabaseName("IX_QuestionAttachments_QuestionId_IsPrimary");

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
