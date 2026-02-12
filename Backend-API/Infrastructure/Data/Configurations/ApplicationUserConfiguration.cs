using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities;

namespace Smart_Core.Infrastructure.Data.Configurations;

public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.Property(u => u.DisplayName)
    .HasMaxLength(100);

        builder.Property(u => u.FullName)
     .HasMaxLength(200);

        builder.Property(u => u.FullNameAr)
            .HasMaxLength(200);

        builder.Property(u => u.RollNo)
            .HasMaxLength(50);

        builder.HasIndex(u => u.RollNo)
            .IsUnique()
            .HasFilter("[RollNo] IS NOT NULL")
            .HasDatabaseName("IX_AspNetUsers_RollNo");

        builder.Property(u => u.RefreshToken)
    .HasMaxLength(500);

        builder.Property(u => u.CreatedBy)
 .HasMaxLength(450);

        builder.Property(u => u.UpdatedBy)
  .HasMaxLength(450);

        builder.Property(u => u.DeletedBy)
          .HasMaxLength(450);

        builder.Property(u => u.Status)
     .HasConversion<int>();

        // Department relationship is configured in DepartmentConfiguration

        // Index for email lookups
        builder.HasIndex(u => u.Email);

        // Index for soft delete queries
        builder.HasIndex(u => u.IsDeleted);

        // Index for department lookups
        builder.HasIndex(u => u.DepartmentId)
    .HasDatabaseName("IX_AspNetUsers_DepartmentId");

        // Global query filter for soft delete
        builder.HasQueryFilter(u => !u.IsDeleted);
    }
}
