using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Lookups;

namespace Smart_Core.Infrastructure.Data.Configurations.Lookups;

public class QuestionCategoryConfiguration : IEntityTypeConfiguration<QuestionCategory>
{
    public void Configure(EntityTypeBuilder<QuestionCategory> builder)
    {
    builder.ToTable("QuestionCategories");

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

        // Unique indexes
    builder.HasIndex(x => x.NameEn)
         .IsUnique()
        .HasDatabaseName("IX_QuestionCategories_NameEn");

        builder.HasIndex(x => x.NameAr)
 .IsUnique()
    .HasDatabaseName("IX_QuestionCategories_NameAr");

        // Global query filter for soft delete
     builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
