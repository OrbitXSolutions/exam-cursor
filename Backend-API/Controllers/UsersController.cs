using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Auth;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Users;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ICurrentUserService _currentUserService;

    public UsersController(IUserService userService, ICurrentUserService currentUserService)
    {
    _userService = userService;
        _currentUserService = currentUserService;
    }

/// <summary>
    /// Get all users with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<UserDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers([FromQuery] UserFilterDto filter)
    {
   var result = await _userService.GetUsersAsync(filter);
        return Ok(result);
  }

    /// <summary>
    /// Get user by ID
    /// </summary>
[HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<UserDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<UserDetailDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserById(string id)
    {
        var result = await _userService.GetUserByIdAsync(id);
     return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get user by email
    /// </summary>
    [HttpGet("by-email/{email}")]
    [ProducesResponseType(typeof(ApiResponse<UserDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<UserDetailDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserByEmail(string email)
    {
  var result = await _userService.GetUserByEmailAsync(email);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get users by role
/// </summary>
    [HttpGet("by-role/{roleName}")]
    [ProducesResponseType(typeof(ApiResponse<List<UserDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsersByRole(string roleName)
    {
        var result = await _userService.GetUsersByRoleAsync(roleName);
        return Ok(result);
    }

    /// <summary>
    /// Update user
    /// </summary>
    [HttpPut("{id}")]
 [ProducesResponseType(typeof(ApiResponse<UserDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<UserDetailDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto dto)
    {
  var result = await _userService.UpdateUserAsync(id, dto, _currentUserService.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Block user
    /// </summary>
 [HttpPost("{id}/block")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BlockUser(string id)
    {
    var result = await _userService.BlockUserAsync(id, _currentUserService.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Unblock user
    /// </summary>
    [HttpPost("{id}/unblock")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UnblockUser(string id)
    {
    var result = await _userService.UnblockUserAsync(id, _currentUserService.UserId!);
      return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Activate user
    /// </summary>
    [HttpPost("{id}/activate")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ActivateUser(string id)
    {
        var result = await _userService.ActivateUserAsync(id, _currentUserService.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Deactivate user
    /// </summary>
    [HttpPost("{id}/deactivate")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeactivateUser(string id)
    {
   var result = await _userService.DeactivateUserAsync(id, _currentUserService.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
 /// Delete user (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = AppRoles.SuperDev)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteUser(string id)
    {
   var result = await _userService.DeleteUserAsync(id, _currentUserService.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
