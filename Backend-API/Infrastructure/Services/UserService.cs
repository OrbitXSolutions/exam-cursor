using Mapster;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Auth;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Users;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Infrastructure.Data;
using Smart_Core.Domain.Common;
using Smart_Core.Infrastructure.Services.Authorization;

namespace Smart_Core.Infrastructure.Services;

public class UserService : IUserService
{
  private readonly UserManager<ApplicationUser> _userManager;
  private readonly ICacheService _cache;
  private readonly ApplicationDbContext _context;
  private readonly ResourceAuthorizationService _resourceAuthorization;

  public UserService(
    UserManager<ApplicationUser> userManager,
    ICacheService cache,
    ApplicationDbContext context,
    ResourceAuthorizationService resourceAuthorization)
  {
    _userManager = userManager;
    _cache = cache;
    _context = context;
    _resourceAuthorization = resourceAuthorization;
  }

  private void InvalidateUserCache()
  {
    _cache.RemoveByPrefix(CacheKeys.UsersPrefix);
    _cache.RemoveByPrefix(CacheKeys.DepartmentsPrefix);
    _cache.RemoveByPrefix(CacheKeys.RolesPrefix);
  }

  public async Task<ApiResponse<UserDetailDto>> CreateUserAsync(CreateUserDto dto, string createdBy)
  {
    var departmentId = dto.DepartmentId;

    // SuperAdmin role can only be assigned by another SuperAdmin; max 2 allowed system-wide
    if (dto.Role == AppRoles.SuperAdmin)
    {
      if (!await _resourceAuthorization.IsCurrentUserSuperAdminAsync())
        return ApiResponse<UserDetailDto>.FailureResponse("Only a SuperAdmin can create another SuperAdmin.");

      var existingSuperAdmins = await _userManager.GetUsersInRoleAsync(AppRoles.SuperAdmin);
      if (existingSuperAdmins.Count >= 2)
        return ApiResponse<UserDetailDto>.FailureResponse("System already has the maximum of 2 SuperAdmin accounts.");

      // SuperAdmin is not department-scoped
      departmentId = null;
    }
    else if (!await _resourceAuthorization.IsCurrentUserSuperAdminAsync())
    {
      var currentDepartmentId = await _resourceAuthorization.GetCurrentUserDepartmentIdAsync();
      if (!currentDepartmentId.HasValue)
        return ApiResponse<UserDetailDto>.FailureResponse("Department not found.");

      if (departmentId.HasValue && departmentId.Value != currentDepartmentId.Value)
        return ApiResponse<UserDetailDto>.FailureResponse("Department not found.");

      departmentId = currentDepartmentId.Value;
    }

    // Check if email already exists
    var existingUser = await _userManager.FindByEmailAsync(dto.Email);
    if (existingUser != null)
      return ApiResponse<UserDetailDto>.FailureResponse("A user with this email already exists.");

    // Validate role
    if (string.IsNullOrWhiteSpace(dto.Role) || !AppRoles.AllRoles.Contains(dto.Role))
      return ApiResponse<UserDetailDto>.FailureResponse($"Invalid role. Allowed roles: {string.Join(", ", AppRoles.AllRoles)}");

    var user = new ApplicationUser
    {
      UserName = dto.Email,
      Email = dto.Email,
      FullName = dto.FullName,
      FullNameAr = dto.FullNameAr,
      DisplayName = dto.FullName,
      DepartmentId = departmentId,
      EmailConfirmed = true,
      Status = UserStatus.Active,
      CreatedDate = UaeTimeHelper.NowUae,
      CreatedBy = createdBy
    };

    var result = await _userManager.CreateAsync(user, dto.Password);
    if (!result.Succeeded)
    {
      return ApiResponse<UserDetailDto>.FailureResponse(
        "Failed to create user.",
        result.Errors.Select(e => e.Description).ToList());
    }

    await _userManager.AddToRoleAsync(user, dto.Role);

    // Reload with department
    var created = await _userManager.Users.Include(u => u.Department).FirstOrDefaultAsync(u => u.Id == user.Id);
    var roles = await _userManager.GetRolesAsync(created!);
    var userDto = created!.Adapt<UserDetailDto>();
    userDto.Roles = roles.ToList();
    userDto.Status = created.Status.ToString();
    userDto.DepartmentId = created.DepartmentId;
    userDto.DepartmentNameEn = created.Department?.NameEn;
    userDto.DepartmentNameAr = created.Department?.NameAr;

    InvalidateUserCache();
    return ApiResponse<UserDetailDto>.SuccessResponse(userDto, "User created successfully.");
  }

