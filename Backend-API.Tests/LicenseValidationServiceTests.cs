using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Smart_Core.Controllers.Settings;
using Smart_Core.Domain.Enums;
using Smart_Core.Domain.Models;
using Smart_Core.Infrastructure.Services.License;
using Smart_Core.Infrastructure.Storage;

namespace Backend_API.Tests;

public sealed class LicenseValidationServiceTests
{
    [Fact]
    public async Task UploadReplacesSharedLicenseAndLeavesNoStagedFile()
    {
        using var files = new LicenseFiles();
        files.WriteLicense("first.example");
        var service = files.CreateService();
        var otherInstance = files.CreateService();
        var json = files.CreateLicenseJson("replacement.example");
        using var data = new MemoryStream(Encoding.UTF8.GetBytes(json));
        var upload = new FormFile(data, 0, data.Length, "file", "license.json");
        var controller = new LicenseController(service, files.CreatePaths(), NullLogger<LicenseController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        Assert.IsType<OkObjectResult>(await controller.Upload(upload));

        Assert.Equal(json, File.ReadAllText(files.LicensePath));
        Assert.Empty(Directory.GetFiles(files.DirectoryPath, "*.pending"));
        Assert.Equal("replacement.example", otherInstance.GetLicenseStatus().LicensedDomain);
    }

    [Fact]
    public void SharedLicenseCreationRefreshesBothInstancesOnTheirNextAccess()
    {
        using var files = new LicenseFiles();
        var first = files.CreateService();
        var second = files.CreateService();
        Assert.Equal(LicenseState.Missing, first.GetCurrentState());
        Assert.Equal(LicenseState.Missing, second.GetCurrentState());

        files.WriteLicense("first.example");

        Assert.Equal(LicenseState.Active, first.GetCurrentState());
        Assert.Equal(LicenseState.Active, second.GetLicenseStatus().State);
    }

    [Fact]
    public void SameLengthLicenseReplacementRefreshesDomainBindingByTimestamp()
    {
        using var files = new LicenseFiles();
        files.WriteLicense("first.example");
        var originalJson = File.ReadAllText(files.LicensePath);
        var replacementJson = files.CreateLicenseJson("other.example");
        var sharedLength = Math.Max(originalJson.Length, replacementJson.Length);
        File.WriteAllText(files.LicensePath, originalJson.PadRight(sharedLength));
        var service = files.CreateService();
        var previousLength = new FileInfo(files.LicensePath).Length;
        var previousWriteTime = File.GetLastWriteTimeUtc(files.LicensePath);

        File.WriteAllText(files.LicensePath, replacementJson.PadRight(sharedLength));
        File.SetLastWriteTimeUtc(files.LicensePath, previousWriteTime.AddMinutes(1));

        Assert.Equal(previousLength, new FileInfo(files.LicensePath).Length);
        Assert.True(service.IsDomainValid("other.example"));
        Assert.False(service.IsDomainValid("first.example"));
        Assert.Equal("other.example", service.GetLicenseStatus().LicensedDomain);
    }

    [Fact]
    public void LicenseLengthChangeRefreshesEvenWhenTimestampIsPreserved()
    {
        using var files = new LicenseFiles();
        files.WriteLicense("first.example");
        var service = files.CreateService();
        var previousWriteTime = File.GetLastWriteTimeUtc(files.LicensePath);

        files.WriteLicense("much-longer.example");
        File.SetLastWriteTimeUtc(files.LicensePath, previousWriteTime);

        Assert.Equal("much-longer.example", service.GetLicenseStatus().LicensedDomain);
    }

    [Fact]
    public void PublicKeyReplacementInvalidatesAnOtherwiseUnchangedLicense()
    {
        using var files = new LicenseFiles();
        files.WriteLicense("first.example");
        var service = files.CreateService();
        var previousKey = File.ReadAllText(files.KeyPath);
        var previousWriteTime = File.GetLastWriteTimeUtc(files.KeyPath);
        using var otherKey = RSA.Create(2048);
        File.WriteAllText(files.KeyPath, otherKey.ExportSubjectPublicKeyInfoPem());
        File.SetLastWriteTimeUtc(files.KeyPath, previousWriteTime.AddMinutes(1));

        Assert.Equal(previousKey.Length, new FileInfo(files.KeyPath).Length);
        Assert.Equal(LicenseState.Invalid, service.GetCurrentState());

        File.WriteAllText(files.KeyPath, previousKey);
        File.SetLastWriteTimeUtc(files.KeyPath, previousWriteTime.AddMinutes(2));
        Assert.Equal(LicenseState.Active, service.GetCurrentState());
    }

    [Fact]
    public void PublicKeyLengthChangeRefreshesEvenWhenTimestampIsPreserved()
    {
        using var files = new LicenseFiles();
        files.WriteLicense("first.example");
        var service = files.CreateService();
        var originalStatus = service.GetLicenseStatus();
        var previousWriteTime = File.GetLastWriteTimeUtc(files.KeyPath);
        File.AppendAllText(files.KeyPath, "\n");
        File.SetLastWriteTimeUtc(files.KeyPath, previousWriteTime);

        Assert.NotSame(originalStatus, service.GetLicenseStatus());
        Assert.Equal(LicenseState.Active, service.GetCurrentState());
    }

    [Fact]
    public void MissingSharedFilesInvalidateCachedLicenseWithoutThrowing()
    {
        using var files = new LicenseFiles();
        files.WriteLicense("first.example");
        var service = files.CreateService();
        File.Delete(files.KeyPath);
        Assert.Equal(LicenseState.Invalid, service.GetCurrentState());

        File.Delete(files.LicensePath);
        Assert.Equal(LicenseState.Missing, service.GetCurrentState());

        files.WriteLicense("first.example");
        Assert.Equal(LicenseState.Active, service.GetCurrentState());
    }

    [Fact]
    public void UnchangedMetadataKeepsCacheUntilExistingTwentyFourHourRefresh()
    {
        using var files = new LicenseFiles();
        files.WriteLicense("first.example");
        var service = files.CreateService();
        var originalStatus = service.GetLicenseStatus();
        Assert.Same(originalStatus, service.GetLicenseStatus());

        typeof(LicenseValidationService).GetField("_lastChecked", BindingFlags.Instance | BindingFlags.NonPublic)!
            .SetValue(service, DateTimeOffset.UtcNow.AddHours(-25));

        Assert.NotSame(originalStatus, service.GetLicenseStatus());
        Assert.Equal(LicenseState.Active, service.GetCurrentState());
    }

    [Fact]
    public void UnavailableSharedDirectoryDoesNotCrashRequestsAndCanRecover()
    {
        using var files = new LicenseFiles();
        files.WriteLicense("first.example");
        var service = files.CreateService();
        var movedPath = files.DirectoryPath + "-offline";
        Directory.Move(files.DirectoryPath, movedPath);
        try
        {
            File.WriteAllText(files.DirectoryPath, "unavailable mount");
            Assert.Equal(LicenseState.Missing, service.GetCurrentState());
        }
        finally
        {
            File.Delete(files.DirectoryPath);
            Directory.Move(movedPath, files.DirectoryPath);
        }

        Assert.Equal(LicenseState.Active, service.GetCurrentState());
    }

    private sealed class LicenseFiles : IDisposable
    {
        private readonly RSA _key = RSA.Create(2048);
        public string DirectoryPath { get; } = Path.Combine(AppContext.BaseDirectory, "license-tests", Guid.NewGuid().ToString("N"));
        public string LicensePath => Path.Combine(DirectoryPath, "license.json");
        public string KeyPath => Path.Combine(DirectoryPath, "public.pem");

        public StoragePaths CreatePaths() =>
            new(TestEnvironment.Configuration(new()
            {
                ["License:Directory"] = DirectoryPath
            }), new TestEnvironment());

        public LicenseValidationService CreateService() =>
            new(CreatePaths(), NullLogger<LicenseValidationService>.Instance);

        public void WriteLicense(string domain)
        {
            Directory.CreateDirectory(DirectoryPath);
            if (!File.Exists(KeyPath))
                File.WriteAllText(KeyPath, _key.ExportSubjectPublicKeyInfoPem());
            File.WriteAllText(LicensePath, CreateLicenseJson(domain));
        }

        public string CreateLicenseJson(string domain)
        {
            var license = new LicenseData
            {
                CustomerName = "Regression customer",
                LicenseType = "Test",
                IssuedAt = DateTime.UtcNow.Date.AddDays(-1),
                ExpiresAt = DateTime.UtcNow.Date.AddDays(90),
                LicensedDomain = domain
            };
            license.Signature = Convert.ToBase64String(_key.SignData(
                Encoding.UTF8.GetBytes(LicenseCanonicalBuilder.BuildCanonicalPayload(license)),
                HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1));
            return JsonSerializer.Serialize(license);
        }

        public void Dispose()
        {
            _key.Dispose();
            if (Directory.Exists(DirectoryPath))
                Directory.Delete(DirectoryPath, recursive: true);
        }
    }
}
