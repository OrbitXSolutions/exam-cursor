using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.QuestionBank;

namespace Smart_Core.Infrastructure.Data.Configurations.QuestionBank;

public class QuestionConfiguration : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> builder)
    {
        builder.ToTable("Questions");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .ValueGeneratedOnAdd();

        builder.Property(x => x.BodyEn)
            .IsRequired()
            .HasMaxLength(5000);

        builder.Property(x => x.BodyAr)
            .IsRequired()
            .HasMaxLength(5000);

        builder.Property(x => x.ExplanationEn)
            .HasMaxLength(5000);

        builder.Property(x => x.ExplanationAr)
            .HasMaxLength(5000);

        builder.Property(x => x.Points)
            .HasPrecision(10, 2);

        builder.Property(x => x.DifficultyLevel)
            .HasConversion<int>();

        builder.Property(x => x.IsActive)
            .HasDefaultValue(true);

        builder.Property(x => x.CreatedBy)
            .HasMaxLength(450);

        builder.Property(x => x.UpdatedBy)
            .HasMaxLength(450);

        builder.Property(x => x.DeletedBy)
            .HasMaxLength(450);

        // Relationships
        builder.HasOne(x => x.QuestionType)
            .WithMany()
            .HasForeignKey(x => x.QuestionTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.QuestionCategory)
            .WithMany()
            .HasForeignKey(x => x.QuestionCategoryId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Subject)
            .WithMany()
            .HasForeignKey(x => x.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Topic)
            .WithMany()
            .HasForeignKey(x => x.TopicId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Attachments)
            .WithOne(x => x.Question)
            .HasForeignKey(x => x.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Options)
            .WithOne(x => x.Question)
            .HasForeignKey(x => x.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(x => x.QuestionTypeId)
            .HasDatabaseName("IX_Questions_QuestionTypeId");

        builder.HasIndex(x => x.QuestionCategoryId)
            .HasDatabaseName("IX_Questions_QuestionCategoryId");

        builder.HasIndex(x => x.SubjectId)
            .HasDatabaseName("IX_Questions_SubjectId");

        builder.HasIndex(x => x.TopicId)
            .HasDatabaseName("IX_Questions_TopicId");

        builder.HasIndex(x => x.DifficultyLevel)
            .HasDatabaseName("IX_Questions_DifficultyLevel");

        builder.HasIndex(x => x.IsActive)
            .HasDatabaseName("IX_Questions_IsActive");

        builder.HasIndex(x => x.CreatedDate)
            .HasDatabaseName("IX_Questions_CreatedDate");

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
