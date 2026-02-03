using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.QuestionBank;

namespace Smart_Core.Infrastructure.Data.Configurations.QuestionBank;

public class QuestionAnswerKeyConfiguration : IEntityTypeConfiguration<QuestionAnswerKey>
{
    public void Configure(EntityTypeBuilder<QuestionAnswerKey> builder)
 {
        builder.ToTable("QuestionAnswerKeys");

        builder.HasKey(x => x.Id);

   builder.Property(x => x.Id)
      .ValueGeneratedOnAdd();

        // ShortAnswer properties - Bilingual
        builder.Property(x => x.AcceptedAnswersJsonEn)
       .HasColumnType("nvarchar(max)");

    builder.Property(x => x.AcceptedAnswersJsonAr)
    .HasColumnType("nvarchar(max)");

     builder.Property(x => x.CaseSensitive)
 .HasDefaultValue(false);

      builder.Property(x => x.TrimSpaces)
        .HasDefaultValue(true);

        builder.Property(x => x.NormalizeWhitespace)
         .HasDefaultValue(true);

   // Essay properties - Already bilingual
        builder.Property(x => x.RubricTextEn)
   .HasColumnType("nvarchar(max)");

        builder.Property(x => x.RubricTextAr)
 .HasColumnType("nvarchar(max)");

        // Numeric properties
        builder.Property(x => x.NumericAnswer)
     .HasPrecision(18, 6);

        builder.Property(x => x.Tolerance)
            .HasPrecision(18, 6);

        // Audit fields
        builder.Property(x => x.CreatedBy)
   .HasMaxLength(450);

      builder.Property(x => x.UpdatedBy)
            .HasMaxLength(450);

    builder.Property(x => x.DeletedBy)
   .HasMaxLength(450);

        // One-to-Zero-or-One relationship with Question
        builder.HasOne(x => x.Question)
 .WithOne(q => q.AnswerKey)
        .HasForeignKey<QuestionAnswerKey>(x => x.QuestionId)
        .OnDelete(DeleteBehavior.Cascade);

        // Unique constraint: one AnswerKey per Question
        builder.HasIndex(x => x.QuestionId)
  .IsUnique()
.HasDatabaseName("IX_QuestionAnswerKeys_QuestionId");

     // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