  public async Task<ApiResponse<PaginatedResponse<UserDto>>> GetUsersAsync(UserFilterDto filter)
  {
    var scopeKey = await _resourceAuthorization.GetCurrentScopeCacheKeyAsync();
    var excludeKey = filter.ExcludeRoles != null && filter.ExcludeRoles.Count > 0
      ? string.Join(",", filter.ExcludeRoles.OrderBy(r => r).Select(r => r.ToLower()))
      : "";
    var cacheKey = $"{CacheKeys.UsersPrefix}{scopeKey}:{filter.Search?.ToLower() ?? ""}:{filter.Status}:{filter.IsBlocked}:{filter.DepartmentId}:{filter.Role?.ToLower() ?? ""}:{excludeKey}:{filter.PageNumber}:{filter.PageSize}";
    return await _cache.GetOrCreateAsync(cacheKey, async () =>
    {
      var query = _userManager.Users.Include(u => u.Department).AsQueryable();
      query = await _resourceAuthorization.ScopeUsersAsync(query);

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

      if (filter.DepartmentId.HasValue)
      {
        query = query.Where(u => u.DepartmentId == filter.DepartmentId.Value);
      }

      // Filter by role BEFORE pagination so counts and pages are accurate
      if (!string.IsNullOrWhiteSpace(filter.Role))
      {
        var userIdsInRole = await _cache.GetOrCreateAsync(
          CacheKeys.UsersInRole(filter.Role),
          async () =>
          {
            var usersInRole = await _userManager.GetUsersInRoleAsync(filter.Role);
            return usersInRole.Select(u => u.Id).ToHashSet();
          },
          CacheKeys.VeryLong);
        query = query.Where(u => userIdsInRole.Contains(u.Id));
      }

      // Exclude specific roles BEFORE pagination so counts are accurate
      if (filter.ExcludeRoles != null && filter.ExcludeRoles.Count > 0)
      {
        var excludedUserIds = new HashSet<string>();
        foreach (var excludeRole in filter.ExcludeRoles)
        {
          var usersInExcludeRole = await _userManager.GetUsersInRoleAsync(excludeRole);
          foreach (var u in usersInExcludeRole)
            excludedUserIds.Add(u.Id);
        }
        query = query.Where(u => !excludedUserIds.Contains(u.Id));
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
        userDto.DepartmentId = user.DepartmentId;
        userDto.DepartmentNameEn = user.Department?.NameEn;
        userDto.DepartmentNameAr = user.Department?.NameAr;
        userDtos.Add(userDto);
      }

      return ApiResponse<PaginatedResponse<UserDto>>.SuccessResponse(new PaginatedResponse<UserDto>
      {
        Items = userDtos,
        PageNumber = filter.PageNumber,
        PageSize = filter.PageSize,
        TotalCount = totalCount
      });
    }, CacheKeys.VeryLong);
  }

