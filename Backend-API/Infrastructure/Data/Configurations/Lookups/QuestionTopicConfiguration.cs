using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Lookups;

namespace Smart_Core.Infrastructure.Data.Configurations.Lookups;

public class QuestionTopicConfiguration : IEntityTypeConfiguration<QuestionTopic>
{
    public void Configure(EntityTypeBuilder<QuestionTopic> builder)
    {
        builder.ToTable("QuestionTopics");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .ValueGeneratedOnAdd();

        builder.Property(x => x.NameEn)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(x => x.NameAr)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(x => x.CreatedBy)
            .HasMaxLength(450);

        builder.Property(x => x.UpdatedBy)
            .HasMaxLength(450);

        builder.Property(x => x.DeletedBy)
            .HasMaxLength(450);

        // Relationships
        builder.HasOne(x => x.Subject)
            .WithMany(x => x.Topics)
            .HasForeignKey(x => x.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(x => x.SubjectId)
            .HasDatabaseName("IX_QuestionTopics_SubjectId");

        // Unique index for name within subject
        builder.HasIndex(x => new { x.SubjectId, x.NameEn })
            .IsUnique()
            .HasDatabaseName("IX_QuestionTopics_SubjectId_NameEn");

        builder.HasIndex(x => new { x.SubjectId, x.NameAr })
            .IsUnique()
            .HasDatabaseName("IX_QuestionTopics_SubjectId_NameAr");

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
