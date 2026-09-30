using Smart_Core.Domain.Entities.Logs;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Services.Logs;

namespace Smart_Core.Infrastructure.Authentication;

// Uses the existing Serilog and SystemLogChannel pipeline. Inputs are application-owned
// enums and HTTP status codes, never provider payloads, URLs, exceptions or claims.
public enum SsoEvent { Started, CallbackAccepted, CallbackFailed, TokenAccepted, TokenFailed,
    ProfileAccepted, ProfileFailed, LinkAttempt, LinkRejected, Linked, LoginSucceeded, LoginRejected, Cancelled, CsrfRejected }

public static class SsoAudit
{
    public static void Write(HttpContext context, string provider, SsoEvent action, int? status = null, Exception? failure = null)
    {
        var safeProvider = provider is "uaepass" or "government" ? provider : "unknown";
        var trace = SafeLogMetadata.TraceId(context);
        var name = $"SSO.{safeProvider}.{action}";
        var exceptionType = failure == null ? null : SafeLogMetadata.ExceptionType(failure);
        var failed = action is SsoEvent.CallbackFailed or SsoEvent.TokenFailed or SsoEvent.ProfileFailed
            or SsoEvent.LinkRejected or SsoEvent.LoginRejected or SsoEvent.CsrfRejected;
        context.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("Smart_Core.Authentication")
            .Log(failed ? LogLevel.Warning : LogLevel.Information,
                "SSO event {SsoEvent}; HTTP status {ProviderStatus}; failure type {FailureType}; trace {TraceId}",
                name, status, exceptionType, trace);
        context.RequestServices.GetRequiredService<SystemLogChannel>().TryWrite(new SystemLog
        {
            Action = name, Category = LogCategory.User, Level = failed ? SystemLogLevel.Warning : SystemLogLevel.Info,
            Controller = "ExternalAuth", Endpoint = SafeLogMetadata.Path(context),
            HttpMethod = SafeLogMetadata.Method(context), ResponseStatusCode = status,
            TraceId = trace, ExceptionType = exceptionType
        });
    }
}
