using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Batch;

namespace Smart_Core.Infrastructure.Data.Configurations;

public class BatchConfiguration : IEntityTypeConfiguration<Batch>
{
    public void Configure(EntityTypeBuilder<Batch> builder)
    {
        builder.ToTable("Batches");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.HasIndex(b => b.Name)
            .IsUnique()
            .HasFilter("[IsDeleted] = 0")
            .HasDatabaseName("IX_Batches_Name");

        builder.Property(b => b.Description)
            .HasMaxLength(500);

        builder.Property(b => b.CreatedBy).HasMaxLength(450);
        builder.Property(b => b.UpdatedBy).HasMaxLength(450);
        builder.Property(b => b.DeletedBy).HasMaxLength(450);

        builder.HasQueryFilter(b => !b.IsDeleted);
    }
}

public class BatchCandidateConfiguration : IEntityTypeConfiguration<BatchCandidate>
{
    public void Configure(EntityTypeBuilder<BatchCandidate> builder)
    {
        builder.ToTable("BatchCandidates");

        builder.HasKey(bc => bc.Id);

        builder.HasIndex(bc => new { bc.BatchId, bc.CandidateId })
            .IsUnique()
            .HasDatabaseName("IX_BatchCandidates_BatchId_CandidateId");

        builder.Property(bc => bc.AddedBy).HasMaxLength(450);

        builder.HasOne(bc => bc.Batch)
            .WithMany(b => b.BatchCandidates)
            .HasForeignKey(bc => bc.BatchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(bc => bc.Candidate)
            .WithMany()
            .HasForeignKey(bc => bc.CandidateId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