  public async Task<ApiResponse<PaginatedResponse<UserDto>>> GetStaffUsersAsync(StaffUserFilterDto filter)
  {
    var scopeKey = await _resourceAuthorization.GetCurrentScopeCacheKeyAsync();
    var cacheKey = $"{CacheKeys.UsersPrefix}staff:{scopeKey}:{filter.Search?.ToLower() ?? ""}:{filter.Status}:{filter.DepartmentId}:{filter.Role?.ToLower() ?? ""}:{filter.PageNumber}:{filter.PageSize}";
    return await _cache.GetOrCreateAsync(cacheKey, async () =>
    {
      // Excluded roles resolved via SQL subquery — Candidate excluded; SuperAdmin shown as read-only
      var excludedRoleNames = new[] { AppRoles.Candidate };
      var excludedUserIds = _context.Set<Microsoft.AspNetCore.Identity.IdentityUserRole<string>>()
        .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
        .Where(x => excludedRoleNames.Contains(x.Name))
        .Select(x => x.UserId);

      var query = _context.Users
        .Include(u => u.Department)
        .Where(u => !excludedUserIds.Contains(u.Id));
      query = await _resourceAuthorization.ScopeUsersAsync(query);

      if (!string.IsNullOrWhiteSpace(filter.Search))
      {
        var search = filter.Search.ToLower();
        query = query.Where(u =>
          u.Email!.ToLower().Contains(search) ||
          (u.DisplayName != null && u.DisplayName.ToLower().Contains(search)) ||
          (u.FullName != null && u.FullName.ToLower().Contains(search)));
      }

      if (filter.Status.HasValue)
        query = query.Where(u => u.Status == filter.Status.Value);

      if (filter.DepartmentId.HasValue)
        query = query.Where(u => u.DepartmentId == filter.DepartmentId.Value);

      // Role filter: resolve to user IDs via subquery
      if (!string.IsNullOrWhiteSpace(filter.Role))
      {
        var roleUserIds = _context.Set<Microsoft.AspNetCore.Identity.IdentityUserRole<string>>()
          .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
          .Where(x => x.Name == filter.Role)
          .Select(x => x.UserId);
        query = query.Where(u => roleUserIds.Contains(u.Id));
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
        userDto.DepartmentId = user.DepartmentId;
        userDto.DepartmentNameEn = user.Department?.NameEn;
        userDto.DepartmentNameAr = user.Department?.NameAr;
        userDto.IsProtected = user.Email == ProtectedUsers.SuperAdminEmail;
        userDtos.Add(userDto);
      }

      return ApiResponse<PaginatedResponse<UserDto>>.SuccessResponse(new PaginatedResponse<UserDto>
      {
        Items = userDtos,
        PageNumber = filter.PageNumber,
        PageSize = filter.PageSize,
        TotalCount = totalCount
      });
    }, CacheKeys.VeryLong);
  }

  public async Task<ApiResponse<UserDetailDto>> GetUserByIdAsync(string userId)
  {
    if (!await _resourceAuthorization.CanAccessUserAsync(userId))
    {
      return ApiResponse<UserDetailDto>.FailureResponse("User not found.");
    }

    var user = await _userManager.Users.Include(u => u.Department).FirstOrDefaultAsync(u => u.Id == userId);
    if (user == null)
    {
      return ApiResponse<UserDetailDto>.FailureResponse("User not found.");
    }

    var roles = await _userManager.GetRolesAsync(user);
    var userDto = user.Adapt<UserDetailDto>();
    userDto.Roles = roles.ToList();
    userDto.Status = user.Status.ToString();
    userDto.DepartmentId = user.DepartmentId;
    userDto.DepartmentNameEn = user.Department?.NameEn;
    userDto.DepartmentNameAr = user.Department?.NameAr;

    return ApiResponse<UserDetailDto>.SuccessResponse(userDto);
  }

