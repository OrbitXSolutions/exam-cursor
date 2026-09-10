using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Smart_Core.Infrastructure;

namespace Backend_API.Tests;

public sealed class ProductionConfigurationTests
{
    private static Dictionary<string, string?> ValidConfiguration(bool multiServer = false)
    {
        var values = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Server=localhost;Database=regression;Integrated Security=true",
            ["JwtSettings:SecretKey"] = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"),
            ["EncryptionSettings:Key"] = Guid.NewGuid().ToString("N"),
            ["JwtSettings:Issuer"] = "regression-tests",
            ["JwtSettings:Audience"] = "regression-tests",
            ["Cors:AllowedOrigins:0"] = "https://exam.example.test"
        };

        if (multiServer)
        {
            values["Deployment:MultiServer"] = "true";
            values["ConnectionStrings:Redis"] = "localhost:6379";
            values["SignalR:ChannelPrefix"] = "regression";
            values["DataProtection:CertificatePath"] = Path.GetFullPath("shared/protection.pfx");
            foreach (var key in SharedPaths())
                values[key] = Path.GetFullPath("shared/" + key.Replace(':', '-'));
        }
        return values;
    }

    private static string[] SharedPaths() =>
    [
        "MediaStorage:Local:BasePath", "Storage:OrganizationPath", "Storage:IdentityPath",
        "Storage:TutorialsPath", "License:Directory", "DataProtection:KeyRingPath"
    ];

    [Fact]
    public void ValidSingleServerConfigurationPasses() =>
        ProductionConfiguration.Validate(TestEnvironment.Configuration(ValidConfiguration()), new TestEnvironment());

    [Theory]
    [InlineData("ConnectionStrings:DefaultConnection")]
    [InlineData("JwtSettings:SecretKey")]
    [InlineData("EncryptionSettings:Key")]
    [InlineData("JwtSettings:Issuer")]
    [InlineData("JwtSettings:Audience")]
    public void MissingRequiredValueFailsFast(string key)
    {
        var values = ValidConfiguration();
        values[key] = " ";

        var exception = Assert.Throws<InvalidOperationException>(() =>
            ProductionConfiguration.Validate(TestEnvironment.Configuration(values), new TestEnvironment()));

        Assert.Contains(key, exception.Message);
    }

    [Theory]
    [InlineData("JwtSettings:SecretKey", "short")]
    [InlineData("EncryptionSettings:Key", "short")]
    [InlineData("JwtSettings:SecretKey", "YOUR_SECRET_MUST_BE_CONFIGURED_123456789")]
    [InlineData("EncryptionSettings:Key", "replace-this-example-with-a-real-value")]
    public void WeakOrExampleSecretsAreRejected(string key, string value)
    {
        var values = ValidConfiguration();
        values[key] = value;
        Assert.Throws<InvalidOperationException>(() =>
            ProductionConfiguration.Validate(TestEnvironment.Configuration(values), new TestEnvironment()));
    }

    [Theory]
    [InlineData("*")]
    [InlineData("https://exam.example.test/")]
    [InlineData("https://exam.example.test/private")]
    [InlineData("https://exam.example.test?token=value")]
    [InlineData("https://exam.example.test#fragment")]
    [InlineData("ftp://exam.example.test")]
    public void CorsRejectsAnythingOtherThanAnExactHttpOrigin(string origin)
    {
        var values = ValidConfiguration();
        values["Cors:AllowedOrigins:0"] = origin;
        Assert.Throws<InvalidOperationException>(() =>
            ProductionConfiguration.Validate(TestEnvironment.Configuration(values), new TestEnvironment()));
    }

    [Theory]
    [InlineData("Production")]
    [InlineData("Staging")]
    public void DeployedEnvironmentMustConfigureCors(string environmentName)
    {
        var values = ValidConfiguration();
        values.Remove("Cors:AllowedOrigins:0");
        Assert.Throws<InvalidOperationException>(() =>
            ProductionConfiguration.Validate(TestEnvironment.Configuration(values),
                new TestEnvironment { EnvironmentName = environmentName }));
    }

    [Fact]
    public void DevelopmentMayOmitCorsButNotRequiredSecrets()
    {
        var values = ValidConfiguration();
        values.Remove("Cors:AllowedOrigins:0");
        var environment = new TestEnvironment { EnvironmentName = Environments.Development };
        ProductionConfiguration.Validate(TestEnvironment.Configuration(values), environment);

        values.Remove("JwtSettings:SecretKey");
        Assert.Throws<InvalidOperationException>(() =>
            ProductionConfiguration.Validate(TestEnvironment.Configuration(values), environment));
    }

    [Fact]
    public void CompleteMultiServerConfigurationPasses() =>
        ProductionConfiguration.Validate(TestEnvironment.Configuration(ValidConfiguration(true)), new TestEnvironment());

    [Theory]
    [InlineData("ConnectionStrings:Redis")]
    [InlineData("SignalR:ChannelPrefix")]
    [InlineData("DataProtection:CertificatePath")]
    [InlineData("DataProtection:KeyRingPath")]
    [InlineData("MediaStorage:Local:BasePath")]
    [InlineData("Storage:OrganizationPath")]
    [InlineData("Storage:IdentityPath")]
    [InlineData("Storage:TutorialsPath")]
    [InlineData("License:Directory")]
    public void MultiServerRequiresEverySharedDependency(string key)
    {
        var values = ValidConfiguration(true);
        values.Remove(key);
        var exception = Assert.Throws<InvalidOperationException>(() =>
            ProductionConfiguration.Validate(TestEnvironment.Configuration(values), new TestEnvironment()));
        Assert.Contains(key, exception.Message);
    }

    [Theory]
    [InlineData("DataProtection:KeyRingPath")]
    [InlineData("MediaStorage:Local:BasePath")]
    [InlineData("Storage:OrganizationPath")]
    [InlineData("Storage:IdentityPath")]
    [InlineData("Storage:TutorialsPath")]
    [InlineData("License:Directory")]
    public void MultiServerRejectsRelativeSharedPaths(string key)
    {
        var values = ValidConfiguration(true);
        values[key] = "relative/shared";
        var exception = Assert.Throws<InvalidOperationException>(() =>
            ProductionConfiguration.Validate(TestEnvironment.Configuration(values), new TestEnvironment()));
        Assert.Contains(key, exception.Message);
    }

    [Theory]
    [InlineData("RateLimiting:PermitLimit", "0")]
    [InlineData("RateLimiting:AnonymousPermitLimit", "-1")]
    [InlineData("RateLimiting:WindowInSeconds", "0")]
    [InlineData("RateLimiting:QueueLimit", "-1")]
    public void InvalidRateLimitsFailFast(string key, string value)
    {
        var values = ValidConfiguration();
        values[key] = value;
        Assert.Throws<InvalidOperationException>(() =>
            ProductionConfiguration.Validate(TestEnvironment.Configuration(values), new TestEnvironment()));
    }

    [Fact]
    public void ForwardingIsLimitedToOneHopAndRetainsTrustRestrictions()
    {
        var options = new ForwardedHeadersOptions();
        ProductionConfiguration.ConfigureForwarding(options, TestEnvironment.Configuration(new()
        {
            ["ReverseProxy:KnownProxies:0"] = "192.0.2.10"
        }));

        Assert.Equal(1, options.ForwardLimit);
        Assert.Equal(ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto, options.ForwardedHeaders);
        Assert.Contains(IPAddress.Parse("192.0.2.10"), options.KnownProxies);
        Assert.DoesNotContain(options.KnownNetworks, network => network.PrefixLength == 0);
    }

    [Theory]
    [InlineData("192.0.2.10", "198.51.100.7", "https")]
    [InlineData("203.0.113.11", "203.0.113.11", "http")]
    public async Task ForwardingHonorsOnlyExplicitlyTrustedProxy(string remoteAddress, string expectedAddress, string expectedScheme)
    {
        var options = new ForwardedHeadersOptions();
        ProductionConfiguration.ConfigureForwarding(options, TestEnvironment.Configuration(new()
        {
            ["ReverseProxy:KnownProxies:0"] = "192.0.2.10"
        }));
        var context = new DefaultHttpContext();
        context.Connection.RemoteIpAddress = IPAddress.Parse(remoteAddress);
        context.Request.Scheme = "http";
        context.Request.Headers["X-Forwarded-For"] = "198.51.100.6, 198.51.100.7";
        context.Request.Headers["X-Forwarded-Proto"] = "http, https";
        var middleware = new ForwardedHeadersMiddleware(
            _ => Task.CompletedTask, NullLoggerFactory.Instance, Options.Create(options));

        await middleware.Invoke(context);

        Assert.Equal(IPAddress.Parse(expectedAddress), context.Connection.RemoteIpAddress);
        Assert.Equal(expectedScheme, context.Request.Scheme);
    }
}
