using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Assessment;

namespace Smart_Core.Infrastructure.Data.Configurations.Assessment;

public class ExamAccessPolicyConfiguration : IEntityTypeConfiguration<ExamAccessPolicy>
{
    public void Configure(EntityTypeBuilder<ExamAccessPolicy> builder)
    {
        builder.ToTable("ExamAccessPolicies");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
   .ValueGeneratedOnAdd();

        builder.Property(x => x.AccessCode)
            .HasMaxLength(50);

        builder.Property(x => x.IsPublic)
        .HasDefaultValue(false);

        builder.Property(x => x.RestrictToAssignedCandidates)
            .HasDefaultValue(false);

        builder.Property(x => x.CreatedBy)
   .HasMaxLength(450);

    builder.Property(x => x.UpdatedBy)
         .HasMaxLength(450);

      builder.Property(x => x.DeletedBy)
            .HasMaxLength(450);

      // Indexes
        builder.HasIndex(x => x.ExamId)
  .IsUnique()
      .HasDatabaseName("IX_ExamAccessPolicies_ExamId");

     // Global query filter for soft delete
 builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
