using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Proctor;

namespace Smart_Core.Infrastructure.Data.Configurations.Proctor;

public class ProctorRiskRuleConfiguration : IEntityTypeConfiguration<ProctorRiskRule>
{
  public void Configure(EntityTypeBuilder<ProctorRiskRule> builder)
    {
        builder.ToTable("ProctorRiskRules");

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

builder.Property(x => x.EventType)
        .IsRequired();

        builder.Property(x => x.RiskPoints)
    .HasPrecision(5, 2);

  builder.Property(x => x.RuleConfigJson)
     .HasMaxLength(4000);

    builder.Property(x => x.CreatedBy)
  .HasMaxLength(450);

        builder.Property(x => x.UpdatedBy)
  .HasMaxLength(450);

        builder.Property(x => x.DeletedBy)
   .HasMaxLength(450);

        // Indexes
        builder.HasIndex(x => x.IsActive)
         .HasDatabaseName("IX_ProctorRiskRules_IsActive");

  builder.HasIndex(x => x.EventType)
     .HasDatabaseName("IX_ProctorRiskRules_EventType");

   builder.HasIndex(x => x.Priority)
    .HasDatabaseName("IX_ProctorRiskRules_Priority");

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
