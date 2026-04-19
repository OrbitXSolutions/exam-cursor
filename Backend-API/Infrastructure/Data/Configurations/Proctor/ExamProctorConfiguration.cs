using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Proctor;

namespace Smart_Core.Infrastructure.Data.Configurations.Proctor;

public class ExamProctorConfiguration : IEntityTypeConfiguration<ExamProctor>
{
    public void Configure(EntityTypeBuilder<ExamProctor> builder)
    {
        builder.ToTable("ExamProctors");

        builder.HasKey(e => e.Id);

        // Unique active assignment per Exam + Proctor
        builder.HasIndex(e => new { e.ExamId, e.ProctorId })
            .HasFilter("[IsDeleted] = 0")
            .IsUnique();

        builder.HasOne(e => e.Exam)
            .WithMany()
            .HasForeignKey(e => e.ExamId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Proctor)
            .WithMany()
            .HasForeignKey(e => e.ProctorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(e => e.ProctorId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(e => e.AssignedBy)
            .HasMaxLength(450);
    }
}
