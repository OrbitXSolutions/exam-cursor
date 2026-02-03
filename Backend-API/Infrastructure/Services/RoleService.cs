using Mapster;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Roles;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;

namespace Smart_Core.Infrastructure.Services;

public class RoleService : IRoleService
{
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly UserManager<ApplicationUser> _userManager;

    public RoleService(
        RoleManager<ApplicationRole> roleManager,
     UserManager<ApplicationUser> userManager)
{
   _roleManager = roleManager;
        _userManager = userManager;
    }

    public async Task<ApiResponse<List<RoleDto>>> GetAllRolesAsync()
    {
   var roles = await _roleManager.Roles.ToListAsync();
   var roleDtos = new List<RoleDto>();

   foreach (var role in roles)
     {
       var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name!);
    roleDtos.Add(new RoleDto
    {
  Id = role.Id,
                Name = role.Name!,
    Description = role.Description,
            CreatedDate = role.CreatedDate,
   UserCount = usersInRole.Count
            });
      }

   return ApiResponse<List<RoleDto>>.SuccessResponse(roleDtos);
    }

 public async Task<ApiResponse<RoleDto>> GetRoleByIdAsync(string roleId)
    {
        var role = await _roleManager.FindByIdAsync(roleId);
    if (role == null)
        {
        return ApiResponse<RoleDto>.FailureResponse("Role not found.");
       }

  var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name!);

  return ApiResponse<RoleDto>.SuccessResponse(new RoleDto
        {
    Id = role.Id,
        Name = role.Name!,
  Description = role.Description,
    CreatedDate = role.CreatedDate,
      UserCount = usersInRole.Count
        });
    }

    public async Task<ApiResponse<RoleDto>> CreateRoleAsync(CreateRoleDto dto, string createdBy)
    {
   var existingRole = await _roleManager.FindByNameAsync(dto.Name);
  if (existingRole != null)
     {
     return ApiResponse<RoleDto>.FailureResponse("Role already exists.");
     }

   var role = new ApplicationRole
   {
       Name = dto.Name,
       Description = dto.Description,
      CreatedDate = DateTime.UtcNow,
     CreatedBy = createdBy
        };

        var result = await _roleManager.CreateAsync(role);
  if (!result.Succeeded)
     {
 return ApiResponse<RoleDto>.FailureResponse(
    "Role creation failed.",
     result.Errors.Select(e => e.Description).ToList());
   }

     return ApiResponse<RoleDto>.SuccessResponse(new RoleDto
    {
        Id = role.Id,
 Name = role.Name!,
       Description = role.Description,
     CreatedDate = role.CreatedDate,
            UserCount = 0
        }, "Role created successfully.");
    }

    public async Task<ApiResponse<RoleDto>> UpdateRoleAsync(string roleId, UpdateRoleDto dto, string updatedBy)
    {
        var role = await _roleManager.FindByIdAsync(roleId);
       if (role == null)
      {
return ApiResponse<RoleDto>.FailureResponse("Role not found.");
        }

     // Protect system roles
        if (AppRoles.AllRoles.Contains(role.Name!, StringComparer.OrdinalIgnoreCase))
      {
return ApiResponse<RoleDto>.FailureResponse("Cannot modify system roles.");
     }

  role.Name = dto.Name;
     role.Description = dto.Description;
 role.UpdatedDate = DateTime.UtcNow;
        role.UpdatedBy = updatedBy;

        var result = await _roleManager.UpdateAsync(role);
        if (!result.Succeeded)
        {
         return ApiResponse<RoleDto>.FailureResponse(
          "Role update failed.",
      result.Errors.Select(e => e.Description).ToList());
        }

     var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name!);

    return ApiResponse<RoleDto>.SuccessResponse(new RoleDto
   {
         Id = role.Id,
     Name = role.Name!,
 Description = role.Description,
         CreatedDate = role.CreatedDate,
  UserCount = usersInRole.Count
    }, "Role updated successfully.");
    }

  public async Task<ApiResponse<bool>> DeleteRoleAsync(string roleId)
    {
        var role = await _roleManager.FindByIdAsync(roleId);
   if (role == null)
        {
return ApiResponse<bool>.FailureResponse("Role not found.");
        }

     // Protect system roles
      if (AppRoles.AllRoles.Contains(role.Name!, StringComparer.OrdinalIgnoreCase))
     {
    return ApiResponse<bool>.FailureResponse("Cannot delete system roles.");
  }

  var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name!);
        if (usersInRole.Any())
        {
      return ApiResponse<bool>.FailureResponse("Cannot delete role with assigned users. Remove users first.");
      }

   var result = await _roleManager.DeleteAsync(role);
    if (!result.Succeeded)
        {
     return ApiResponse<bool>.FailureResponse(
     "Role deletion failed.",
    result.Errors.Select(e => e.Description).ToList());
        }

 return ApiResponse<bool>.SuccessResponse(true, "Role deleted successfully.");
  }

    public async Task<ApiResponse<bool>> AddUserToRoleAsync(UserRoleDto dto)
    {
 var user = await _userManager.FindByIdAsync(dto.UserId);
        if (user == null)
        {
  return ApiResponse<bool>.FailureResponse("User not found.");
        }

        var roleExists = await _roleManager.RoleExistsAsync(dto.RoleName);
   if (!roleExists)
      {
        return ApiResponse<bool>.FailureResponse("Role not found.");
  }

        var isInRole = await _userManager.IsInRoleAsync(user, dto.RoleName);
      if (isInRole)
        {
return ApiResponse<bool>.FailureResponse("User is already in this role.");
        }

        var result = await _userManager.AddToRoleAsync(user, dto.RoleName);
  if (!result.Succeeded)
        {
          return ApiResponse<bool>.FailureResponse(
                "Failed to add user to role.",
      result.Errors.Select(e => e.Description).ToList());
        }

        return ApiResponse<bool>.SuccessResponse(true, "User added to role successfully.");
  }

