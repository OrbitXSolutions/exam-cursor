using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.DependencyInjection;

namespace Backend_API.Tests;

public sealed class DataProtectionTests
{
    [Fact]
    public void SharedCertificateEncryptedKeyRingCanBeReadByAnotherServer()
    {
        var directory = Path.Combine(AppContext.BaseDirectory, "keyring-" + Guid.NewGuid().ToString("N"));
        using var key = RSA.Create(2048);
        var request = new CertificateRequest("CN=BackendRegressionTests", key,
            HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        using var certificate = request.CreateSelfSigned(
            DateTimeOffset.UtcNow.AddMinutes(-1), DateTimeOffset.UtcNow.AddDays(1));
        try
        {
            using var firstServer = Services(directory, certificate);
            var protectedValue = firstServer.GetRequiredService<IDataProtectionProvider>()
                .CreateProtector("regression-purpose").Protect("cross-server-value");

            using var secondServer = Services(directory, certificate);
            var restored = secondServer.GetRequiredService<IDataProtectionProvider>()
                .CreateProtector("regression-purpose").Unprotect(protectedValue);

            Assert.Equal("cross-server-value", restored);
            var keyFile = Assert.Single(Directory.GetFiles(directory, "key-*.xml"));
            var xml = File.ReadAllText(keyFile);
            Assert.Contains("encryptedSecret", xml);
            Assert.DoesNotContain("<masterKey", xml);
            Assert.Throws<CryptographicException>(() =>
                secondServer.GetRequiredService<IDataProtectionProvider>()
                    .CreateProtector("another-purpose").Unprotect(protectedValue));
        }
        finally
        {
            if (Directory.Exists(directory)) Directory.Delete(directory, recursive: true);
        }
    }

    private static ServiceProvider Services(string directory, X509Certificate2 certificate)
    {
        var services = new ServiceCollection().AddLogging();
        services.AddDataProtection().SetApplicationName("SmartExam")
            .PersistKeysToFileSystem(new DirectoryInfo(directory))
            .ProtectKeysWithCertificate(certificate);
        return services.BuildServiceProvider();
    }
}
