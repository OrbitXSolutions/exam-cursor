using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities;

namespace Smart_Core.Infrastructure.Data.Configurations;

public class ApplicationRoleConfiguration : IEntityTypeConfiguration<ApplicationRole>
{
    public void Configure(EntityTypeBuilder<ApplicationRole> builder)
    {
      builder.Property(r => r.Description)
     .HasMaxLength(500);

        builder.Property(r => r.CreatedBy)
   .HasMaxLength(450);

      builder.Property(r => r.UpdatedBy)
       .HasMaxLength(450);

        // Global query filter for soft delete
  builder.HasQueryFilter(r => !r.IsDeleted);
    }
}
