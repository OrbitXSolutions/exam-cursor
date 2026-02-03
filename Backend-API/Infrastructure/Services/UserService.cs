using Mapster;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Auth;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Users;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;

namespace Smart_Core.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public UserService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<ApiResponse<PaginatedResponse<UserDto>>> GetUsersAsync(UserFilterDto filter)
    {
     var query = _userManager.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
  {
        var search = filter.Search.ToLower();
    query = query.Where(u => 
      u.Email!.ToLower().Contains(search) ||
      (u.DisplayName != null && u.DisplayName.ToLower().Contains(search)) ||
   (u.FullName != null && u.FullName.ToLower().Contains(search)));
        }

      if (filter.Status.HasValue)
     {
        query = query.Where(u => u.Status == filter.Status.Value);
  }

     if (filter.IsBlocked.HasValue)
     {
      query = query.Where(u => u.IsBlocked == filter.IsBlocked.Value);
  }

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderByDescending(u => u.CreatedDate)
       .Skip((filter.PageNumber - 1) * filter.PageSize)
     .Take(filter.PageSize)
  .ToListAsync();

  var userDtos = new List<UserDto>();
     foreach (var user in users)
   {
      var roles = await _userManager.GetRolesAsync(user);
   var userDto = user.Adapt<UserDto>();
   userDto.Roles = roles.ToList();
           userDto.Status = user.Status.ToString();
          userDtos.Add(userDto);
        }

        // Filter by role if specified (done after getting users due to Identity limitations)
        if (!string.IsNullOrWhiteSpace(filter.Role))
        {
      var usersInRole = await _userManager.GetUsersInRoleAsync(filter.Role);
            var userIdsInRole = usersInRole.Select(u => u.Id).ToHashSet();
       userDtos = userDtos.Where(u => userIdsInRole.Contains(u.Id)).ToList();
     }

  return ApiResponse<PaginatedResponse<UserDto>>.SuccessResponse(new PaginatedResponse<UserDto>
   {
     Items = userDtos,
          PageNumber = filter.PageNumber,
    PageSize = filter.PageSize,
            TotalCount = totalCount
      });
    }

    public async Task<ApiResponse<UserDetailDto>> GetUserByIdAsync(string userId)
    {
      var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
     {
    return ApiResponse<UserDetailDto>.FailureResponse("User not found.");
      }

        var roles = await _userManager.GetRolesAsync(user);
    var userDto = user.Adapt<UserDetailDto>();
        userDto.Roles = roles.ToList();
      userDto.Status = user.Status.ToString();

  return ApiResponse<UserDetailDto>.SuccessResponse(userDto);
    }

    public async Task<ApiResponse<UserDetailDto>> GetUserByEmailAsync(string email)
    {
    var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
          return ApiResponse<UserDetailDto>.FailureResponse("User not found.");
        }

        var roles = await _userManager.GetRolesAsync(user);
      var userDto = user.Adapt<UserDetailDto>();
     userDto.Roles = roles.ToList();
   userDto.Status = user.Status.ToString();

        return ApiResponse<UserDetailDto>.SuccessResponse(userDto);
    }

    public async Task<ApiResponse<List<UserDto>>> GetUsersByRoleAsync(string roleName)
    {
        var users = await _userManager.GetUsersInRoleAsync(roleName);
        var userDtos = users.Adapt<List<UserDto>>();
        
        foreach (var userDto in userDtos)
     {
       var user = users.First(u => u.Id == userDto.Id);
        var roles = await _userManager.GetRolesAsync(user);
       userDto.Roles = roles.ToList();
        userDto.Status = user.Status.ToString();
      }

     return ApiResponse<List<UserDto>>.SuccessResponse(userDtos);
    }

    public async Task<ApiResponse<UserDetailDto>> UpdateUserAsync(string userId, UpdateUserDto dto, string updatedBy)
    {
   var user = await _userManager.FindByIdAsync(userId);
  if (user == null)
        {
            return ApiResponse<UserDetailDto>.FailureResponse("User not found.");
      }

    // Protect SuperDev user
        if (user.Email?.Equals(ProtectedUsers.SuperDevEmail, StringComparison.OrdinalIgnoreCase) == true)
      {
        return ApiResponse<UserDetailDto>.FailureResponse("Cannot modify the SuperDev user.");
        }

        user.DisplayName = dto.DisplayName ?? user.DisplayName;
  user.FullName = dto.FullName ?? user.FullName;
        user.PhoneNumber = dto.PhoneNumber ?? user.PhoneNumber;
        user.UpdatedDate = DateTime.UtcNow;
        user.UpdatedBy = updatedBy;

      var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
  return ApiResponse<UserDetailDto>.FailureResponse(
       "Update failed.",
       result.Errors.Select(e => e.Description).ToList());
  }

        var roles = await _userManager.GetRolesAsync(user);
        var userDto = user.Adapt<UserDetailDto>();
 userDto.Roles = roles.ToList();
        userDto.Status = user.Status.ToString();

