using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities;

namespace Smart_Core.Infrastructure.Data.Configurations;

public class DepartmentConfiguration : IEntityTypeConfiguration<Department>
{
public void Configure(EntityTypeBuilder<Department> builder)
    {
        builder.ToTable("Departments");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
        .ValueGeneratedOnAdd();

        builder.Property(x => x.NameEn)
          .IsRequired()
          .HasMaxLength(300);

        builder.Property(x => x.NameAr)
      .IsRequired()
            .HasMaxLength(300);

   builder.Property(x => x.DescriptionEn)
        .HasMaxLength(2000);

     builder.Property(x => x.DescriptionAr)
          .HasMaxLength(2000);

        builder.Property(x => x.Code)
            .HasMaxLength(50);

    builder.Property(x => x.IsActive)
         .HasDefaultValue(true);

   builder.Property(x => x.CreatedBy)
   .HasMaxLength(450);

  builder.Property(x => x.UpdatedBy)
            .HasMaxLength(450);

    builder.Property(x => x.DeletedBy)
         .HasMaxLength(450);

        // Relationships
        builder.HasMany(x => x.Users)
        .WithOne(x => x.Department)
            .HasForeignKey(x => x.DepartmentId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(x => x.NameEn)
            .IsUnique()
            .HasDatabaseName("IX_Departments_NameEn");

        builder.HasIndex(x => x.NameAr)
            .IsUnique()
            .HasDatabaseName("IX_Departments_NameAr");

builder.HasIndex(x => x.Code)
            .IsUnique()
            .HasFilter("[Code] IS NOT NULL")
       .HasDatabaseName("IX_Departments_Code");

        builder.HasIndex(x => x.IsActive)
         .HasDatabaseName("IX_Departments_IsActive");

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
