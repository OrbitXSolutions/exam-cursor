using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Controllers.Settings;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Infrastructure.Data;
using Smart_Core.Infrastructure.Storage;

namespace Backend_API.Tests;

[Trait("Category", "SqlServer")]
public sealed class BrandingTests : IAsyncLifetime
{
    private const string BeforeBranding = "20260930034449_AddExternalIdentityLinks";
    private string? _connectionString;

    public Task InitializeAsync()
    {
        if (SqlServerFactAttribute.ConnectionString is { } connection)
            _connectionString = new SqlConnectionStringBuilder(connection)
            {
                InitialCatalog = "Branding_" + Guid.NewGuid().ToString("N"), Pooling = false
            }.ConnectionString;
        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        if (_connectionString == null) return;
        await using var db = Database();
        await db.Database.EnsureDeletedAsync();
    }

    private ApplicationDbContext Database() => new(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseSqlServer(_connectionString!).Options);

    private static async Task<PublicBrandingDto> Branding(ApplicationDbContext db)
    {
        var controller = new OrganizationController(db,
            new StoragePaths(TestEnvironment.Configuration(), new TestEnvironment()));
        var result = Assert.IsType<OkObjectResult>(await controller.GetPublicBranding());
        return Assert.IsType<ApiResponse<PublicBrandingDto>>(result.Value).Data!;
    }

    [SqlServerFact]
    public async Task FreshMigrationSeedsBrandingAndPublicEndpointAlsoWorksWithoutSettings()
    {
        await using var db = Database();
        await db.Database.MigrateAsync();
        var settings = Assert.Single(await db.SystemSettings.ToListAsync());
        Assert.Equal(BrandingDefaults.Name, settings.BrandName);
        Assert.Equal(BrandingDefaults.LogoUrl, settings.LogoUrl);
        Assert.Equal(BrandingDefaults.PrimaryColor, settings.PrimaryColor);
        Assert.False(db.Database.HasPendingModelChanges());
        Assert.Empty(await db.Database.GetPendingMigrationsAsync());

        db.SystemSettings.Remove(settings);
        await db.SaveChangesAsync();
        var branding = await Branding(db);
        Assert.Equal(BrandingDefaults.Name, branding.Name);
        Assert.Equal(BrandingDefaults.LogoUrl, branding.LogoUrl);
        Assert.Equal(BrandingDefaults.FaviconUrl, branding.FaviconUrl);
        Assert.Equal(BrandingDefaults.FooterText, branding.FooterText);
        Assert.Equal(BrandingDefaults.PrimaryColor, branding.PrimaryColor);
        Assert.False(branding.IsActive);
    }

    [SqlServerFact]
    public async Task ActiveOrganizationOverridesSystemAndBlankOrInactiveValuesFallBack()
    {
        await using var db = Database();
        await db.Database.MigrateAsync();
        var settings = await db.SystemSettings.SingleAsync();
        settings.BrandName = "System exam portal";
        settings.PrimaryColor = "#123456";
        settings.SupportEmail = "support@example.invalid";
        var organization = new OrganizationSettings
        {
            Name = "Organization exam portal", PrimaryColor = "#345678", IsActive = true,
            LogoPath = "/organization/logo.png", FaviconPath = "/organization/favicon.ico",
            FooterText = "   ", SupportEmail = "", MobileNumber = "+971000000000"
        };
        db.OrganizationSettings.Add(organization);
        await db.SaveChangesAsync();
        var active = await Branding(db);
        Assert.Equal(organization.Name, active.Name);
        Assert.Equal(organization.LogoPath, active.LogoUrl);
        Assert.Equal(organization.FaviconPath, active.FaviconUrl);
        Assert.Equal(organization.PrimaryColor, active.PrimaryColor);
        Assert.Equal(settings.FooterText, active.FooterText);
        Assert.Equal(settings.SupportEmail, active.SupportEmail);

        organization.IsActive = false;
        await db.SaveChangesAsync();
        var inactive = await Branding(db);
        Assert.False(inactive.IsActive);
        Assert.Equal(settings.BrandName, inactive.Name);
        Assert.Equal(settings.PrimaryColor, inactive.PrimaryColor);
        Assert.Equal(BrandingDefaults.LogoUrl, inactive.LogoUrl);
        Assert.Equal(BrandingDefaults.FaviconUrl, inactive.FaviconUrl);
        Assert.Empty(inactive.MobileNumber);
    }

    [SqlServerFact]
    public async Task UpgradeReplacesLegacyDefaultsPreservesCustomSettingsAndSurvivesDownUp()
    {
        await using var db = Database();
        await db.GetService<IMigrator>().MigrateAsync(BeforeBranding);
        var system = new SystemSettings
        {
            BrandName = "SmartExam", LogoUrl = "", FooterText = "© SmartExam. All rights reserved.",
            PrimaryColor = "#0d9488", SessionTimeoutMinutes = 75,
            SupportEmail = "support@example.invalid", EnableLiveVideo = false
        };
        var organization = new OrganizationSettings
        {
            Name = "Customer name", LogoPath = "/organization/logo.png",
            FaviconPath = "/organization/favicon.ico", FooterText = "Customer footer",
            PrimaryColor = "#123456", IsActive = true
        };
        db.SystemSettings.Add(system);
        db.OrganizationSettings.Add(organization);
        db.Users.Add(new ApplicationUser { Id = "existing-user", UserName = "existing" });
        await db.SaveChangesAsync();
        await db.Database.MigrateAsync();
        db.ChangeTracker.Clear();
        system = await db.SystemSettings.SingleAsync();
        Assert.Equal(BrandingDefaults.Name, system.BrandName);
        Assert.Equal(BrandingDefaults.PrimaryColor, system.PrimaryColor);
        Assert.Equal(BrandingDefaults.LogoUrl, system.LogoUrl);
        Assert.Equal(75, system.SessionTimeoutMinutes);
        Assert.False(system.EnableLiveVideo);
        Assert.Equal("support@example.invalid", system.SupportEmail);
        var branding = await Branding(db);
        Assert.Equal("Customer name", branding.Name);
        Assert.Equal("#123456", branding.PrimaryColor);
        Assert.Equal("Customer footer", branding.FooterText);
        Assert.Equal("/organization/logo.png", branding.LogoUrl);

        // The data-only rollback intentionally retains administrator settings, never deleting the row.
        await db.GetService<IMigrator>().MigrateAsync(BeforeBranding);
        await db.Database.MigrateAsync();
        db.ChangeTracker.Clear();
        Assert.Equal(BrandingDefaults.Name, (await db.SystemSettings.SingleAsync()).BrandName);
        Assert.Equal("Customer name", (await Branding(db)).Name);
        Assert.Equal("existing-user", (await db.Users.SingleAsync()).Id);
        Assert.False(db.Database.HasPendingModelChanges());
    }
}
