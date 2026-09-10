using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Logs;

namespace Smart_Core.Infrastructure.Data.Configurations.Logs;

public sealed class SystemLogConfiguration : IEntityTypeConfiguration<SystemLog>
{
    public void Configure(EntityTypeBuilder<SystemLog> builder)
    {
        builder.ToTable("SystemLogs");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.Timestamp).HasColumnType("datetimeoffset");
        builder.Property(x => x.Level).HasConversion<byte>().HasColumnType("tinyint");
        builder.Property(x => x.Category).HasConversion<byte>().HasColumnType("tinyint");
        builder.Property(x => x.Action).IsRequired().HasMaxLength(256);
        builder.Property(x => x.UserId).HasMaxLength(450);
        builder.Property(x => x.UserDisplayName).HasMaxLength(256);
        builder.Property(x => x.UserRole).HasMaxLength(50);
        builder.Property(x => x.Controller).HasMaxLength(128);
        builder.Property(x => x.Endpoint).HasMaxLength(512);
        builder.Property(x => x.HttpMethod).HasMaxLength(10);
        builder.Property(x => x.ErrorMessage).HasMaxLength(4000);
        builder.Property(x => x.ExceptionType).HasMaxLength(512);
        builder.Property(x => x.TraceId).HasMaxLength(128);
        builder.Property(x => x.IpAddress).HasMaxLength(45);
        builder.Property(x => x.UserAgent).HasMaxLength(512);
        builder.HasIndex(x => x.Category).HasDatabaseName("IX_SystemLogs_Category");
        builder.HasIndex(x => x.Level).HasDatabaseName("IX_SystemLogs_Level");
        builder.HasIndex(x => x.Timestamp).HasDatabaseName("IX_SystemLogs_Timestamp");
        builder.HasIndex(x => x.UserId).HasDatabaseName("IX_SystemLogs_UserId");
        builder.HasIndex(x => new { x.Category, x.Timestamp }).HasDatabaseName("IX_SystemLogs_Category_Timestamp");
        builder.HasIndex(x => new { x.Category, x.UserId }).HasDatabaseName("IX_SystemLogs_Category_UserId");
    }
}
