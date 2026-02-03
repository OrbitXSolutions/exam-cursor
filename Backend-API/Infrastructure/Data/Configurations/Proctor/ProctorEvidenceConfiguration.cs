using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Proctor;

namespace Smart_Core.Infrastructure.Data.Configurations.Proctor;

public class ProctorEvidenceConfiguration : IEntityTypeConfiguration<ProctorEvidence>
{
    public void Configure(EntityTypeBuilder<ProctorEvidence> builder)
    {
        builder.ToTable("ProctorEvidence");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .ValueGeneratedOnAdd();

 builder.Property(x => x.Type)
     .IsRequired();

        builder.Property(x => x.FileName)
         .IsRequired()
        .HasMaxLength(500);

        builder.Property(x => x.FilePath)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(x => x.ContentType)
  .HasMaxLength(100);

     builder.Property(x => x.Checksum)
 .HasMaxLength(128);

        builder.Property(x => x.ChecksumAlgorithm)
     .HasMaxLength(20);

        builder.Property(x => x.UploadError)
     .HasMaxLength(2000);

        builder.Property(x => x.MetadataJson)
            .HasMaxLength(4000);

        builder.Property(x => x.CreatedBy)
     .HasMaxLength(450);

  builder.Property(x => x.UpdatedBy)
            .HasMaxLength(450);

        builder.Property(x => x.DeletedBy)
            .HasMaxLength(450);

    // Relationships - Changed to Restrict to avoid multiple cascade paths
        builder.HasOne(x => x.ProctorSession)
  .WithMany(x => x.EvidenceItems)
    .HasForeignKey(x => x.ProctorSessionId)
    .OnDelete(DeleteBehavior.Restrict);

        // Indexes
      builder.HasIndex(x => x.ProctorSessionId)
  .HasDatabaseName("IX_ProctorEvidence_ProctorSessionId");

   builder.HasIndex(x => x.AttemptId)
 .HasDatabaseName("IX_ProctorEvidence_AttemptId");

        builder.HasIndex(x => x.Type)
            .HasDatabaseName("IX_ProctorEvidence_Type");

        builder.HasIndex(x => x.IsUploaded)
     .HasDatabaseName("IX_ProctorEvidence_IsUploaded");

        builder.HasIndex(x => x.ExpiresAt)
     .HasDatabaseName("IX_ProctorEvidence_ExpiresAt");

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
 }
}
