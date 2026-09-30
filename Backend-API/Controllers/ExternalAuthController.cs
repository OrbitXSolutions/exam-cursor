using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Infrastructure.Authentication;

namespace Smart_Core.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/sso")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class ExternalAuthController(ExternalAuthenticationOptions settings,
    ExternalAccountService accounts, IAntiforgery antiforgery) : ControllerBase
{
    [HttpGet("providers")]
    public IActionResult Providers() => Ok(new
    {
        uaePass = settings.UaePass.Enabled, government = settings.Government.Enabled
    });

    [HttpGet("start/{provider}")]
    public async Task<IActionResult> Start(string provider, string? returnUrl, string? language)
    {
        if (!settings.Enabled(provider)) return NotFound();
        await HttpContext.SignOutAsync(ExternalIdentity.CookieScheme);
        var properties = new AuthenticationProperties { RedirectUri = settings.Finish };
        properties.Items["returnUrl"] = SafeReturnUrl(returnUrl);
        properties.Items["language"] = language == "ar" ? "ar" : "en";
        Response.Headers["Referrer-Policy"] = "no-referrer";
        SsoAudit.Write(HttpContext, provider, SsoEvent.Started);
        return Challenge(properties, provider);
    }

    [HttpGet("session")]
    public async Task<IActionResult> Session()
    {
        var ticket = await ReadAsync();
        var identity = ExternalIdentity.FromPrincipal(ticket.Principal);
        if (identity == null || !settings.Enabled(identity.Provider)) return Expired();
        var user = await accounts.FindAsync(identity);
        // Anti-forgery proof is bound to this authenticated external principal.
        var originalUser = HttpContext.User;
        string? csrf;
        try
        {
            HttpContext.User = ticket.Principal!;
            csrf = antiforgery.GetAndStoreTokens(HttpContext).RequestToken;
        }
        finally { HttpContext.User = originalUser; }
        return Ok(new
        {
            provider = identity.Provider, name = identity.Name, email = identity.Email,
            linked = user != null, csrfToken = csrf,
            returnUrl = SafeReturnUrl(ticket.Properties?.GetString("returnUrl"))
        });
    }

    [HttpPost("complete")]
    public async Task<IActionResult> Complete()
    {
        var identity = await VerifiedAsync();
        if (identity == null) return Expired();
        var result = await accounts.CompleteAsync(identity);
        SsoAudit.Write(HttpContext, identity.Provider, result.Success ? SsoEvent.LoginSucceeded : SsoEvent.LoginRejected);
        if (result.Success) await HttpContext.SignOutAsync(ExternalIdentity.CookieScheme);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("link")]
    public async Task<IActionResult> Link(LinkCorporateAccountDto dto)
    {
        var identity = await VerifiedAsync();
        if (identity == null) return Expired();
        SsoAudit.Write(HttpContext, identity.Provider, SsoEvent.LinkAttempt);
        var result = await accounts.LinkAsync(identity, dto.Account, dto.Password);
        SsoAudit.Write(HttpContext, identity.Provider, result.Success ? SsoEvent.Linked : SsoEvent.LinkRejected);
        if (result.Success)
        {
            SsoAudit.Write(HttpContext, identity.Provider, SsoEvent.LoginSucceeded);
            await HttpContext.SignOutAsync(ExternalIdentity.CookieScheme);
        }
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("cancel")]
    public async Task<IActionResult> Cancel()
    {
        var identity = await VerifiedAsync();
        if (identity == null) return Expired();
        await HttpContext.SignOutAsync(ExternalIdentity.CookieScheme);
        SsoAudit.Write(HttpContext, identity.Provider, SsoEvent.Cancelled);
        return NoContent();
    }

    private Task<AuthenticateResult> ReadAsync() => HttpContext.AuthenticateAsync(ExternalIdentity.CookieScheme);

    private async Task<ExternalIdentity?> VerifiedAsync()
    {
        var ticket = await ReadAsync();
        var identity = ExternalIdentity.FromPrincipal(ticket.Principal);
        if (identity == null || !settings.Enabled(identity.Provider)) return null;
        var originalUser = HttpContext.User;
        try
        {
            HttpContext.User = ticket.Principal!;
            await antiforgery.ValidateRequestAsync(HttpContext);
        }
        catch (AntiforgeryValidationException)
        {
            SsoAudit.Write(HttpContext, identity.Provider, SsoEvent.CsrfRejected);
            return null;
        }
        finally { HttpContext.User = originalUser; }
        return identity;
    }

    private UnauthorizedObjectResult Expired() => Unauthorized(ApiResponse<object>.FailureResponse(
        "Your external sign-in session has expired or is invalid. Please sign in again."));

    public static string? SafeReturnUrl(string? value) => value is { Length: <= 1024 } &&
        value.StartsWith('/') && !value.StartsWith("//") && !value.Contains('\\') &&
        !value.Contains('%') && !value.Any(char.IsControl) ? value : null;
}

public sealed class LinkCorporateAccountDto
{
    [Required, StringLength(256)] public string Account { get; set; } = "";
    [Required, StringLength(1024)] public string Password { get; set; } = "";
}
