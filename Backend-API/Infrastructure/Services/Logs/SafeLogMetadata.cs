using System.Diagnostics;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc.Controllers;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Infrastructure.Services.Logs;

public static class SafeLogMetadata
{
    public static string? Limit(string? value, int length)
    {
        if (value == null) return null;
        var bounded = value.Length <= length ? value : value[..length];
        return new string(bounded.Select(c => char.IsControl(c) ? ' ' : c).ToArray());
    }

    // Route templates preserve useful paths without recording tokens, emails or IDs in URL segments.
    public static string Path(HttpContext context) =>
        Limit((context.GetEndpoint() as RouteEndpoint)?.RoutePattern.RawText, 512) is { Length: > 0 } route
            ? "/" + route.TrimStart('/')
            : "/api/[unmatched]";

    public static string Method(HttpContext context) => context.Request.Method switch
    {
        "GET" or "POST" or "PUT" or "PATCH" or "DELETE" or "HEAD" or "OPTIONS" => context.Request.Method,
        _ => "OTHER"
    };

    public static string Controller(HttpContext context) =>
        Limit(context.GetEndpoint()?.Metadata.GetMetadata<ControllerActionDescriptor>()?.ControllerName, 128) ?? "API";

    public static string TraceId(HttpContext context) =>
        Limit(Activity.Current?.TraceId.ToString() ?? context.TraceIdentifier, 128) ?? string.Empty;

    public static string? UserId(HttpContext context)
    {
        var id = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        return id?.Contains('@') == true ? null : Limit(id, 450);
    }

    public static string? Role(HttpContext context) =>
        AppRoles.AllRoles.FirstOrDefault(context.User.IsInRole);

    public static string ExceptionType(Exception exception) =>
        Limit(exception.GetType().FullName, 512) ?? "Exception";

    public static string Stack(Exception exception)
    {
        // Never format Exception.ToString(), messages, source filenames or exception.Data.
        var frames = new StackTrace(exception, false).GetFrames().Take(16);
        return string.Join(" -> ", frames.Select(frame =>
        {
            var method = frame.GetMethod();
            return Limit($"{method?.DeclaringType?.FullName}.{method?.Name}", 256);
        }));
    }

    public static int ExceptionStatus(Exception exception) => exception switch
    {
        FluentValidation.ValidationException or ArgumentException => StatusCodes.Status400BadRequest,
        UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
        KeyNotFoundException => StatusCodes.Status404NotFound,
        BadHttpRequestException badRequest => badRequest.StatusCode,
        _ => StatusCodes.Status500InternalServerError
    };
}
