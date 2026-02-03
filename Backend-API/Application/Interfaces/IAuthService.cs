using Smart_Core.Application.DTOs.Auth;
using Smart_Core.Application.DTOs.Common;

namespace Smart_Core.Application.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<TokenResponseDto>> RegisterAsync(RegisterDto dto);
    Task<ApiResponse<TokenResponseDto>> LoginAsync(LoginDto dto);
    Task<ApiResponse<bool>> ConfirmEmailAsync(ConfirmPasswordDto dto);
    Task<ApiResponse<bool>> ForgotPasswordAsync(ForgotPasswordDto dto);
    Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordDto dto);
    Task<ApiResponse<bool>> ChangePasswordAsync(string userId, ChangePasswordDto dto);
    Task<ApiResponse<TokenResponseDto>> RefreshTokenAsync(RefreshTokenDto dto);
    Task<ApiResponse<bool>> LogoutAsync(string userId);
}
