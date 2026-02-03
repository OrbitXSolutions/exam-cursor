using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Audit;

namespace Smart_Core.Infrastructure.Data.Configurations.Audit;

public class AuditRetentionPolicyConfiguration : IEntityTypeConfiguration<AuditRetentionPolicy>
{
    public void Configure(EntityTypeBuilder<AuditRetentionPolicy> builder)
    {
        builder.ToTable("AuditRetentionPolicies");

    builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
    .ValueGeneratedOnAdd();

        builder.Property(x => x.NameEn)
            .IsRequired()
 .HasMaxLength(200);

        builder.Property(x => x.NameAr)
.IsRequired()
       .HasMaxLength(200);

     builder.Property(x => x.DescriptionEn)
   .HasMaxLength(1000);

        builder.Property(x => x.DescriptionAr)
  .HasMaxLength(1000);

        builder.Property(x => x.EntityName)
     .HasMaxLength(128);

     builder.Property(x => x.ActionPrefix)
    .HasMaxLength(128);

        builder.Property(x => x.Channel)
.HasMaxLength(50);

  builder.Property(x => x.ActorType)
     .HasMaxLength(50);

        builder.Property(x => x.ArchiveTarget)
    .HasMaxLength(50);

   builder.Property(x => x.ArchivePathTemplate)
 .HasMaxLength(500);

        builder.Property(x => x.CreatedBy)
 .HasMaxLength(450);

    builder.Property(x => x.UpdatedBy)
    .HasMaxLength(450);

 builder.Property(x => x.DeletedBy)
.HasMaxLength(450);

  // Indexes
        builder.HasIndex(x => x.IsActive)
     .HasDatabaseName("IX_AuditRetentionPolicies_IsActive");

        builder.HasIndex(x => x.IsDefault)
       .HasDatabaseName("IX_AuditRetentionPolicies_IsDefault");

        builder.HasIndex(x => x.Priority)
.HasDatabaseName("IX_AuditRetentionPolicies_Priority");

        builder.HasIndex(x => x.EntityName)
       .HasDatabaseName("IX_AuditRetentionPolicies_EntityName");

   // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
