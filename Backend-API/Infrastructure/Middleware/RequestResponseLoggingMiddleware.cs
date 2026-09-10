using System.Diagnostics;
using Smart_Core.Domain.Common;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities.Logs;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Services.Logs;

namespace Smart_Core.Infrastructure.Middleware;

public class RequestResponseLoggingMiddleware
{
    private readonly RequestDelegate _next;

    public RequestResponseLoggingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        var traceId = SafeLogMetadata.TraceId(context);
        if (!context.Response.HasStarted)
        {
            // OnStarting also survives Response.Clear() when the exception middleware handles an error.
            context.Response.OnStarting(() =>
            {
                context.Response.Headers["X-Correlation-ID"] = traceId;
                context.Response.Headers["X-Trace-Id"] = traceId;
                return Task.CompletedTask;
            });
        }
        var channel = context.RequestServices.GetService<SystemLogChannel>();
        if (channel == null)
        {
            await _next(context);
            return;
        }

        var started = Stopwatch.GetTimestamp();
        Exception? failure = null;
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            failure = exception;
            throw;
        }
        finally
        {
            failure ??= context.Items[GlobalExceptionMiddleware.ExceptionKey] as Exception;
            var disconnected = context.RequestAborted.IsCancellationRequested;
            var status = disconnected ? 499 : failure == null
                ? context.Response.StatusCode
                : SafeLogMetadata.ExceptionStatus(failure);
            var isError = status >= 400;
            var method = SafeLogMetadata.Method(context);
            if (isError || method is not ("GET" or "HEAD" or "OPTIONS"))
            {
                var role = SafeLogMetadata.Role(context);
                var category = role switch
                {
                    AppRoles.Candidate => LogCategory.Candidate,
                    AppRoles.Proctor => LogCategory.Proctor,
                    _ => isError ? LogCategory.Developer : LogCategory.User
                };
                var controller = SafeLogMetadata.Controller(context);
                var log = new SystemLog
                {
                    Timestamp = UaeTimeHelper.NowUae,
                    Level = status >= 500 ? SystemLogLevel.Error : isError ? SystemLogLevel.Warning : SystemLogLevel.Info,
                    Category = category,
                    UserId = SafeLogMetadata.UserId(context),
                    UserRole = role,
                    Action = $"{method} {controller}",
                    Controller = controller,
                    Endpoint = SafeLogMetadata.Path(context),
                    HttpMethod = method,
                    ResponseStatusCode = status,
                    ExceptionType = failure == null || disconnected ? null : SafeLogMetadata.ExceptionType(failure),
                    TraceId = traceId,
                    DurationMs = (long)Stopwatch.GetElapsedTime(started).TotalMilliseconds
                };
                channel.TryWrite(log);
                if (isError && !disconnected && category != LogCategory.Developer)
                {
                    log.Category = LogCategory.Developer;
                    channel.TryWrite(log);
                }
            }
        }
    }
}

public static class RequestResponseLoggingMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestResponseLogging(this IApplicationBuilder app) =>
        app.UseMiddleware<RequestResponseLoggingMiddleware>();
}
