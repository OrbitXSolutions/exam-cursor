using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Infrastructure.Services.Logs;

namespace Smart_Core.Infrastructure.Filters.Logs;

public sealed class ApiResponseLoggingFilter : IAsyncAlwaysRunResultFilter
{
    private static readonly object RejectionKey = new();

    public async Task OnResultExecutionAsync(ResultExecutingContext context, ResultExecutionDelegate next)
    {
        var response = context.Result switch
        {
            ObjectResult result => result.Value as IApiResponse,
            JsonResult result => result.Value as IApiResponse,
            _ => null
        };
        if (response != null) RecordFailure(context.HttpContext, response);
        await next();
    }

    internal static void RecordFailure(HttpContext context, IApiResponse response)
    {
        if (response.Success) return;
        response.TraceId = SafeLogMetadata.TraceId(context);
        context.Items[RejectionKey] = response.ErrorCount;
    }

    internal static int? RejectionErrorCount(HttpContext context) =>
        context.Items.TryGetValue(RejectionKey, out var count) && count is int errorCount ? errorCount : null;
}
