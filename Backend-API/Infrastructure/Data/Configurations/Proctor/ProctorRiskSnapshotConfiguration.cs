using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Proctor;

namespace Smart_Core.Infrastructure.Data.Configurations.Proctor;

public class ProctorRiskSnapshotConfiguration : IEntityTypeConfiguration<ProctorRiskSnapshot>
{
    public void Configure(EntityTypeBuilder<ProctorRiskSnapshot> builder)
    {
        builder.ToTable("ProctorRiskSnapshots");

   builder.HasKey(x => x.Id);

     builder.Property(x => x.Id)
   .ValueGeneratedOnAdd();

        builder.Property(x => x.RiskScore)
        .HasPrecision(5, 2);

        builder.Property(x => x.EventBreakdownJson)
 .HasMaxLength(4000);

    builder.Property(x => x.TriggeredRulesJson)
  .HasMaxLength(4000);

        builder.Property(x => x.CalculatedBy)
     .IsRequired()
       .HasMaxLength(450);

   builder.Property(x => x.CreatedBy)
       .HasMaxLength(450);

 builder.Property(x => x.UpdatedBy)
 .HasMaxLength(450);

        builder.Property(x => x.DeletedBy)
    .HasMaxLength(450);

 // Relationships
        builder.HasOne(x => x.ProctorSession)
       .WithMany(x => x.RiskSnapshots)
   .HasForeignKey(x => x.ProctorSessionId)
     .OnDelete(DeleteBehavior.Cascade);

 // Indexes
   builder.HasIndex(x => x.ProctorSessionId)
        .HasDatabaseName("IX_ProctorRiskSnapshots_ProctorSessionId");

 builder.HasIndex(x => x.CalculatedAt)
         .HasDatabaseName("IX_ProctorRiskSnapshots_CalculatedAt");

        builder.HasIndex(x => x.RiskScore)
       .HasDatabaseName("IX_ProctorRiskSnapshots_RiskScore");

  // Global query filter for soft delete
   builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
