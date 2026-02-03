using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Incident;

namespace Smart_Core.Infrastructure.Data.Configurations.Incident;

public class IncidentCaseConfiguration : IEntityTypeConfiguration<IncidentCase>
{
    public void Configure(EntityTypeBuilder<IncidentCase> builder)
    {
     builder.ToTable("IncidentCases");

     builder.HasKey(x => x.Id);

    builder.Property(x => x.Id)
  .ValueGeneratedOnAdd();

  builder.Property(x => x.CandidateId)
   .IsRequired()
   .HasMaxLength(450);

    builder.Property(x => x.CaseNumber)
      .IsRequired()
            .HasMaxLength(50);

   builder.Property(x => x.Status)
  .IsRequired();

  builder.Property(x => x.Severity)
 .IsRequired();

        builder.Property(x => x.Source)
  .IsRequired();

        builder.Property(x => x.TitleEn)
   .IsRequired()
      .HasMaxLength(500);

        builder.Property(x => x.TitleAr)
 .IsRequired()
     .HasMaxLength(500);

     builder.Property(x => x.SummaryEn)
 .HasMaxLength(4000);

     builder.Property(x => x.SummaryAr)
.HasMaxLength(4000);

        builder.Property(x => x.RiskScoreAtCreate)
     .HasPrecision(5, 2);

        builder.Property(x => x.AssignedTo)
      .HasMaxLength(450);

  builder.Property(x => x.ResolutionNoteEn)
        .HasMaxLength(4000);

        builder.Property(x => x.ResolutionNoteAr)
  .HasMaxLength(4000);

  builder.Property(x => x.ResolvedBy)
   .HasMaxLength(450);

        builder.Property(x => x.ClosedBy)
            .HasMaxLength(450);

   builder.Property(x => x.CreatedBy)
     .HasMaxLength(450);

  builder.Property(x => x.UpdatedBy)
   .HasMaxLength(450);

        builder.Property(x => x.DeletedBy)
    .HasMaxLength(450);

        // Relationships
       builder.HasOne(x => x.Exam)
   .WithMany()
 .HasForeignKey(x => x.ExamId)
    .OnDelete(DeleteBehavior.Restrict);

 builder.HasOne(x => x.Attempt)
 .WithMany()
       .HasForeignKey(x => x.AttemptId)
            .OnDelete(DeleteBehavior.Restrict);

      builder.HasOne(x => x.Candidate)
 .WithMany()
      .HasForeignKey(x => x.CandidateId)
     .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ProctorSession)
 .WithMany()
   .HasForeignKey(x => x.ProctorSessionId)
  .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.Assignee)
  .WithMany()
      .HasForeignKey(x => x.AssignedTo)
  .OnDelete(DeleteBehavior.SetNull);

        // Changed to Restrict to avoid cascade path issues - handle deletion in application code
        builder.HasMany(x => x.Timeline)
   .WithOne(x => x.IncidentCase)
   .HasForeignKey(x => x.IncidentCaseId)
 .OnDelete(DeleteBehavior.Restrict);

  builder.HasMany(x => x.EvidenceLinks)
     .WithOne(x => x.IncidentCase)
     .HasForeignKey(x => x.IncidentCaseId)
        .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Decisions)
        .WithOne(x => x.IncidentCase)
        .HasForeignKey(x => x.IncidentCaseId)
    .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Comments)
        .WithOne(x => x.IncidentCase)
  .HasForeignKey(x => x.IncidentCaseId)
      .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Appeals)
 .WithOne(x => x.IncidentCase)
  .HasForeignKey(x => x.IncidentCaseId)
      .OnDelete(DeleteBehavior.Restrict);

        // Indexes
    builder.HasIndex(x => x.CaseNumber)
    .IsUnique()
   .HasDatabaseName("IX_IncidentCases_CaseNumber_Unique");

    builder.HasIndex(x => x.AttemptId)
      .HasDatabaseName("IX_IncidentCases_AttemptId");

     builder.HasIndex(x => new { x.Status, x.Severity, x.AssignedTo })
  .HasDatabaseName("IX_IncidentCases_Status_Severity_AssignedTo");

    builder.HasIndex(x => new { x.ExamId, x.CandidateId })
            .HasDatabaseName("IX_IncidentCases_ExamId_CandidateId");

    builder.HasIndex(x => x.Status)
  .HasDatabaseName("IX_IncidentCases_Status");

        builder.HasIndex(x => x.Severity)
            .HasDatabaseName("IX_IncidentCases_Severity");

        builder.HasIndex(x => x.AssignedTo)
     .HasDatabaseName("IX_IncidentCases_AssignedTo");

    builder.HasIndex(x => x.CreatedDate)
       .HasDatabaseName("IX_IncidentCases_CreatedDate");

        // Global query filter for soft delete
   builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
