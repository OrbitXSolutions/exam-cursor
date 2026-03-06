using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Notification;

namespace Smart_Core.Infrastructure.Data.Configurations.Notification;

public class NotificationSettingsConfiguration : IEntityTypeConfiguration<NotificationSettings>
{
    public void Configure(EntityTypeBuilder<NotificationSettings> builder)
    {
        builder.ToTable("NotificationSettings");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedOnAdd();

        // SMTP
        builder.Property(x => x.SmtpHost).HasMaxLength(500);
        builder.Property(x => x.SmtpUsername).HasMaxLength(500);
        builder.Property(x => x.SmtpPasswordEncrypted).HasMaxLength(1000);
        builder.Property(x => x.SmtpFromEmail).HasMaxLength(500);
        builder.Property(x => x.SmtpFromName).HasMaxLength(500);

        // SMS
        builder.Property(x => x.SmsAccountSid).HasMaxLength(500);
        builder.Property(x => x.SmsAuthTokenEncrypted).HasMaxLength(1000);
        builder.Property(x => x.SmsFromNumber).HasMaxLength(50);
        builder.Property(x => x.CustomSmsApiUrl).HasMaxLength(2000);
        builder.Property(x => x.CustomSmsApiKey).HasMaxLength(1000);

        builder.Property(x => x.LoginUrl).HasMaxLength(2000);

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
