using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Notification;

namespace Smart_Core.Infrastructure.Data.Configurations;

public class UserNotificationConfiguration : IEntityTypeConfiguration<UserNotification>
{
    public void Configure(EntityTypeBuilder<UserNotification> builder)
    {
        builder.ToTable("UserNotifications");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.UserId).IsRequired().HasMaxLength(450);
        builder.Property(n => n.TitleEn).IsRequired().HasMaxLength(200);
        builder.Property(n => n.TitleAr).IsRequired().HasMaxLength(200);
        builder.Property(n => n.MessageEn).IsRequired().HasMaxLength(500);
        builder.Property(n => n.MessageAr).IsRequired().HasMaxLength(500);
        builder.Property(n => n.Type).IsRequired();
        builder.Property(n => n.IsRead).HasDefaultValue(false);

        // Efficient query: fetch unread for a user sorted by newest
        builder.HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt });

        builder.HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
