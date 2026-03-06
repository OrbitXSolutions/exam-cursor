using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Lookups;

namespace Smart_Core.Infrastructure.Data.Configurations.Lookups;

public class QuestionSubjectConfiguration : IEntityTypeConfiguration<QuestionSubject>
{
    public void Configure(EntityTypeBuilder<QuestionSubject> builder)
    {
        builder.ToTable("QuestionSubjects");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .ValueGeneratedOnAdd();

        builder.Property(x => x.NameEn)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(x => x.NameAr)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(x => x.DepartmentId)
            .IsRequired();

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

        builder.HasMany(x => x.Topics)
            .WithOne(x => x.Subject)
            .HasForeignKey(x => x.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);

        // Unique indexes - subject name must be unique within department
        builder.HasIndex(x => new { x.DepartmentId, x.NameEn })
            .IsUnique()
            .HasDatabaseName("IX_QuestionSubjects_DepartmentId_NameEn");

        builder.HasIndex(x => new { x.DepartmentId, x.NameAr })
            .IsUnique()
            .HasDatabaseName("IX_QuestionSubjects_DepartmentId_NameAr");

        builder.HasIndex(x => x.DepartmentId)
            .HasDatabaseName("IX_QuestionSubjects_DepartmentId");

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
