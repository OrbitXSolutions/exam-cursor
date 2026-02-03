using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Department;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Entities;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services;

public class DepartmentService : IDepartmentService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<DepartmentService> _logger;

    public DepartmentService(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
      ICurrentUserService currentUserService,
        ILogger<DepartmentService> logger)
 {
        _context = context;
        _userManager = userManager;
        _currentUserService = currentUserService;
    _logger = logger;
    }

    public async Task<ApiResponse<DepartmentResponse>> CreateAsync(CreateDepartmentRequest request)
    {
        try
      {
            // Check for duplicate names
       var existingByNameEn = await _context.Departments
.AnyAsync(d => d.NameEn == request.NameEn);
     if (existingByNameEn)
 return ApiResponse<DepartmentResponse>.FailureResponse("A department with this English name already exists.");

var existingByNameAr = await _context.Departments
   .AnyAsync(d => d.NameAr == request.NameAr);
            if (existingByNameAr)
    return ApiResponse<DepartmentResponse>.FailureResponse("A department with this Arabic name already exists.");

            // Check for duplicate code if provided
            if (!string.IsNullOrWhiteSpace(request.Code))
      {
       var existingByCode = await _context.Departments
     .AnyAsync(d => d.Code == request.Code);
         if (existingByCode)
        return ApiResponse<DepartmentResponse>.FailureResponse("A department with this code already exists.");
            }

          var department = new Department
         {
    NameEn = request.NameEn,
        NameAr = request.NameAr,
      DescriptionEn = request.DescriptionEn,
    DescriptionAr = request.DescriptionAr,
         Code = request.Code,
        IsActive = request.IsActive,
        CreatedDate = DateTime.UtcNow,
  CreatedBy = _currentUserService.UserId
     };

            _context.Departments.Add(department);
await _context.SaveChangesAsync();

        _logger.LogInformation("Department created: {DepartmentId} - {NameEn}", department.Id, department.NameEn);

            return ApiResponse<DepartmentResponse>.SuccessResponse(MapToResponse(department, 0), "Department created successfully.");
        }
        catch (Exception ex)
      {
 _logger.LogError(ex, "Error creating department");
       return ApiResponse<DepartmentResponse>.FailureResponse("An error occurred while creating the department.");
      }
    }

  public async Task<ApiResponse<DepartmentResponse>> GetByIdAsync(int id)
    {
        var department = await _context.Departments
    .Include(d => d.Users)
          .FirstOrDefaultAsync(d => d.Id == id);

        if (department == null)
          return ApiResponse<DepartmentResponse>.FailureResponse("Department not found.");

  var userCount = department.Users?.Count(u => !u.IsDeleted) ?? 0;
        return ApiResponse<DepartmentResponse>.SuccessResponse(MapToResponse(department, userCount));
    }

    public async Task<ApiResponse<List<DepartmentListResponse>>> GetAllAsync(bool includeInactive = false)
    {
        var query = _context.Departments.AsQueryable();

        if (!includeInactive)
 query = query.Where(d => d.IsActive);

        var departments = await query
      .Select(d => new DepartmentListResponse(
       d.Id,
                d.NameEn,
       d.NameAr,
             d.Code,
       d.IsActive,
    d.Users.Count(u => !u.IsDeleted)
    ))
      .OrderBy(d => d.NameEn)
          .ToListAsync();

        return ApiResponse<List<DepartmentListResponse>>.SuccessResponse(departments);
    }

    public async Task<ApiResponse<DepartmentResponse>> UpdateAsync(int id, UpdateDepartmentRequest request)
    {
      try
        {
            var department = await _context.Departments
       .Include(d => d.Users)
                .FirstOrDefaultAsync(d => d.Id == id);

      if (department == null)
         return ApiResponse<DepartmentResponse>.FailureResponse("Department not found.");

            // Check for duplicate names (excluding current)
     var existingByNameEn = await _context.Departments
      .AnyAsync(d => d.NameEn == request.NameEn && d.Id != id);
   if (existingByNameEn)
 return ApiResponse<DepartmentResponse>.FailureResponse("A department with this English name already exists.");

            var existingByNameAr = await _context.Departments
       .AnyAsync(d => d.NameAr == request.NameAr && d.Id != id);
            if (existingByNameAr)
   return ApiResponse<DepartmentResponse>.FailureResponse("A department with this Arabic name already exists.");

        // Check for duplicate code if provided
      if (!string.IsNullOrWhiteSpace(request.Code))
         {
 var existingByCode = await _context.Departments
   .AnyAsync(d => d.Code == request.Code && d.Id != id);
     if (existingByCode)
 return ApiResponse<DepartmentResponse>.FailureResponse("A department with this code already exists.");
  }

     department.NameEn = request.NameEn;
department.NameAr = request.NameAr;
       department.DescriptionEn = request.DescriptionEn;
        department.DescriptionAr = request.DescriptionAr;
            department.Code = request.Code;
        department.IsActive = request.IsActive;
      department.UpdatedDate = DateTime.UtcNow;
            department.UpdatedBy = _currentUserService.UserId;

        await _context.SaveChangesAsync();

     _logger.LogInformation("Department updated: {DepartmentId}", id);

            var userCount = department.Users?.Count(u => !u.IsDeleted) ?? 0;
  return ApiResponse<DepartmentResponse>.SuccessResponse(MapToResponse(department, userCount), "Department updated successfully.");
        }
        catch (Exception ex)
        {
   _logger.LogError(ex, "Error updating department {DepartmentId}", id);
       return ApiResponse<DepartmentResponse>.FailureResponse("An error occurred while updating the department.");
        }
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
     try
        {
   var department = await _context.Departments
          .Include(d => d.Users)
       .FirstOrDefaultAsync(d => d.Id == id);

        if (department == null)
                return ApiResponse<bool>.FailureResponse("Department not found.");

       // Check if department has users
  var hasUsers = department.Users?.Any(u => !u.IsDeleted) ?? false;
     if (hasUsers)
   return ApiResponse<bool>.FailureResponse("Cannot delete department with assigned users. Please reassign users first.");

        // Soft delete
       department.IsDeleted = true;
department.DeletedBy = _currentUserService.UserId;
        department.UpdatedDate = DateTime.UtcNow;

 await _context.SaveChangesAsync();

            _logger.LogInformation("Department deleted: {DepartmentId}", id);

     return ApiResponse<bool>.SuccessResponse(true, "Department deleted successfully.");
     }
        catch (Exception ex)
        {
    _logger.LogError(ex, "Error deleting department {DepartmentId}", id);
            return ApiResponse<bool>.FailureResponse("An error occurred while deleting the department.");
        }
    }

    public async Task<ApiResponse<bool>> ActivateAsync(int id)
    {
    var department = await _context.Departments.FindAsync(id);
        if (department == null)
            return ApiResponse<bool>.FailureResponse("Department not found.");

        department.IsActive = true;
    department.UpdatedDate = DateTime.UtcNow;
        department.UpdatedBy = _currentUserService.UserId;

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Department activated successfully.");
    }

    public async Task<ApiResponse<bool>> DeactivateAsync(int id)
    {
        var department = await _context.Departments.FindAsync(id);
        if (department == null)
 return ApiResponse<bool>.FailureResponse("Department not found.");

        department.IsActive = false;
     department.UpdatedDate = DateTime.UtcNow;
        department.UpdatedBy = _currentUserService.UserId;

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Department deactivated successfully.");
 }

    public async Task<ApiResponse<bool>> AssignUserToDepartmentAsync(string userId, int departmentId)
    {
  try
    {
            var user = await _userManager.FindByIdAsync(userId);
  if (user == null)
        return ApiResponse<bool>.FailureResponse("User not found.");

    var department = await _context.Departments.FindAsync(departmentId);
     if (department == null)
      return ApiResponse<bool>.FailureResponse("Department not found.");

         if (!department.IsActive)
    return ApiResponse<bool>.FailureResponse("Cannot assign user to an inactive department.");

       user.DepartmentId = departmentId;
       user.UpdatedDate = DateTime.UtcNow;
    user.UpdatedBy = _currentUserService.UserId;

 await _userManager.UpdateAsync(user);

            _logger.LogInformation("User {UserId} assigned to department {DepartmentId}", userId, departmentId);

            return ApiResponse<bool>.SuccessResponse(true, "User assigned to department successfully.");
   }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning user {UserId} to department {DepartmentId}", userId, departmentId);
            return ApiResponse<bool>.FailureResponse("An error occurred while assigning user to department.");
  }
    }

    public async Task<ApiResponse<bool>> RemoveUserFromDepartmentAsync(string userId)
 {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
   return ApiResponse<bool>.FailureResponse("User not found.");

   user.DepartmentId = null;
            user.UpdatedDate = DateTime.UtcNow;
            user.UpdatedBy = _currentUserService.UserId;

            await _userManager.UpdateAsync(user);

     _logger.LogInformation("User {UserId} removed from department", userId);

            return ApiResponse<bool>.SuccessResponse(true, "User removed from department successfully.");
        }
 catch (Exception ex)
        {
        _logger.LogError(ex, "Error removing user {UserId} from department", userId);
            return ApiResponse<bool>.FailureResponse("An error occurred while removing user from department.");
}
    }

    public async Task<ApiResponse<List<UserDepartmentResponse>>> GetUsersByDepartmentAsync(int departmentId)
    {
        var users = await _context.Users
       .Where(u => u.DepartmentId == departmentId && !u.IsDeleted)
     .Select(u => new UserDepartmentResponse(
   u.Id,
          u.Email,
    u.FullName,
           u.DepartmentId,
             u.Department != null ? u.Department.NameEn : null,
         u.Department != null ? u.Department.NameAr : null
        ))
       .ToListAsync();

        return ApiResponse<List<UserDepartmentResponse>>.SuccessResponse(users);
    }

    public async Task<ApiResponse<UserDepartmentResponse>> GetUserDepartmentAsync(string userId)
    {
        var user = await _context.Users
 .Include(u => u.Department)
.FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

        if (user == null)
       return ApiResponse<UserDepartmentResponse>.FailureResponse("User not found.");

      var response = new UserDepartmentResponse(
        user.Id,
            user.Email,
   user.FullName,
   user.DepartmentId,
      user.Department?.NameEn,
            user.Department?.NameAr
        );

        return ApiResponse<UserDepartmentResponse>.SuccessResponse(response);
    }

    public async Task<int?> GetCurrentUserDepartmentIdAsync()
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId))
    return null;

        var user = await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => u.DepartmentId)
   .FirstOrDefaultAsync();

        return user;
    }

    public async Task<bool> UserBelongsToDepartmentAsync(string userId, int departmentId)
    {
        return await _context.Users
  .AnyAsync(u => u.Id == userId && u.DepartmentId == departmentId && !u.IsDeleted);
    }

    private static DepartmentResponse MapToResponse(Department department, int userCount)
    {
  return new DepartmentResponse(
            department.Id,
     department.NameEn,
      department.NameAr,
department.DescriptionEn,
            department.DescriptionAr,
            department.Code,
   department.IsActive,
       userCount,
      department.CreatedDate,
            department.CreatedBy
        );
    }
}
