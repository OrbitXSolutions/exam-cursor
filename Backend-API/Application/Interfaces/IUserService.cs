using Smart_Core.Application.DTOs.Auth;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Users;

namespace Smart_Core.Application.Interfaces;

public interface IUserService
{
    Task<ApiResponse<PaginatedResponse<UserDto>>> GetUsersAsync(UserFilterDto filter);
    Task<ApiResponse<UserDetailDto>> GetUserByIdAsync(string userId);
    Task<ApiResponse<UserDetailDto>> GetUserByEmailAsync(string email);
    Task<ApiResponse<List<UserDto>>> GetUsersByRoleAsync(string roleName);
    Task<ApiResponse<UserDetailDto>> UpdateUserAsync(string userId, UpdateUserDto dto, string updatedBy);
    Task<ApiResponse<bool>> BlockUserAsync(string userId, string blockedBy);
    Task<ApiResponse<bool>> UnblockUserAsync(string userId, string unblockedBy);
    Task<ApiResponse<bool>> ActivateUserAsync(string userId, string activatedBy);
    Task<ApiResponse<bool>> DeactivateUserAsync(string userId, string deactivatedBy);
    Task<ApiResponse<bool>> DeleteUserAsync(string userId, string deletedBy);
}
