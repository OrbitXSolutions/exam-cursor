using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Attempt;

namespace Smart_Core.Infrastructure.Data.Configurations.Attempt;

public class AttemptEventConfiguration : IEntityTypeConfiguration<AttemptEvent>
{
    public void Configure(EntityTypeBuilder<AttemptEvent> builder)
 {
     builder.ToTable("AttemptEvents");

   builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
       .ValueGeneratedOnAdd();

     builder.Property(x => x.EventType)
          .IsRequired();

        builder.Property(x => x.MetadataJson)
.HasMaxLength(4000);

    builder.Property(x => x.CreatedBy)
       .HasMaxLength(450);

        builder.Property(x => x.UpdatedBy)
      .HasMaxLength(450);

        builder.Property(x => x.DeletedBy)
  .HasMaxLength(450);

      // Relationships
    builder.HasOne(x => x.Attempt)
 .WithMany(x => x.Events)
      .HasForeignKey(x => x.AttemptId)
.OnDelete(DeleteBehavior.Cascade);

        // Indexes
       builder.HasIndex(x => x.AttemptId)
 .HasDatabaseName("IX_AttemptEvents_AttemptId");

 builder.HasIndex(x => new { x.AttemptId, x.OccurredAt })
.HasDatabaseName("IX_AttemptEvents_AttemptId_OccurredAt");

  builder.HasIndex(x => x.EventType)
 .HasDatabaseName("IX_AttemptEvents_EventType");

   // Global query filter for soft delete
       builder.HasQueryFilter(x => !x.IsDeleted);
  }
}
