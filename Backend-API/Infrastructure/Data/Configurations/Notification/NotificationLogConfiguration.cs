using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Notification;

namespace Smart_Core.Infrastructure.Data.Configurations.Notification;

public class NotificationLogConfiguration : IEntityTypeConfiguration<NotificationLog>
{
    public void Configure(EntityTypeBuilder<NotificationLog> builder)
    {
        builder.ToTable("NotificationLogs");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedOnAdd();

        builder.Property(x => x.CandidateId).IsRequired().HasMaxLength(450);
        builder.Property(x => x.RecipientEmail).HasMaxLength(500);
        builder.Property(x => x.RecipientPhone).HasMaxLength(50);
        builder.Property(x => x.Subject).HasMaxLength(500);
        builder.Property(x => x.ErrorMessage).HasMaxLength(2000);

        // Relationships
        builder.HasOne(x => x.Candidate)
            .WithMany()
            .HasForeignKey(x => x.CandidateId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Exam)
            .WithMany()
            .HasForeignKey(x => x.ExamId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(x => x.Status).HasDatabaseName("IX_NotificationLogs_Status");
        builder.HasIndex(x => x.EventType).HasDatabaseName("IX_NotificationLogs_EventType");
        builder.HasIndex(x => x.Channel).HasDatabaseName("IX_NotificationLogs_Channel");
        builder.HasIndex(x => x.ExamId).HasDatabaseName("IX_NotificationLogs_ExamId");
        builder.HasIndex(x => x.CreatedDate).HasDatabaseName("IX_NotificationLogs_CreatedDate");

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
