using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Roles;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;
    private readonly ICurrentUserService _currentUserService;

    public RolesController(IRoleService roleService, ICurrentUserService currentUserService)
    {
  _roleService = roleService;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Get all roles
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<RoleDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllRoles()
    {
     var result = await _roleService.GetAllRolesAsync();
    return Ok(result);
    }

    /// <summary>
    /// Get role by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<RoleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<RoleDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRoleById(string id)
    {
        var result = await _roleService.GetRoleByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

  /// <summary>
    /// Create a new role
    /// </summary>
    [HttpPost]
    [Authorize(Roles = AppRoles.SuperDev)]
    [ProducesResponseType(typeof(ApiResponse<RoleDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<RoleDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleDto dto)
    {
        var result = await _roleService.CreateRoleAsync(dto, _currentUserService.UserId!);
    return result.Success 
    ? CreatedAtAction(nameof(GetRoleById), new { id = result.Data!.Id }, result) 
         : BadRequest(result);
    }

    /// <summary>
    /// Update a role
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = AppRoles.SuperDev)]
  [ProducesResponseType(typeof(ApiResponse<RoleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<RoleDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateRole(string id, [FromBody] UpdateRoleDto dto)
    {
        var result = await _roleService.UpdateRoleAsync(id, dto, _currentUserService.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

  /// <summary>
    /// Delete a role
    /// </summary>
  [HttpDelete("{id}")]
    [Authorize(Roles = AppRoles.SuperDev)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteRole(string id)
    {
        var result = await _roleService.DeleteRoleAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Add user to role
    /// </summary>
    [HttpPost("add-user")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddUserToRole([FromBody] UserRoleDto dto)
    {
        var result = await _roleService.AddUserToRoleAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Remove user from role
    /// </summary>
    [HttpPost("remove-user")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RemoveUserFromRole([FromBody] UserRoleDto dto)
    {
      var result = await _roleService.RemoveUserFromRoleAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
 }

    /// <summary>
/// Get users in a specific role
    /// </summary>
    [HttpGet("{roleName}/users")]
    [ProducesResponseType(typeof(ApiResponse<UsersInRoleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<UsersInRoleDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUsersInRole(string roleName)
    {
        var result = await _roleService.GetUsersInRoleAsync(roleName);
        return result.Success ? Ok(result) : NotFound(result);
    }
}
