using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.ExamAssignment;

namespace Smart_Core.Infrastructure.Data.Configurations;

public class ExamAssignmentConfiguration : IEntityTypeConfiguration<ExamAssignment>
{
    public void Configure(EntityTypeBuilder<ExamAssignment> builder)
    {
        builder.ToTable("ExamAssignments");

        builder.HasKey(e => e.Id);

        // Unique active assignment per Exam + Candidate
        builder.HasIndex(e => new { e.ExamId, e.CandidateId })
            .HasFilter("[IsActive] = 1 AND [IsDeleted] = 0")
            .IsUnique();

        builder.HasOne(e => e.Exam)
            .WithMany()
            .HasForeignKey(e => e.ExamId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Candidate)
            .WithMany()
            .HasForeignKey(e => e.CandidateId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
