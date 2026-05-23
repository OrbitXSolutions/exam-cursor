using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Assessment;

namespace Smart_Core.Infrastructure.Data.Configurations.Assessment;

public class WalkInRegistrationFieldConfiguration : IEntityTypeConfiguration<WalkInRegistrationField>
{
    public void Configure(EntityTypeBuilder<WalkInRegistrationField> builder)
    {
        builder.ToTable("WalkInRegistrationFields");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .ValueGeneratedOnAdd();

        builder.Property(x => x.LabelEn)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.LabelAr)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.FieldType)
            .HasConversion<int>();

        builder.Property(x => x.CreatedBy)
            .HasMaxLength(450);

        builder.Property(x => x.UpdatedBy)
            .HasMaxLength(450);

        builder.Property(x => x.DeletedBy)
            .HasMaxLength(450);

        // Indexes
        builder.HasIndex(x => x.ExamId)
            .HasDatabaseName("IX_WalkInRegistrationFields_ExamId");

        builder.HasIndex(x => new { x.ExamId, x.DisplayOrder })
            .HasDatabaseName("IX_WalkInRegistrationFields_ExamId_DisplayOrder");

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
