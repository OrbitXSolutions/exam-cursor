using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.QuestionBank;

namespace Smart_Core.Infrastructure.Data.Configurations.QuestionBank;

public class QuestionOptionConfiguration : IEntityTypeConfiguration<QuestionOption>
{
    public void Configure(EntityTypeBuilder<QuestionOption> builder)
    {
      builder.ToTable("QuestionOptions");

builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
  .ValueGeneratedOnAdd();

        builder.Property(x => x.TextEn)
 .IsRequired()
            .HasMaxLength(1000);

     builder.Property(x => x.TextAr)
  .IsRequired()
        .HasMaxLength(1000);

    builder.Property(x => x.IsCorrect)
   .HasDefaultValue(false);

        builder.Property(x => x.Order)
            .HasDefaultValue(0);

        builder.Property(x => x.AttachmentPath)
      .HasMaxLength(1000);

      builder.Property(x => x.CreatedBy)
          .HasMaxLength(450);

     builder.Property(x => x.UpdatedBy)
       .HasMaxLength(450);

   builder.Property(x => x.DeletedBy)
  .HasMaxLength(450);

   // Indexes
        builder.HasIndex(x => x.QuestionId)
        .HasDatabaseName("IX_QuestionOptions_QuestionId");

        builder.HasIndex(x => new { x.QuestionId, x.Order })
   .HasDatabaseName("IX_QuestionOptions_QuestionId_Order");

     builder.HasIndex(x => new { x.QuestionId, x.IsCorrect })
 .HasDatabaseName("IX_QuestionOptions_QuestionId_IsCorrect");

  // Global query filter for soft delete
     builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
