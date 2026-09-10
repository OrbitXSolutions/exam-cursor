using System.Diagnostics;
using System.Globalization;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Data.SqlClient;
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

    public static string Diagnostics(Exception exception)
    {
        var pending = new Queue<Exception>();
        pending.Enqueue(exception);
        var details = new StringBuilder();
        var count = 0;
        while (pending.Count > 0 && count < 4)
        {
            var cause = pending.Dequeue();
            if (count > 0) details.Append(" | ");
            details.Append(CultureInfo.InvariantCulture, $"Cause[{count}] Type={ExceptionType(cause)}");
            switch (cause)
            {
                case SqlException sql:
                    details.Append(CultureInfo.InvariantCulture,
                        $" SqlNumber={sql.Number} SqlState={sql.State} SqlClass={sql.Class}");
                    break;
                case HttpRequestException http when http.StatusCode.HasValue:
                    details.Append(CultureInfo.InvariantCulture, $" HttpStatus={(int)http.StatusCode.Value}");
                    break;
                case IOException io:
                    details.Append(CultureInfo.InvariantCulture, $" HResult=0x{io.HResult:X8}");
                    break;
            }
            details.Append(" Stack=").Append(Stack(cause));
            count++;
            if (cause is AggregateException aggregate)
            {
                foreach (var inner in aggregate.InnerExceptions.Take(4 - count - pending.Count))
                    pending.Enqueue(inner);
            }
            else if (cause.InnerException is { } inner && count + pending.Count < 4)
            {
                pending.Enqueue(inner);
            }
        }
        return Limit(details.ToString(), 16384) ?? string.Empty;
    }

    public static string RouteIdentifiers(HttpContext context)
    {
        var identifiers = new List<string>(3);
        foreach (var key in new[] { "id", "attemptId", "examId" })
        {
            if (!context.Request.RouteValues.TryGetValue(key, out var value)) continue;
            var text = value switch
            {
                string literal => literal,
                int number => number.ToString(CultureInfo.InvariantCulture),
                long number => number.ToString(CultureInfo.InvariantCulture),
                _ => null
            };
            if (text is { Length: > 0 and <= 19 } &&
                long.TryParse(text, NumberStyles.None, CultureInfo.InvariantCulture, out var id))
                identifiers.Add($"{key}={id.ToString(CultureInfo.InvariantCulture)}");
        }
        return string.Join(" ", identifiers);
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