  public async Task<ApiResponse<UserDetailDto>> GetUserByEmailAsync(string email)
  {
    var user = await _userManager.FindByEmailAsync(email);
    if (user == null)
    {
      return ApiResponse<UserDetailDto>.FailureResponse("User not found.");
    }

    if (!await _resourceAuthorization.CanAccessUserAsync(user.Id))
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
    var scopeKey = await _resourceAuthorization.GetCurrentScopeCacheKeyAsync();
    var cacheKey = $"{CacheKeys.UsersPrefix}byrole:{scopeKey}:{roleName.ToLower()}";
    return await _cache.GetOrCreateAsync(cacheKey, async () =>
    {
      var usersInRole = await _userManager.GetUsersInRoleAsync(roleName);
      var userIdsInRole = usersInRole.Select(u => u.Id).ToHashSet();
      var query = _userManager.Users
        .Where(u => userIdsInRole.Contains(u.Id))
        .AsQueryable();
      query = await _resourceAuthorization.ScopeUsersAsync(query);
      var users = await query.ToListAsync();
      var userDtos = users.Adapt<List<UserDto>>();

      foreach (var userDto in userDtos)
      {
        var user = users.First(u => u.Id == userDto.Id);
        var roles = await _userManager.GetRolesAsync(user);
        userDto.Roles = roles.ToList();
        userDto.Status = user.Status.ToString();
      }

      return ApiResponse<List<UserDto>>.SuccessResponse(userDtos);
    }, CacheKeys.VeryLong);
  }

  public async Task<ApiResponse<UserDetailDto>> UpdateUserAsync(string userId, UpdateUserDto dto, string updatedBy)
  {
    if (!await _resourceAuthorization.CanAccessUserAsync(userId))
    {
      return ApiResponse<UserDetailDto>.FailureResponse("User not found.");
    }

    var user = await _userManager.FindByIdAsync(userId);
    if (user == null)
    {
      return ApiResponse<UserDetailDto>.FailureResponse("User not found.");
    }

    // Protect SuperAdmin user
    if (user.Email?.Equals(ProtectedUsers.SuperAdminEmail, StringComparison.OrdinalIgnoreCase) == true)
    {
      return ApiResponse<UserDetailDto>.FailureResponse("Cannot modify the SuperAdmin user.");
    }

    user.DisplayName = dto.DisplayName ?? user.DisplayName;
    user.FullName = dto.FullName ?? user.FullName;
    user.PhoneNumber = dto.PhoneNumber ?? user.PhoneNumber;
    if (!await _resourceAuthorization.IsCurrentUserSuperAdminAsync())
    {
      var currentDepartmentId = await _resourceAuthorization.GetCurrentUserDepartmentIdAsync();
      if (!currentDepartmentId.HasValue)
        return ApiResponse<UserDetailDto>.FailureResponse("Department not found.");

      if (dto.ClearDepartment || (dto.DepartmentId.HasValue && dto.DepartmentId.Value != currentDepartmentId.Value))
        return ApiResponse<UserDetailDto>.FailureResponse("Department not found.");
    }

    if (dto.ClearDepartment)
      user.DepartmentId = null;
    else if (dto.DepartmentId.HasValue)
      user.DepartmentId = dto.DepartmentId.Value;
    user.UpdatedDate = UaeTimeHelper.NowUae;
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

    InvalidateUserCache();
    return ApiResponse<UserDetailDto>.SuccessResponse(userDto, "User updated successfully.");
  }

  public async Task<ApiResponse<bool>> BlockUserAsync(string userId, string blockedBy)
  {
    if (!await _resourceAuthorization.CanAccessUserAsync(userId))
    {
      return ApiResponse<bool>.FailureResponse("User not found.");
    }

    var user = await _userManager.FindByIdAsync(userId);
    if (user == null)
    {
      return ApiResponse<bool>.FailureResponse("User not found.");
    }

    // Protect SuperAdmin user
    if (user.Email?.Equals(ProtectedUsers.SuperAdminEmail, StringComparison.OrdinalIgnoreCase) == true)
    {
      return ApiResponse<bool>.FailureResponse("Cannot block the SuperAdmin user.");
    }

    user.IsBlocked = true;
    user.UpdatedDate = UaeTimeHelper.NowUae;
    user.UpdatedBy = blockedBy;

    await _userManager.UpdateAsync(user);

    // Invalidate refresh token
    user.RefreshToken = null;
    user.RefreshTokenExpiryTime = null;
    await _userManager.UpdateAsync(user);

    InvalidateUserCache();
    return ApiResponse<bool>.SuccessResponse(true, "User blocked successfully.");
  }

