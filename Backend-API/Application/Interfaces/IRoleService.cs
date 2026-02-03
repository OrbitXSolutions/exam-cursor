using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Roles;

namespace Smart_Core.Application.Interfaces;

public interface IRoleService
{
    Task<ApiResponse<List<RoleDto>>> GetAllRolesAsync();
    Task<ApiResponse<RoleDto>> GetRoleByIdAsync(string roleId);
    Task<ApiResponse<RoleDto>> CreateRoleAsync(CreateRoleDto dto, string createdBy);
    Task<ApiResponse<RoleDto>> UpdateRoleAsync(string roleId, UpdateRoleDto dto, string updatedBy);
    Task<ApiResponse<bool>> DeleteRoleAsync(string roleId);
    Task<ApiResponse<bool>> AddUserToRoleAsync(UserRoleDto dto);
    Task<ApiResponse<bool>> RemoveUserFromRoleAsync(UserRoleDto dto);
    Task<ApiResponse<UsersInRoleDto>> GetUsersInRoleAsync(string roleName);
}
