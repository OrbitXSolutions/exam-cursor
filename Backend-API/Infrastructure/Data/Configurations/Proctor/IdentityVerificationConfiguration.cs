using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Proctor;

namespace Smart_Core.Infrastructure.Data.Configurations.Proctor;

public class IdentityVerificationConfiguration : IEntityTypeConfiguration<IdentityVerification>
{
    public void Configure(EntityTypeBuilder<IdentityVerification> builder)
    {
        builder.ToTable("IdentityVerifications");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedOnAdd();

        builder.Property(x => x.CandidateId).IsRequired().HasMaxLength(450);
        builder.Property(x => x.IdDocumentPath).HasMaxLength(2000);
        builder.Property(x => x.IdDocumentType).HasMaxLength(50);
        builder.Property(x => x.SelfiePath).HasMaxLength(2000);
        builder.Property(x => x.FaceMatchScore).HasColumnType("decimal(5,2)");
        builder.Property(x => x.RiskScore).HasColumnType("decimal(5,2)");
        builder.Property(x => x.ReviewedBy).HasMaxLength(450);
        builder.Property(x => x.ReviewNotes).HasMaxLength(2000);
        builder.Property(x => x.AssignedProctorId).HasMaxLength(450);
        builder.Property(x => x.DeviceInfo).HasMaxLength(4000);
        builder.Property(x => x.IpAddress).HasMaxLength(100);
        builder.Property(x => x.CreatedBy).HasMaxLength(450);
        builder.Property(x => x.UpdatedBy).HasMaxLength(450);
        builder.Property(x => x.DeletedBy).HasMaxLength(450);

        // Relationships
        builder.HasOne(x => x.ProctorSession)
            .WithMany()
            .HasForeignKey(x => x.ProctorSessionId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Candidate)
            .WithMany()
            .HasForeignKey(x => x.CandidateId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.ExamId);
        builder.HasIndex(x => x.CandidateId);
        builder.HasIndex(x => x.SubmittedAt);
        builder.HasIndex(x => x.AssignedProctorId);

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
