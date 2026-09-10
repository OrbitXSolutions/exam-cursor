using System.Diagnostics;
using Microsoft.Extensions.Logging.Abstractions;
using Smart_Core.Domain.Common;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities.Logs;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Filters.Logs;
using Smart_Core.Infrastructure.Services.Logs;

namespace Smart_Core.Infrastructure.Middleware;

public class RequestResponseLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestResponseLoggingMiddleware> _logger;

    public RequestResponseLoggingMiddleware(RequestDelegate next,
        ILogger<RequestResponseLoggingMiddleware>? logger = null)
    {
        _next = next;
        _logger = logger ?? NullLogger<RequestResponseLoggingMiddleware>.Instance;
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
            try
            {
                var handledFailure = context.Items[GlobalExceptionMiddleware.ExceptionKey] as Exception;
                failure ??= handledFailure;
                var disconnected = context.RequestAborted.IsCancellationRequested && handledFailure == null;
                var status = disconnected ? 499 : failure == null
                    ? context.Response.StatusCode
                    : SafeLogMetadata.ExceptionStatus(failure);
                var rejectionErrorCount = ApiResponseLoggingFilter.RejectionErrorCount(context);
                var isError = status >= 400 || rejectionErrorCount.HasValue;
                var outcome = disconnected ? "Disconnected" : status >= 500 ? "Error" :
                    isError ? "Rejected" : "Succeeded";
                var method = SafeLogMetadata.Method(context);
                var path = SafeLogMetadata.Path(context);
                var userId = SafeLogMetadata.UserId(context);
                var controller = SafeLogMetadata.Controller(context);
                var durationMs = (long)Stopwatch.GetElapsedTime(started).TotalMilliseconds;
                if (channel != null && (isError || method is not ("GET" or "HEAD" or "OPTIONS")))
                {
                    var role = SafeLogMetadata.Role(context);
                    var category = role switch
                    {
                        AppRoles.Candidate => LogCategory.Candidate,
                        AppRoles.Proctor => LogCategory.Proctor,
                        _ => isError ? LogCategory.Developer : LogCategory.User
                    };
                    var log = new SystemLog
                    {
                        Timestamp = UaeTimeHelper.NowUae,
                        Level = status >= 500 ? SystemLogLevel.Error : isError ? SystemLogLevel.Warning : SystemLogLevel.Info,
                        Category = category,
                        UserId = userId,
                        UserRole = role,
                        Action = $"{method} {controller}",
                        Controller = controller,
                        Endpoint = path,
                        HttpMethod = method,
                        ResponseStatusCode = status,
                        ExceptionType = failure == null || disconnected ? null : SafeLogMetadata.ExceptionType(failure),
                        TraceId = traceId,
                        DurationMs = durationMs
                    };
                    channel.TryWrite(log);
                    if (isError && !disconnected && category != LogCategory.Developer)
                    {
                        log.Category = LogCategory.Developer;
                        channel.TryWrite(log);
                    }
                }

                _logger.Log(status >= 500 ? LogLevel.Error : isError ? LogLevel.Warning : LogLevel.Information,
                    "API request completed. Method={Method} Path={Path} StatusCode={StatusCode} Outcome={Outcome} ErrorCount={ErrorCount} DurationMs={DurationMs} TraceId={TraceId} UserId={UserId} EntityIds={EntityIds}",
                    method, path, status, outcome, rejectionErrorCount ?? 0, durationMs, traceId, userId,
                    SafeLogMetadata.RouteIdentifiers(context));
            }
            catch (Exception)
            {
                // Diagnostics must not replace a response or the original exception. Sink failures use SelfLog.
            }
        }
    }
}

public static class RequestResponseLoggingMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestResponseLogging(this IApplicationBuilder app) =>
        app.UseMiddleware<RequestResponseLoggingMiddleware>();
}
