using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Notification;

namespace Smart_Core.Infrastructure.Data.Configurations.Notification;

public class NotificationTemplateConfiguration : IEntityTypeConfiguration<NotificationTemplate>
{
    public void Configure(EntityTypeBuilder<NotificationTemplate> builder)
    {
        builder.ToTable("NotificationTemplates");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedOnAdd();

        builder.Property(x => x.SubjectEn).IsRequired().HasMaxLength(500);
        builder.Property(x => x.SubjectAr).IsRequired().HasMaxLength(500);
        builder.Property(x => x.BodyEn).IsRequired();
        builder.Property(x => x.BodyAr).IsRequired();

        builder.Property(x => x.IsActive).HasDefaultValue(true);

        builder.HasIndex(x => x.EventType)
            .IsUnique()
            .HasDatabaseName("IX_NotificationTemplates_EventType");

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
