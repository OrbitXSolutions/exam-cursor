using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Department;

namespace Smart_Core.Application.Interfaces;

public interface IDepartmentService
{
 // Department CRUD
    Task<ApiResponse<DepartmentResponse>> CreateAsync(CreateDepartmentRequest request);
    Task<ApiResponse<DepartmentResponse>> GetByIdAsync(int id);
    Task<ApiResponse<List<DepartmentListResponse>>> GetAllAsync(bool includeInactive = false);
    Task<ApiResponse<DepartmentResponse>> UpdateAsync(int id, UpdateDepartmentRequest request);
    Task<ApiResponse<bool>> DeleteAsync(int id);
    Task<ApiResponse<bool>> ActivateAsync(int id);
    Task<ApiResponse<bool>> DeactivateAsync(int id);
    
    // User-Department Management
    Task<ApiResponse<bool>> AssignUserToDepartmentAsync(string userId, int departmentId);
    Task<ApiResponse<bool>> RemoveUserFromDepartmentAsync(string userId);
    Task<ApiResponse<List<UserDepartmentResponse>>> GetUsersByDepartmentAsync(int departmentId);
    Task<ApiResponse<UserDepartmentResponse>> GetUserDepartmentAsync(string userId);
    
    // Current User Department
Task<int?> GetCurrentUserDepartmentIdAsync();
    Task<bool> UserBelongsToDepartmentAsync(string userId, int departmentId);
}
