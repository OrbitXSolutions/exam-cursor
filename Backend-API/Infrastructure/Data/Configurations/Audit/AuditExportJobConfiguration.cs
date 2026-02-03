using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Audit;

namespace Smart_Core.Infrastructure.Data.Configurations.Audit;

public class AuditExportJobConfiguration : IEntityTypeConfiguration<AuditExportJob>
{
    public void Configure(EntityTypeBuilder<AuditExportJob> builder)
    {
        builder.ToTable("AuditExportJobs");

builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
         .ValueGeneratedOnAdd();

        builder.Property(x => x.TenantId)
   .HasMaxLength(128);

builder.Property(x => x.EntityName)
  .HasMaxLength(128);

  builder.Property(x => x.ActionPrefix)
  .HasMaxLength(128);

 builder.Property(x => x.ActorId)
  .HasMaxLength(450);

        builder.Property(x => x.FilterJson)
 .HasMaxLength(4000);

        builder.Property(x => x.Format)
   .IsRequired();

      builder.Property(x => x.Status)
     .IsRequired();

 builder.Property(x => x.RequestedBy)
            .IsRequired()
   .HasMaxLength(450);

     builder.Property(x => x.FilePath)
    .HasMaxLength(1000);

        builder.Property(x => x.FileName)
  .HasMaxLength(256);

  builder.Property(x => x.ErrorMessage)
   .HasMaxLength(4000);

        builder.Property(x => x.CreatedBy)
  .HasMaxLength(450);

  builder.Property(x => x.UpdatedBy)
            .HasMaxLength(450);

     builder.Property(x => x.DeletedBy)
.HasMaxLength(450);

      // Relationships
    builder.HasOne(x => x.Requester)
    .WithMany()
 .HasForeignKey(x => x.RequestedBy)
     .OnDelete(DeleteBehavior.Restrict);

        // Indexes
     builder.HasIndex(x => x.Status)
  .HasDatabaseName("IX_AuditExportJobs_Status");

        builder.HasIndex(x => x.RequestedBy)
.HasDatabaseName("IX_AuditExportJobs_RequestedBy");

     builder.HasIndex(x => x.RequestedAt)
            .HasDatabaseName("IX_AuditExportJobs_RequestedAt");

   builder.HasIndex(x => new { x.Status, x.RequestedAt })
   .HasDatabaseName("IX_AuditExportJobs_Status_RequestedAt");

   // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
