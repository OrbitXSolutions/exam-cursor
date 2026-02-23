using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Auth;
using Smart_Core.Application.DTOs.Audit;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Audit;

namespace Smart_Core.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
  private readonly IAuthService _authService;
  private readonly ICurrentUserService _currentUserService;
  private readonly IAuditService _auditService;

  public AuthController(IAuthService authService, ICurrentUserService currentUserService, IAuditService auditService)
  {
    _authService = authService;
    _currentUserService = currentUserService;
    _auditService = auditService;
  }

  /// <summary>
  /// Register a new user
  /// </summary>
  [HttpPost("register")]
  [ProducesResponseType(typeof(ApiResponse<TokenResponseDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse<TokenResponseDto>), StatusCodes.Status400BadRequest)]
  public async Task<IActionResult> Register([FromBody] RegisterDto dto)
  {
    var result = await _authService.RegisterAsync(dto);
    return result.Success ? Ok(result) : BadRequest(result);
  }

  /// <summary>
  /// Login user
  /// </summary>
  [HttpPost("login")]
  [ProducesResponseType(typeof(ApiResponse<TokenResponseDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse<TokenResponseDto>), StatusCodes.Status400BadRequest)]
  public async Task<IActionResult> Login([FromBody] LoginDto dto)
  {
    var result = await _authService.LoginAsync(dto);

    // Fire-and-forget audit log for login
    _ = Task.Run(async () =>
    {
      try
      {
        if (result.Success)
        {
          await _auditService.LogSuccessAsync(
                  AuditActions.AuthLogin, "User", dto.Email ?? "",
                  actorId: null,
                  metadata: new { email = dto.Email, ip = HttpContext.Connection.RemoteIpAddress?.ToString() });
        }
        else
        {
          await _auditService.LogFailureAsync(
                  AuditActions.AuthLoginFailed, "User", dto.Email ?? "",
                  result.Message ?? "Login failed",
                  metadata: new { email = dto.Email, ip = HttpContext.Connection.RemoteIpAddress?.ToString() });
        }
      }
      catch { /* audit should never block login */ }
    });

    return result.Success ? Ok(result) : BadRequest(result);
  }

  /// <summary>
  /// Confirm email
  /// </summary>
  [HttpGet("confirm-email")]
  [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
  public async Task<IActionResult> ConfirmEmail([FromQuery] string email, [FromQuery] string token)
  {
    var result = await _authService.ConfirmEmailAsync(new ConfirmPasswordDto { Email = email, Token = token });
    return result.Success ? Ok(result) : BadRequest(result);
  }

  /// <summary>
  /// Forgot password - sends reset link
  /// </summary>
  [HttpPost("forgot-password")]
  [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
  public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
  {
    var result = await _authService.ForgotPasswordAsync(dto);
    return Ok(result);
  }

  /// <summary>
  /// Reset password with token
  /// </summary>
  [HttpPost("reset-password")]
  [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
  public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
  {
    var result = await _authService.ResetPasswordAsync(dto);
    return result.Success ? Ok(result) : BadRequest(result);
  }

  /// <summary>
  /// Change password (authenticated)
  /// </summary>
  [Authorize]
  [HttpPost("change-password")]
  [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
  public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
  {
    var userId = _currentUserService.UserId;
    if (string.IsNullOrEmpty(userId))
    {
      return Unauthorized(ApiResponse<bool>.FailureResponse("User not authenticated."));
    }

    var result = await _authService.ChangePasswordAsync(userId, dto);
    return result.Success ? Ok(result) : BadRequest(result);
  }

  /// <summary>
  /// Refresh access token
  /// </summary>
  [HttpPost("refresh-token")]
  [ProducesResponseType(typeof(ApiResponse<TokenResponseDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse<TokenResponseDto>), StatusCodes.Status400BadRequest)]
  public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto dto)
  {
    var result = await _authService.RefreshTokenAsync(dto);
    return result.Success ? Ok(result) : BadRequest(result);
  }

  /// <summary>
  /// Logout (invalidates refresh token)
  /// </summary>
  [Authorize]
  [HttpPost("logout")]
  [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
  public async Task<IActionResult> Logout()
  {
    var userId = _currentUserService.UserId;
    if (string.IsNullOrEmpty(userId))
    {
      return Unauthorized(ApiResponse<bool>.FailureResponse("User not authenticated."));
    }

    var result = await _authService.LogoutAsync(userId);
    return Ok(result);
  }
}
