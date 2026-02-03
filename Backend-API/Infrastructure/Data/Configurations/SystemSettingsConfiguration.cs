using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities;

namespace Smart_Core.Infrastructure.Data.Configurations;

public class SystemSettingsConfiguration : IEntityTypeConfiguration<SystemSettings>
{
    public void Configure(EntityTypeBuilder<SystemSettings> builder)
    {
        builder.ToTable("SystemSettings");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .ValueGeneratedOnAdd();

        builder.Property(x => x.DefaultProctorMode)
            .HasMaxLength(50);

        builder.Property(x => x.LogoUrl)
            .HasMaxLength(2000);

        builder.Property(x => x.BrandName)
            .HasMaxLength(200);

        builder.Property(x => x.FooterText)
            .HasMaxLength(1000);

        builder.Property(x => x.SupportEmail)
            .HasMaxLength(256);

        builder.Property(x => x.SupportUrl)
            .HasMaxLength(500);

        builder.Property(x => x.PrimaryColor)
            .HasMaxLength(20);
    }
}