  public async Task<ApiResponse<bool>> UnblockUserAsync(string userId, string unblockedBy)
  {
    if (!await _resourceAuthorization.CanAccessUserAsync(userId))
    {
      return ApiResponse<bool>.FailureResponse("User not found.");
    }

    var user = await _userManager.FindByIdAsync(userId);
    if (user == null)
    {
      return ApiResponse<bool>.FailureResponse("User not found.");
    }

    user.IsBlocked = false;
    user.UpdatedDate = UaeTimeHelper.NowUae;
    user.UpdatedBy = unblockedBy;

    await _userManager.UpdateAsync(user);

    InvalidateUserCache();
    return ApiResponse<bool>.SuccessResponse(true, "User unblocked successfully.");
  }

  public async Task<ApiResponse<bool>> ActivateUserAsync(string userId, string activatedBy)
  {
    if (!await _resourceAuthorization.CanAccessUserAsync(userId))
    {
      return ApiResponse<bool>.FailureResponse("User not found.");
    }

    var user = await _userManager.FindByIdAsync(userId);
    if (user == null)
    {
      return ApiResponse<bool>.FailureResponse("User not found.");
    }

    user.Status = UserStatus.Active;
    user.UpdatedDate = UaeTimeHelper.NowUae;
    user.UpdatedBy = activatedBy;

    await _userManager.UpdateAsync(user);

    InvalidateUserCache();
    return ApiResponse<bool>.SuccessResponse(true, "User activated successfully.");
  }

  public async Task<ApiResponse<bool>> DeactivateUserAsync(string userId, string deactivatedBy)
  {
    if (!await _resourceAuthorization.CanAccessUserAsync(userId))
    {
      return ApiResponse<bool>.FailureResponse("User not found.");
    }

    var user = await _userManager.FindByIdAsync(userId);
    if (user == null)
    {
      return ApiResponse<bool>.FailureResponse("User not found.");
    }

    // Protect SuperAdmin user
    if (user.Email?.Equals(ProtectedUsers.SuperAdminEmail, StringComparison.OrdinalIgnoreCase) == true)
    {
      return ApiResponse<bool>.FailureResponse("Cannot deactivate the SuperAdmin user.");
    }

    user.Status = UserStatus.Inactive;
    user.UpdatedDate = UaeTimeHelper.NowUae;
    user.UpdatedBy = deactivatedBy;

    await _userManager.UpdateAsync(user);

    InvalidateUserCache();
    return ApiResponse<bool>.SuccessResponse(true, "User deactivated successfully.");
  }

  public async Task<ApiResponse<bool>> DeleteUserAsync(string userId, string deletedBy)
  {
    if (!await _resourceAuthorization.CanAccessUserAsync(userId))
    {
      return ApiResponse<bool>.FailureResponse("User not found.");
    }

    var user = await _userManager.FindByIdAsync(userId);
    if (user == null)
    {
      return ApiResponse<bool>.FailureResponse("User not found.");
    }

    // Protect SuperAdmin user
    if (user.Email?.Equals(ProtectedUsers.SuperAdminEmail, StringComparison.OrdinalIgnoreCase) == true)
    {
      return ApiResponse<bool>.FailureResponse("Cannot delete the SuperAdmin user.");
    }

    // Soft delete
    user.IsDeleted = true;
    user.DeletedBy = deletedBy;
    user.UpdatedDate = UaeTimeHelper.NowUae;

    await _userManager.UpdateAsync(user);

    InvalidateUserCache();
    return ApiResponse<bool>.SuccessResponse(true, "User deleted successfully.");
  }
}
