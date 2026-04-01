using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Assessment;

namespace Smart_Core.Infrastructure.Data.Configurations;

public class ExamShareLinkConfiguration : IEntityTypeConfiguration<ExamShareLink>
{
    public void Configure(EntityTypeBuilder<ExamShareLink> builder)
    {
        builder.ToTable("ExamShareLinks");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.ShareToken)
            .IsRequired()
            .HasMaxLength(128);

        // Unique active token
        builder.HasIndex(e => e.ShareToken)
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        // One active link per exam
        builder.HasIndex(e => e.ExamId)
            .HasFilter("[IsActive] = 1 AND [IsDeleted] = 0")
            .IsUnique();

        builder.HasOne(e => e.Exam)
            .WithMany()
            .HasForeignKey(e => e.ExamId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
