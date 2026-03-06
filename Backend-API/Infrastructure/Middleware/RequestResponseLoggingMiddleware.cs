using System.Diagnostics;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Smart_Core.Domain.Entities.Logs;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Services.Logs;

namespace Smart_Core.Infrastructure.Middleware;

/// <summary>
/// Captures request/response data for the SystemLog system.
/// - Developer category: errors/exceptions only (full request + response + stack trace)
/// - Candidate/Proctor/User: important actions only (login, submit, session, etc.)
/// Writes to Channel — zero impact on request performance.
/// </summary>
public class RequestResponseLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestResponseLoggingMiddleware> _logger;

    // Important action patterns worth logging (non-error) per user type
    private static readonly HashSet<string> ImportantPatterns = new(StringComparer.OrdinalIgnoreCase)
    {
        // Auth
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
        "/api/auth/change-password",

        // Candidate actions
        "/api/attempt",
        "/api/candidate",
        "/api/examtaking",

        // Proctor actions
        "/api/proctor",
        "/api/identityverification",
        "/api/incident",

        // Admin actions
        "/api/users",
        "/api/roles",
        "/api/departments",
        "/api/assessment",
        "/api/exam",
        "/api/grading",
        "/api/seed",
        "/api/settings",
        "/api/notification",
        "/api/batch",
        "/api/examassignment",
        "/api/examoperations",
        "/api/attemptcontrol",
    };

    // Sensitive fields to redact from request bodies
    private static readonly Regex SensitiveFieldPattern = new(
        @"""(password|token|secret|authorization|apiKey|smtpPassword|smsAuthToken|customSmsApiKey)"":\s*""[^""]*""",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public RequestResponseLoggingMiddleware(RequestDelegate next, ILogger<RequestResponseLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var channel = context.RequestServices.GetService<SystemLogChannel>();
        if (channel == null)
        {
            await _next(context);
            return;
        }

        var path = context.Request.Path.Value ?? "";

        // Skip non-API requests (swagger, static files, signalr health checks)
        if (!path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        var sw = Stopwatch.StartNew();
        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;
        string? requestBody = null;
        string? responseBody = null;
        Exception? caughtException = null;

        // Read request body for non-GET (only for important actions or if it errors)
        if (context.Request.Method != "GET" && context.Request.ContentLength > 0 && context.Request.ContentLength < 64_000)
        {
            context.Request.EnableBuffering();
            using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
            requestBody = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;

            // Sanitize sensitive data
            if (!string.IsNullOrEmpty(requestBody))
            {
                requestBody = SensitiveFieldPattern.Replace(requestBody, @"""$1"": ""***REDACTED***""");
            }
        }

        // Capture response body only for errors
        var originalResponseBody = context.Response.Body;
        using var responseStream = new MemoryStream();
        context.Response.Body = responseStream;

        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            caughtException = ex;
            throw; // Let GlobalExceptionMiddleware handle the response
        }
        finally
        {
            sw.Stop();
            context.Response.Body = originalResponseBody;

            // Read response body
            responseStream.Position = 0;
            var responseBytes = responseStream.ToArray();

            // Copy response to original stream
            if (responseBytes.Length > 0)
            {
                await originalResponseBody.WriteAsync(responseBytes);
            }

            var statusCode = context.Response.StatusCode;
            var isError = statusCode >= 400 || caughtException != null;

            // Capture response body only for errors (limit to 8KB)
            if (isError && responseBytes.Length > 0)
            {
                var maxLen = Math.Min(responseBytes.Length, 8192);
                responseBody = Encoding.UTF8.GetString(responseBytes, 0, maxLen);
            }

            // Determine category from user role
            var category = ResolveCategory(context, isError);

            // Should we log this request?
            var shouldLog = isError || IsImportantAction(path, context.Request.Method);

            if (shouldLog)
            {
                var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
                var email = context.User.FindFirstValue(ClaimTypes.Email);
                var role = context.User.FindFirstValue(ClaimTypes.Role);

                var log = new SystemLog
                {
                    Timestamp = DateTime.UtcNow,
                    Level = isError ? (statusCode >= 500 ? SystemLogLevel.Error : SystemLogLevel.Warning) : SystemLogLevel.Info,
                    Category = category,
                    UserId = userId,
                    UserDisplayName = email,
                    UserRole = role,
                    Action = ResolveAction(path, context.Request.Method),
                    Controller = ExtractController(path),
                    Endpoint = path,
                    HttpMethod = context.Request.Method,
                    RequestBody = isError || context.Request.Method != "GET" ? requestBody : null,
                    ResponseStatusCode = statusCode,
                    ResponseBody = isError ? responseBody : null,
                    ErrorMessage = caughtException?.Message,
                    StackTrace = caughtException != null ? caughtException.ToString() : null,
                    ExceptionType = caughtException?.GetType().FullName,
                    TraceId = traceId,
                    IpAddress = context.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = context.Request.Headers.UserAgent.ToString().Length > 512
                        ? context.Request.Headers.UserAgent.ToString()[..512]
                        : context.Request.Headers.UserAgent.ToString(),
                    DurationMs = sw.ElapsedMilliseconds
                };

                // For Developer logs on errors, always log with full detail
                if (isError && category != LogCategory.Developer)
                {
                    // Also write a Developer-category log for error tracking
                    var devLog = new SystemLog
                    {
                        Timestamp = log.Timestamp,
                        Level = log.Level,
                        Category = LogCategory.Developer,
                        UserId = userId,
                        UserDisplayName = email,
                        UserRole = role,
                        Action = log.Action,
                        Controller = log.Controller,
                        Endpoint = log.Endpoint,
                        HttpMethod = log.HttpMethod,
                        RequestBody = requestBody,
                        ResponseStatusCode = statusCode,
                        ResponseBody = responseBody,
                        ErrorMessage = caughtException?.Message,
                        StackTrace = caughtException?.ToString(),
                        ExceptionType = caughtException?.GetType().FullName,
                        TraceId = traceId,
                        IpAddress = log.IpAddress,
                        UserAgent = log.UserAgent,
                        DurationMs = sw.ElapsedMilliseconds
                    };
                    channel.TryWrite(devLog);
                }

                channel.TryWrite(log);
            }
        }
    }

    private static LogCategory ResolveCategory(HttpContext context, bool isError)
    {
        if (isError && !context.User.Identity?.IsAuthenticated == true)
            return LogCategory.Developer;

        var role = context.User.FindFirstValue(ClaimTypes.Role);
        return role?.ToLower() switch
        {
            "candidate" => LogCategory.Candidate,
            "proctor" => LogCategory.Proctor,
            _ when isError => LogCategory.Developer,
            _ => LogCategory.User
        };
    }

    private static bool IsImportantAction(string path, string method)
    {
        // All non-GET mutations on important endpoints
        if (method == "GET") return false;

        var lowerPath = path.ToLowerInvariant();
        foreach (var pattern in ImportantPatterns)
        {
            if (lowerPath.StartsWith(pattern, StringComparison.OrdinalIgnoreCase))
                return true;
        }
        return false;
    }

    private static string ResolveAction(string path, string method)
    {
        var controller = ExtractController(path);
        return $"{method} {controller}";
    }

    private static string ExtractController(string path)
    {
        // /api/Controller/... → Controller
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        return segments.Length >= 2 ? segments[1] : path;
    }
}

public static class RequestResponseLoggingMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestResponseLogging(this IApplicationBuilder app)
    {
        return app.UseMiddleware<RequestResponseLoggingMiddleware>();
    }
}
