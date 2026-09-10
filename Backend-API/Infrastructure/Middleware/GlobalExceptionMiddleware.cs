using System.Text.Json;
using FluentValidation;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Infrastructure.Filters.Logs;
using Smart_Core.Infrastructure.Services.Logs;

namespace Smart_Core.Infrastructure.Middleware;

public class GlobalExceptionMiddleware
{
    internal static readonly object ExceptionKey = new();
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception) when (context.RequestAborted.IsCancellationRequested &&
                                          exception is OperationCanceledException or IOException)
        {
            if (!context.Response.HasStarted) context.Response.StatusCode = 499;
        }
        catch (Exception exception)
        {
            context.Items[ExceptionKey] = exception;
            var traceId = SafeLogMetadata.TraceId(context);
            // Passing the Exception object to a sink would disclose its message/inner exception/data.
            try
            {
                _logger.LogError(
                    "Request failed. TraceId={TraceId} Method={Method} Path={Path} UserId={UserId} EntityIds={EntityIds} ExceptionType={ExceptionType} Diagnostics={Diagnostics}",
                    traceId, SafeLogMetadata.Method(context), SafeLogMetadata.Path(context),
                    SafeLogMetadata.UserId(context), SafeLogMetadata.RouteIdentifiers(context),
                    SafeLogMetadata.ExceptionType(exception), SafeLogMetadata.Diagnostics(exception));
            }
            catch (Exception)
            {
                // A failed diagnostic sink must not prevent the safe error response.
            }

            if (context.RequestAborted.IsCancellationRequested) return;
            if (context.Response.HasStarted)
            {
                context.Abort();
                return;
            }

            context.Response.Clear();
            context.Response.StatusCode = SafeLogMetadata.ExceptionStatus(exception);
            context.Response.ContentType = "application/json";
            var response = exception switch
            {
                ValidationException validation => ApiResponse<object>.FailureResponse(
                    "Validation failed.", validation.Errors.Select(e => e.ErrorMessage).ToList()),
                UnauthorizedAccessException => ApiResponse<object>.FailureResponse("Unauthorized access."),
                KeyNotFoundException => ApiResponse<object>.FailureResponse(exception.Message),
                ArgumentException => ApiResponse<object>.FailureResponse(exception.Message),
                BadHttpRequestException => ApiResponse<object>.FailureResponse("Invalid request."),
                _ => ApiResponse<object>.FailureResponse("An internal server error occurred. Please try again later.")
            };
            ApiResponseLoggingFilter.RecordFailure(context, response);
            try
            {
                await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions), context.RequestAborted);
            }
            catch (Exception writeException) when (writeException is OperationCanceledException or IOException)
            {
                // The client may disconnect after the initial cancellation/HasStarted checks.
                context.Abort();
            }
        }
    }
}

public static class GlobalExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionMiddleware(this IApplicationBuilder app) =>
        app.UseMiddleware<GlobalExceptionMiddleware>();
}
