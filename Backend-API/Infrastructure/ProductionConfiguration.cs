using System.Net;
using Microsoft.AspNetCore.HttpOverrides;

namespace Smart_Core.Infrastructure;

public static class ProductionConfiguration
{
    public static void Validate(IConfiguration configuration, IHostEnvironment environment)
    {
        Require(configuration, "ConnectionStrings:DefaultConnection");
        RequireSecret(configuration, "JwtSettings:SecretKey");
        RequireSecret(configuration, "EncryptionSettings:Key");
        Require(configuration, "JwtSettings:Issuer");
        Require(configuration, "JwtSettings:Audience");

        foreach (var origin in configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
        {
            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri) ||
                (uri.Scheme != "https" && uri.Scheme != "http") ||
                origin != uri.GetLeftPart(UriPartial.Authority))
                throw new InvalidOperationException("Cors:AllowedOrigins must contain exact HTTP(S) origins without paths or wildcards.");
        }

        if (!environment.IsDevelopment() &&
            !(configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()?.Length > 0))
            throw new InvalidOperationException("Cors:AllowedOrigins must be configured for deployment.");

        if (configuration.GetValue<bool>("Deployment:MultiServer"))
        {
            Require(configuration, "ConnectionStrings:Redis");
            Require(configuration, "SignalR:ChannelPrefix");
            Require(configuration, "DataProtection:KeyRingPath");
            Require(configuration, "DataProtection:CertificatePath");
            foreach (var key in new[]
            {
                "MediaStorage:Local:BasePath", "Storage:OrganizationPath",
                "Storage:IdentityPath", "Storage:TutorialsPath", "License:Directory",
                "DataProtection:KeyRingPath"
            })
            {
                Require(configuration, key);
                if (!Path.IsPathFullyQualified(configuration[key]!))
                    throw new InvalidOperationException($"{key} must be an absolute shared path in multi-server mode.");
            }
        }

        if (configuration.GetValue<int>("RateLimiting:PermitLimit", 100) <= 0 ||
            configuration.GetValue<int>("RateLimiting:AnonymousPermitLimit", 100) <= 0 ||
            configuration.GetValue<int>("RateLimiting:WindowInSeconds", 60) <= 0 ||
            configuration.GetValue<int>("RateLimiting:QueueLimit", 0) < 0)
            throw new InvalidOperationException("RateLimiting limits must be positive and QueueLimit must be non-negative.");
    }

    public static void ConfigureForwarding(ForwardedHeadersOptions options, IConfiguration configuration)
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.ForwardLimit = 1;
        // Never accept forwarded headers from arbitrary clients.
        foreach (var proxy in configuration.GetSection("ReverseProxy:KnownProxies").Get<string[]>() ?? [])
            options.KnownProxies.Add(IPAddress.Parse(proxy));
    }

    private static void Require(IConfiguration configuration, string key)
    {
        if (string.IsNullOrWhiteSpace(configuration[key]))
            throw new InvalidOperationException($"{key} must be supplied through deployment configuration.");
    }

    private static void RequireSecret(IConfiguration configuration, string key)
    {
        Require(configuration, key);
        var value = configuration[key]!;
        if (value.Length < 32 || value.Contains("YOUR_", StringComparison.OrdinalIgnoreCase) ||
            value.Contains("REPLACE", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"{key} must be a deployment secret of at least 32 characters, not an example value.");
    }
}
