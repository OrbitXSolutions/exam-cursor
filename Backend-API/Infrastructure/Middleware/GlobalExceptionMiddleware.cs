using System.Net;
using System.Text.Json;
using FluentValidation;
using Smart_Core.Application.DTOs.Common;

namespace Smart_Core.Infrastructure.Middleware;

public class GlobalExceptionMiddleware
{
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
        catch (Exception ex)
    {
      await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
  _logger.LogError(exception, "An unhandled exception occurred: {Message}", exception.Message);

       context.Response.ContentType = "application/json";

 var response = exception switch
        {
 ValidationException validationException => HandleValidationException(context, validationException),
 UnauthorizedAccessException => HandleUnauthorizedAccessException(context),
    KeyNotFoundException => HandleNotFoundException(context, exception),
    ArgumentException argumentException => HandleArgumentException(context, argumentException),
       _ => HandleGenericException(context, exception)
        };

   var options = new JsonSerializerOptions
        {
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }

    private ApiResponse<object> HandleValidationException(HttpContext context, ValidationException exception)
    {
        context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
   return ApiResponse<object>.FailureResponse(
     "Validation failed.",
    exception.Errors.Select(e => e.ErrorMessage).ToList());
    }

    private ApiResponse<object> HandleUnauthorizedAccessException(HttpContext context)
    {
        context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
   return ApiResponse<object>.FailureResponse("Unauthorized access.");
    }

 private ApiResponse<object> HandleNotFoundException(HttpContext context, Exception exception)
    {
 context.Response.StatusCode = (int)HttpStatusCode.NotFound;
return ApiResponse<object>.FailureResponse(exception.Message);
    }

    private ApiResponse<object> HandleArgumentException(HttpContext context, ArgumentException exception)
    {
     context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
        return ApiResponse<object>.FailureResponse(exception.Message);
    }

    private ApiResponse<object> HandleGenericException(HttpContext context, Exception exception)
    {
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

#if DEBUG
 return ApiResponse<object>.FailureResponse(
    "An internal server error occurred.",
      new List<string> { exception.Message, exception.StackTrace ?? "" });
#else
        return ApiResponse<object>.FailureResponse("An internal server error occurred. Please try again later.");
#endif
    }
}

public static class GlobalExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionMiddleware(this IApplicationBuilder app)
    {
 return app.UseMiddleware<GlobalExceptionMiddleware>();
    }
}
