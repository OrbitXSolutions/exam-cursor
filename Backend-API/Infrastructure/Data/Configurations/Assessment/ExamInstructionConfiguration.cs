using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Assessment;

namespace Smart_Core.Infrastructure.Data.Configurations.Assessment;

public class ExamInstructionConfiguration : IEntityTypeConfiguration<ExamInstruction>
{
    public void Configure(EntityTypeBuilder<ExamInstruction> builder)
    {
    builder.ToTable("ExamInstructions");

     builder.HasKey(x => x.Id);

     builder.Property(x => x.Id)
     .ValueGeneratedOnAdd();

  builder.Property(x => x.ContentEn)
.IsRequired()
  .HasMaxLength(5000);

        builder.Property(x => x.ContentAr)
.IsRequired()
         .HasMaxLength(5000);

   builder.Property(x => x.CreatedBy)
 .HasMaxLength(450);

        builder.Property(x => x.UpdatedBy)
      .HasMaxLength(450);

   builder.Property(x => x.DeletedBy)
.HasMaxLength(450);

        // Indexes - Unique order within exam
        builder.HasIndex(x => new { x.ExamId, x.Order })
 .IsUnique()
      .HasDatabaseName("IX_ExamInstructions_ExamId_Order");

        builder.HasIndex(x => x.ExamId)
          .HasDatabaseName("IX_ExamInstructions_ExamId");

   // Global query filter for soft delete
     builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
