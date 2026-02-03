using Mapster;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Smart_Core.Application.DTOs.Auth;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Users;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;

namespace Smart_Core.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ITokenService _tokenService;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
  ITokenService tokenService,
   IEmailService emailService,
   IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
   _emailService = emailService;
        _configuration = configuration;
    }

    public async Task<ApiResponse<TokenResponseDto>> RegisterAsync(RegisterDto dto)
    {
     var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
   {
   return ApiResponse<TokenResponseDto>.FailureResponse("User with this email already exists.");
        }

        var user = new ApplicationUser
   {
    UserName = dto.Email,
          Email = dto.Email,
           DisplayName = dto.DisplayName,
 FullName = dto.FullName,
      CreatedDate = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
   if (!result.Succeeded)
        {
      return ApiResponse<TokenResponseDto>.FailureResponse(
   "Registration failed.",
          result.Errors.Select(e => e.Description).ToList());
  }

   // Assign default role
  await _userManager.AddToRoleAsync(user, AppRoles.Candidate);

        // Generate email confirmation token
        var emailToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var confirmationLink = $"{_configuration["AppSettings:BaseUrl"]}/api/auth/confirm-email?email={Uri.EscapeDataString(user.Email!)}&token={Uri.EscapeDataString(emailToken)}";
        
        await _emailService.SendEmailConfirmationAsync(user.Email!, confirmationLink);

        var roles = await _userManager.GetRolesAsync(user);
    var accessToken = _tokenService.GenerateAccessToken(user, roles);
      var refreshToken = _tokenService.GenerateRefreshToken();

user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddHours(
     double.Parse(_configuration["JwtSettings:RefreshTokenExpirationHours"] ?? "20"));
 await _userManager.UpdateAsync(user);

    return ApiResponse<TokenResponseDto>.SuccessResponse(new TokenResponseDto
        {
         AccessToken = accessToken,
     RefreshToken = refreshToken,
     Expiration = DateTime.UtcNow.AddHours(
       double.Parse(_configuration["JwtSettings:AccessTokenExpirationHours"] ?? "1")),
            User = user.Adapt<UserDto>()
        }, "Registration successful. Please check your email to confirm your account.");
    }

    public async Task<ApiResponse<TokenResponseDto>> LoginAsync(LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
      if (user == null)
        {
   return ApiResponse<TokenResponseDto>.FailureResponse("Invalid email or password.");
 }

    if (user.IsBlocked)
      {
 return ApiResponse<TokenResponseDto>.FailureResponse("Your account has been blocked. Please contact support.");
    }

        if (user.Status == UserStatus.Inactive)
        {
   return ApiResponse<TokenResponseDto>.FailureResponse("Your account is inactive.");
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: true);
        if (!result.Succeeded)
    {
            if (result.IsLockedOut)
  {
     return ApiResponse<TokenResponseDto>.FailureResponse("Account locked out. Please try again later.");
        }
     return ApiResponse<TokenResponseDto>.FailureResponse("Invalid email or password.");
    }

        var roles = await _userManager.GetRolesAsync(user);
      var accessToken = _tokenService.GenerateAccessToken(user, roles);
        var refreshToken = _tokenService.GenerateRefreshToken();

      user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddHours(
            double.Parse(_configuration["JwtSettings:RefreshTokenExpirationHours"] ?? "20"));
        await _userManager.UpdateAsync(user);

var userDto = user.Adapt<UserDto>();
        userDto.Roles = roles.ToList();

   return ApiResponse<TokenResponseDto>.SuccessResponse(new TokenResponseDto
        {
       AccessToken = accessToken,
        RefreshToken = refreshToken,
     Expiration = DateTime.UtcNow.AddHours(
           double.Parse(_configuration["JwtSettings:AccessTokenExpirationHours"] ?? "1")),
       User = userDto
        }, "Login successful.");
    }

    public async Task<ApiResponse<bool>> ConfirmEmailAsync(ConfirmPasswordDto dto)
{
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
   {
         return ApiResponse<bool>.FailureResponse("User not found.");
        }

        var result = await _userManager.ConfirmEmailAsync(user, dto.Token);
      if (!result.Succeeded)
     {
return ApiResponse<bool>.FailureResponse(
   "Email confirmation failed.",
        result.Errors.Select(e => e.Description).ToList());
        }

        return ApiResponse<bool>.SuccessResponse(true, "Email confirmed successfully.");
  }

    public async Task<ApiResponse<bool>> ForgotPasswordAsync(ForgotPasswordDto dto)
    {
     var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
      {
            // Don't reveal that the user doesn't exist
   return ApiResponse<bool>.SuccessResponse(true, "If your email is registered, you will receive a password reset link.");
        }

      var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var resetLink = $"{_configuration["AppSettings:BaseUrl"]}/reset-password?email={Uri.EscapeDataString(dto.Email)}&token={Uri.EscapeDataString(token)}";

      await _emailService.SendPasswordResetEmailAsync(user.Email!, resetLink);

        return ApiResponse<bool>.SuccessResponse(true, "If your email is registered, you will receive a password reset link.");
    }

    public async Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
        {
     return ApiResponse<bool>.FailureResponse("Invalid request.");
        }

        var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);
        if (!result.Succeeded)
   {
   return ApiResponse<bool>.FailureResponse(
                "Password reset failed.",
 result.Errors.Select(e => e.Description).ToList());
      }

        // Invalidate refresh token
  user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        await _userManager.UpdateAsync(user);

      return ApiResponse<bool>.SuccessResponse(true, "Password reset successfully.");
    }

    public async Task<ApiResponse<bool>> ChangePasswordAsync(string userId, ChangePasswordDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
  return ApiResponse<bool>.FailureResponse("User not found.");
        }

        var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded)
        {
          return ApiResponse<bool>.FailureResponse(
 "Password change failed.",
   result.Errors.Select(e => e.Description).ToList());
        }

        return ApiResponse<bool>.SuccessResponse(true, "Password changed successfully.");
    }

    public async Task<ApiResponse<TokenResponseDto>> RefreshTokenAsync(RefreshTokenDto dto)
    {
        var (userId, _) = await _tokenService.ValidateAccessTokenAsync(dto.AccessToken);
  if (userId == null)
        {
    return ApiResponse<TokenResponseDto>.FailureResponse("Invalid access token.");
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null || user.RefreshToken != dto.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
   {
            return ApiResponse<TokenResponseDto>.FailureResponse("Invalid or expired refresh token.");
        }

     var roles = await _userManager.GetRolesAsync(user);
        var newAccessToken = _tokenService.GenerateAccessToken(user, roles);
    var newRefreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddHours(
        double.Parse(_configuration["JwtSettings:RefreshTokenExpirationHours"] ?? "20"));
 await _userManager.UpdateAsync(user);

        var userDto = user.Adapt<UserDto>();
        userDto.Roles = roles.ToList();

  return ApiResponse<TokenResponseDto>.SuccessResponse(new TokenResponseDto
    {
            AccessToken = newAccessToken,
     RefreshToken = newRefreshToken,
     Expiration = DateTime.UtcNow.AddHours(
   double.Parse(_configuration["JwtSettings:AccessTokenExpirationHours"] ?? "1")),
     User = userDto
        }, "Token refreshed successfully.");
    }

    public async Task<ApiResponse<bool>> LogoutAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
      {
            return ApiResponse<bool>.FailureResponse("User not found.");
        }

        user.RefreshToken = null;
     user.RefreshTokenExpiryTime = null;
        await _userManager.UpdateAsync(user);

        return ApiResponse<bool>.SuccessResponse(true, "Logged out successfully.");
    }
}
