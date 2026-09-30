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

        // Provider identifiers are opaque, case-sensitive values. Deleted accounts retain
        // their reservation: deleting an account must not transfer its external identity.
        foreach (var property in new[] { nameof(ApplicationUser.UaePassIssuer),
                     nameof(ApplicationUser.UaePassSubject), nameof(ApplicationUser.GovernmentIssuer),
                     nameof(ApplicationUser.GovernmentSubject) })
            builder.Property<string>(property).HasMaxLength(200).UseCollation("Latin1_General_100_BIN2");
        builder.HasIndex(u => new { u.UaePassIssuer, u.UaePassSubject }).IsUnique()
            .HasFilter("[UaePassIssuer] IS NOT NULL AND [UaePassSubject] IS NOT NULL");
        builder.HasIndex(u => new { u.GovernmentIssuer, u.GovernmentSubject }).IsUnique()
            .HasFilter("[GovernmentIssuer] IS NOT NULL AND [GovernmentSubject] IS NOT NULL");
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_AspNetUsers_UaePassIdentity", "([UaePassIssuer] IS NULL AND [UaePassSubject] IS NULL AND [UaePassLinkedAt] IS NULL) OR ([UaePassIssuer] IS NOT NULL AND [UaePassSubject] IS NOT NULL AND [UaePassLinkedAt] IS NOT NULL)");
            t.HasCheckConstraint("CK_AspNetUsers_GovernmentIdentity", "([GovernmentIssuer] IS NULL AND [GovernmentSubject] IS NULL AND [GovernmentLinkedAt] IS NULL) OR ([GovernmentIssuer] IS NOT NULL AND [GovernmentSubject] IS NOT NULL AND [GovernmentLinkedAt] IS NOT NULL)");
        });
    }
}
