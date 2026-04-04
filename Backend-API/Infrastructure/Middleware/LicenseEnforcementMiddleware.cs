using System.Text.Json;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Services.License;

namespace Smart_Core.Infrastructure.Middleware;

public class LicenseEnforcementMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<LicenseEnforcementMiddleware> _logger;

    // Paths that are always allowed regardless of license state
    private static readonly string[] AlwaysAllowedPaths = new[]
    {
        "/api/auth/login",
        "/api/auth/candidate-login",
        "/api/license/status",
        "/api/license/upload",
        "/swagger",
        "/hubs/"
    };

    public LicenseEnforcementMiddleware(RequestDelegate next, ILogger<LicenseEnforcementMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var licenseService = context.RequestServices.GetRequiredService<LicenseValidationService>();
        var state = licenseService.GetCurrentState();

        // Always add license state header for frontend awareness
        context.Response.OnStarting(() =>
        {
            if (!context.Response.Headers.ContainsKey("X-License-State"))
            {
                context.Response.Headers["X-License-State"] = state.ToString();
            }
            return Task.CompletedTask;
        });

        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";
        var method = context.Request.Method;

        // Always allow specific paths
        if (IsAlwaysAllowed(path))
        {
            await _next(context);
            return;
        }

        // Always allow GET/HEAD/OPTIONS requests (read-only)
        if (method is "GET" or "HEAD" or "OPTIONS")
        {
            await _next(context);
            return;
        }

        // Domain binding check (for valid licenses only)
        if (state != LicenseState.Missing && state != LicenseState.Invalid)
        {
            var requestHost = context.Request.Host.Host;
            if (!licenseService.IsDomainValid(requestHost))
            {
                _logger.LogWarning("License domain mismatch. Request host={Host}, Licensed domain={Domain}",
                    requestHost, licenseService.GetLicenseStatus().LicensedDomain);
                // Treat domain mismatch as Invalid — but still no blocking (warning only)
                context.Response.Headers["X-License-State"] = LicenseState.Invalid.ToString();
            }
        }

        // Enforcement: Only Expired state blocks mutating requests
        if (state == LicenseState.Expired)
        {
            _logger.LogWarning("License expired — blocking {Method} {Path}", method, path);

            context.Response.StatusCode = 403;
            context.Response.ContentType = "application/json";
            context.Response.Headers["X-License-State"] = state.ToString();

            var response = ApiResponse<object>.FailureResponse(
                "License expired. Read-only mode active. Please contact your administrator to renew the license.");
            response.TraceId = context.TraceIdentifier;

            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
            return;
        }

        // All other states: Active, Warning, GracePeriod, Missing, Invalid → pass through
        await _next(context);
    }

    private static bool IsAlwaysAllowed(string path)
    {
        foreach (var allowed in AlwaysAllowedPaths)
        {
            if (path.StartsWith(allowed, StringComparison.OrdinalIgnoreCase))
                return true;
        }
        return false;
    }
}

public static class LicenseEnforcementMiddlewareExtensions
{
    public static IApplicationBuilder UseLicenseEnforcement(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<LicenseEnforcementMiddleware>();
    }
}
