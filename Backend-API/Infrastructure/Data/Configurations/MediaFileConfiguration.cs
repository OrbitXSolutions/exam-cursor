using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities;

namespace Smart_Core.Infrastructure.Data.Configurations;

public class MediaFileConfiguration : IEntityTypeConfiguration<MediaFile>
{
    public void Configure(EntityTypeBuilder<MediaFile> builder)
    {
      builder.ToTable("MediaFiles");
        
        builder.HasKey(m => m.Id);

     builder.Property(m => m.OriginalFileName)
 .IsRequired()
    .HasMaxLength(500);

        builder.Property(m => m.StoredFileName)
       .IsRequired()
       .HasMaxLength(500);

        builder.Property(m => m.Extension)
  .IsRequired()
            .HasMaxLength(20);

        builder.Property(m => m.ContentType)
.IsRequired()
 .HasMaxLength(100);

     builder.Property(m => m.Path)
    .IsRequired()
    .HasMaxLength(1000);

        builder.Property(m => m.Url)
         .HasMaxLength(2000);

        builder.Property(m => m.BucketName)
  .HasMaxLength(100);

  builder.Property(m => m.Folder)
.HasMaxLength(200);

        builder.Property(m => m.MediaType)
    .HasConversion<int>();

      builder.Property(m => m.StorageProvider)
        .HasConversion<int>();

     builder.Property(m => m.CreatedBy)
    .HasMaxLength(450);

     builder.Property(m => m.UpdatedBy)
            .HasMaxLength(450);

        builder.Property(m => m.DeletedBy)
.HasMaxLength(450);

   // Indexes
        builder.HasIndex(m => m.Folder);
        builder.HasIndex(m => m.MediaType);
        builder.HasIndex(m => m.IsDeleted);
        builder.HasIndex(m => m.CreatedDate);

   // Global query filter for soft delete
     builder.HasQueryFilter(m => !m.IsDeleted);
}
}
