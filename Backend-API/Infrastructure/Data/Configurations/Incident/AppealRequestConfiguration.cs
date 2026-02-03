using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Incident;

namespace Smart_Core.Infrastructure.Data.Configurations.Incident;

public class AppealRequestConfiguration : IEntityTypeConfiguration<AppealRequest>
{
    public void Configure(EntityTypeBuilder<AppealRequest> builder)
    {
     builder.ToTable("AppealRequests");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
   .ValueGeneratedOnAdd();

   builder.Property(x => x.CandidateId)
      .IsRequired()
     .HasMaxLength(450);

       builder.Property(x => x.AppealNumber)
     .IsRequired()
  .HasMaxLength(50);

   builder.Property(x => x.Status)
        .IsRequired();

 builder.Property(x => x.Message)
     .IsRequired()
.HasMaxLength(8000);

        builder.Property(x => x.SupportingInfo)
      .HasMaxLength(8000);

   builder.Property(x => x.ReviewedBy)
       .HasMaxLength(450);

        builder.Property(x => x.DecisionNoteEn)
       .HasMaxLength(4000);

        builder.Property(x => x.DecisionNoteAr)
 .HasMaxLength(4000);

  builder.Property(x => x.InternalNotes)
      .HasMaxLength(4000);

        builder.Property(x => x.CreatedBy)
       .HasMaxLength(450);

        builder.Property(x => x.UpdatedBy)
    .HasMaxLength(450);

 builder.Property(x => x.DeletedBy)
     .HasMaxLength(450);

        // Relationships - Changed to Restrict to avoid cascade paths
        builder.HasOne(x => x.IncidentCase)
     .WithMany(x => x.Appeals)
     .HasForeignKey(x => x.IncidentCaseId)
      .OnDelete(DeleteBehavior.Restrict);

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

   builder.HasOne(x => x.Reviewer)
.WithMany()
  .HasForeignKey(x => x.ReviewedBy)
     .OnDelete(DeleteBehavior.NoAction);

        // Indexes
    builder.HasIndex(x => x.AppealNumber)
   .IsUnique()
        .HasDatabaseName("IX_AppealRequests_AppealNumber_Unique");

        builder.HasIndex(x => x.IncidentCaseId)
    .HasDatabaseName("IX_AppealRequests_IncidentCaseId");

       builder.HasIndex(x => x.ExamId)
    .HasDatabaseName("IX_AppealRequests_ExamId");

        builder.HasIndex(x => x.AttemptId)
   .HasDatabaseName("IX_AppealRequests_AttemptId");

     builder.HasIndex(x => x.CandidateId)
       .HasDatabaseName("IX_AppealRequests_CandidateId");

builder.HasIndex(x => x.ReviewedBy)
   .HasDatabaseName("IX_AppealRequests_ReviewedBy");

        builder.HasIndex(x => x.Status)
 .HasDatabaseName("IX_AppealRequests_Status");

        builder.HasIndex(x => x.SubmittedAt)
   .HasDatabaseName("IX_AppealRequests_SubmittedAt");

        // Global query filter for soft delete
      builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