public async Task<ApiResponse<bool>> RemoveUserFromRoleAsync(UserRoleDto dto)
    {
   var user = await _userManager.FindByIdAsync(dto.UserId);
   if (user == null)
        {
         return ApiResponse<bool>.FailureResponse("User not found.");
   }

   // Protect SuperDev user from being removed from SuperDev role
        if (user.Email?.Equals(ProtectedUsers.SuperDevEmail, StringComparison.OrdinalIgnoreCase) == true 
            && dto.RoleName.Equals(AppRoles.SuperDev, StringComparison.OrdinalIgnoreCase))
        {
      return ApiResponse<bool>.FailureResponse("Cannot remove SuperDev user from SuperDev role.");
   }

        var isInRole = await _userManager.IsInRoleAsync(user, dto.RoleName);
      if (!isInRole)
        {
    return ApiResponse<bool>.FailureResponse("User is not in this role.");
        }

   var result = await _userManager.RemoveFromRoleAsync(user, dto.RoleName);
     if (!result.Succeeded)
   {
    return ApiResponse<bool>.FailureResponse(
     "Failed to remove user from role.",
   result.Errors.Select(e => e.Description).ToList());
  }

        return ApiResponse<bool>.SuccessResponse(true, "User removed from role successfully.");
    }

    public async Task<ApiResponse<UsersInRoleDto>> GetUsersInRoleAsync(string roleName)
 {
        var role = await _roleManager.FindByNameAsync(roleName);
   if (role == null)
  {
     return ApiResponse<UsersInRoleDto>.FailureResponse("Role not found.");
     }

        var users = await _userManager.GetUsersInRoleAsync(roleName);

    return ApiResponse<UsersInRoleDto>.SuccessResponse(new UsersInRoleDto
     {
      RoleId = role.Id,
   RoleName = role.Name!,
            Users = users.Select(u => new RoleUserDto
       {
             Id = u.Id,
    Email = u.Email!,
                DisplayName = u.DisplayName,
    FullName = u.FullName
   }).ToList()
});
    }
}
