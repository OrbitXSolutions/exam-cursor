using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Assessment;

namespace Smart_Core.Infrastructure.Data.Configurations.Assessment;

public class WalkInRegistrationAnswerConfiguration : IEntityTypeConfiguration<WalkInRegistrationAnswer>
{
    public void Configure(EntityTypeBuilder<WalkInRegistrationAnswer> builder)
    {
        builder.ToTable("WalkInRegistrationAnswers");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .ValueGeneratedOnAdd();

        builder.Property(x => x.CandidateId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(x => x.Value)
            .HasMaxLength(500);

        builder.Property(x => x.CreatedBy)
            .HasMaxLength(450);

        builder.Property(x => x.UpdatedBy)
            .HasMaxLength(450);

        builder.Property(x => x.DeletedBy)
            .HasMaxLength(450);

        // Unique: one answer per (candidate, exam, field) — supports upsert on re-registration
        builder.HasIndex(x => new { x.CandidateId, x.ExamId, x.FieldId })
            .IsUnique()
            .HasDatabaseName("IX_WalkInRegistrationAnswers_Candidate_Exam_Field");

        // Index for admin reporting queries (fetch all answers for an exam)
        builder.HasIndex(x => new { x.ExamId, x.CandidateId })
            .HasDatabaseName("IX_WalkInRegistrationAnswers_ExamId_CandidateId");

        // Answers outlive soft-deleted fields — restrict delete on field to prevent accidental orphan loss
        builder.HasOne(x => x.Field)
            .WithMany(f => f.Answers)
            .HasForeignKey(x => x.FieldId)
            .OnDelete(DeleteBehavior.Restrict);

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
