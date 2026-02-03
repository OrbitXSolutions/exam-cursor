using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Proctor;

namespace Smart_Core.Infrastructure.Data.Configurations.Proctor;

public class ProctorSessionConfiguration : IEntityTypeConfiguration<ProctorSession>
{
    public void Configure(EntityTypeBuilder<ProctorSession> builder)
    {
    builder.ToTable("ProctorSessions");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
        .ValueGeneratedOnAdd();

        builder.Property(x => x.CandidateId)
   .IsRequired()
     .HasMaxLength(450);

        builder.Property(x => x.Mode)
 .IsRequired();

   builder.Property(x => x.Status)
   .IsRequired();

        builder.Property(x => x.DeviceFingerprint)
    .HasMaxLength(500);

        builder.Property(x => x.UserAgent)
     .HasMaxLength(1000);

        builder.Property(x => x.IpAddress)
          .HasMaxLength(45);

        builder.Property(x => x.BrowserName)
            .HasMaxLength(100);

        builder.Property(x => x.BrowserVersion)
       .HasMaxLength(50);

 builder.Property(x => x.OperatingSystem)
   .HasMaxLength(100);

        builder.Property(x => x.ScreenResolution)
       .HasMaxLength(20);

        builder.Property(x => x.RiskScore)
            .HasPrecision(5, 2);

   builder.Property(x => x.CreatedBy)
    .HasMaxLength(450);

        builder.Property(x => x.UpdatedBy)
          .HasMaxLength(450);

        builder.Property(x => x.DeletedBy)
    .HasMaxLength(450);

        // Relationships
        builder.HasOne(x => x.Attempt)
     .WithMany()
    .HasForeignKey(x => x.AttemptId)
     .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Exam)
 .WithMany()
         .HasForeignKey(x => x.ExamId)
          .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Candidate)
            .WithMany()
  .HasForeignKey(x => x.CandidateId)
    .OnDelete(DeleteBehavior.Restrict);

   builder.HasMany(x => x.Events)
            .WithOne(x => x.ProctorSession)
            .HasForeignKey(x => x.ProctorSessionId)
   .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.EvidenceItems)
            .WithOne(x => x.ProctorSession)
 .HasForeignKey(x => x.ProctorSessionId)
  .OnDelete(DeleteBehavior.Cascade);

   builder.HasMany(x => x.RiskSnapshots)
            .WithOne(x => x.ProctorSession)
            .HasForeignKey(x => x.ProctorSessionId)
    .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Decision)
         .WithOne(x => x.ProctorSession)
         .HasForeignKey<ProctorDecision>(x => x.ProctorSessionId)
            .OnDelete(DeleteBehavior.Cascade);

 // Indexes
        // Unique constraint: One session per attempt per mode
builder.HasIndex(x => new { x.AttemptId, x.Mode })
       .IsUnique()
    .HasDatabaseName("IX_ProctorSessions_AttemptId_Mode_Unique");

        builder.HasIndex(x => x.AttemptId)
            .HasDatabaseName("IX_ProctorSessions_AttemptId");

      builder.HasIndex(x => x.ExamId)
    .HasDatabaseName("IX_ProctorSessions_ExamId");

     builder.HasIndex(x => x.CandidateId)
            .HasDatabaseName("IX_ProctorSessions_CandidateId");

        builder.HasIndex(x => x.Status)
        .HasDatabaseName("IX_ProctorSessions_Status");

        builder.HasIndex(x => x.RiskScore)
     .HasDatabaseName("IX_ProctorSessions_RiskScore");

      builder.HasIndex(x => x.StartedAt)
    .HasDatabaseName("IX_ProctorSessions_StartedAt");

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