return ApiResponse<UserDetailDto>.SuccessResponse(userDto, "User updated successfully.");
    }

    public async Task<ApiResponse<bool>> BlockUserAsync(string userId, string blockedBy)
    {
  var user = await _userManager.FindByIdAsync(userId);
  if (user == null)
   {
            return ApiResponse<bool>.FailureResponse("User not found.");
        }

        // Protect SuperDev user
        if (user.Email?.Equals(ProtectedUsers.SuperDevEmail, StringComparison.OrdinalIgnoreCase) == true)
        {
     return ApiResponse<bool>.FailureResponse("Cannot block the SuperDev user.");
        }

   user.IsBlocked = true;
    user.UpdatedDate = DateTime.UtcNow;
   user.UpdatedBy = blockedBy;

        await _userManager.UpdateAsync(user);

      // Invalidate refresh token
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
   await _userManager.UpdateAsync(user);

return ApiResponse<bool>.SuccessResponse(true, "User blocked successfully.");
    }

public async Task<ApiResponse<bool>> UnblockUserAsync(string userId, string unblockedBy)
    {
   var user = await _userManager.FindByIdAsync(userId);
   if (user == null)
        {
       return ApiResponse<bool>.FailureResponse("User not found.");
 }

        user.IsBlocked = false;
     user.UpdatedDate = DateTime.UtcNow;
        user.UpdatedBy = unblockedBy;

    await _userManager.UpdateAsync(user);

        return ApiResponse<bool>.SuccessResponse(true, "User unblocked successfully.");
    }

 public async Task<ApiResponse<bool>> ActivateUserAsync(string userId, string activatedBy)
    {
  var user = await _userManager.FindByIdAsync(userId);
   if (user == null)
{
       return ApiResponse<bool>.FailureResponse("User not found.");
  }

    user.Status = UserStatus.Active;
        user.UpdatedDate = DateTime.UtcNow;
 user.UpdatedBy = activatedBy;

        await _userManager.UpdateAsync(user);

 return ApiResponse<bool>.SuccessResponse(true, "User activated successfully.");
    }

    public async Task<ApiResponse<bool>> DeactivateUserAsync(string userId, string deactivatedBy)
    {
        var user = await _userManager.FindByIdAsync(userId);
   if (user == null)
        {
    return ApiResponse<bool>.FailureResponse("User not found.");
 }

     // Protect SuperDev user
   if (user.Email?.Equals(ProtectedUsers.SuperDevEmail, StringComparison.OrdinalIgnoreCase) == true)
        {
   return ApiResponse<bool>.FailureResponse("Cannot deactivate the SuperDev user.");
        }

 user.Status = UserStatus.Inactive;
        user.UpdatedDate = DateTime.UtcNow;
        user.UpdatedBy = deactivatedBy;

      await _userManager.UpdateAsync(user);

        return ApiResponse<bool>.SuccessResponse(true, "User deactivated successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteUserAsync(string userId, string deletedBy)
    {
 var user = await _userManager.FindByIdAsync(userId);
   if (user == null)
        {
       return ApiResponse<bool>.FailureResponse("User not found.");
        }

  // Protect SuperDev user
    if (user.Email?.Equals(ProtectedUsers.SuperDevEmail, StringComparison.OrdinalIgnoreCase) == true)
        {
        return ApiResponse<bool>.FailureResponse("Cannot delete the SuperDev user.");
        }

     // Soft delete
   user.IsDeleted = true;
        user.DeletedBy = deletedBy;
        user.UpdatedDate = DateTime.UtcNow;

        await _userManager.UpdateAsync(user);

  return ApiResponse<bool>.SuccessResponse(true, "User deleted successfully.");
    }
}
