using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Incident;

namespace Smart_Core.Infrastructure.Data.Configurations.Incident;

public class IncidentCommentConfiguration : IEntityTypeConfiguration<IncidentComment>
{
    public void Configure(EntityTypeBuilder<IncidentComment> builder)
    {
        builder.ToTable("IncidentComments");

builder.HasKey(x => x.Id);

  builder.Property(x => x.Id)
            .ValueGeneratedOnAdd();

        builder.Property(x => x.AuthorId)
       .IsRequired()
          .HasMaxLength(450);

        builder.Property(x => x.AuthorName)
  .HasMaxLength(200);

     builder.Property(x => x.Body)
     .IsRequired()
     .HasMaxLength(8000);

        builder.Property(x => x.CreatedBy)
         .HasMaxLength(450);

     builder.Property(x => x.UpdatedBy)
.HasMaxLength(450);

        builder.Property(x => x.DeletedBy)
       .HasMaxLength(450);

      // Relationships - Changed to Restrict to avoid cascade paths
        builder.HasOne(x => x.IncidentCase)
  .WithMany(x => x.Comments)
    .HasForeignKey(x => x.IncidentCaseId)
     .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Author)
      .WithMany()
      .HasForeignKey(x => x.AuthorId)
     .OnDelete(DeleteBehavior.Restrict);

 // Indexes
        builder.HasIndex(x => x.IncidentCaseId)
 .HasDatabaseName("IX_IncidentComments_IncidentCaseId");

    builder.HasIndex(x => x.AuthorId)
  .HasDatabaseName("IX_IncidentComments_AuthorId");

  builder.HasIndex(x => x.CreatedDate)
    .HasDatabaseName("IX_IncidentComments_CreatedDate");

  // Global query filter for soft delete
builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
