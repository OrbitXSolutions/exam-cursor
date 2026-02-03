using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Department;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly IDepartmentService _departmentService;

    public DepartmentsController(IDepartmentService departmentService)
 {
        _departmentService = departmentService;
    }

    /// <summary>
    /// Get all departments
    /// </summary>
[HttpGet]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
    {
        var result = await _departmentService.GetAllAsync(includeInactive);
      return result.Success ? Ok(result) : BadRequest(result);
    }

  /// <summary>
    /// Get department by ID
    /// </summary>
 [HttpGet("{id}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _departmentService.GetByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

 /// <summary>
    /// Create a new department
    /// </summary>
    [HttpPost]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
    public async Task<IActionResult> Create([FromBody] CreateDepartmentRequest request)
 {
        var result = await _departmentService.CreateAsync(request);
        return result.Success 
   ? CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result)
        : BadRequest(result);
    }

    /// <summary>
    /// Update a department
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDepartmentRequest request)
{
 var result = await _departmentService.UpdateAsync(id, request);
  return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete a department
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = AppRoles.SuperDev)]
    public async Task<IActionResult> Delete(int id)
    {
  var result = await _departmentService.DeleteAsync(id);
  return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Activate a department
    /// </summary>
    [HttpPost("{id}/activate")]
 [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
    public async Task<IActionResult> Activate(int id)
    {
     var result = await _departmentService.ActivateAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
  }

    /// <summary>
    /// Deactivate a department
    /// </summary>
    [HttpPost("{id}/deactivate")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
  public async Task<IActionResult> Deactivate(int id)
  {
        var result = await _departmentService.DeactivateAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Assign a user to a department
 /// </summary>
    [HttpPost("assign-user")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
    public async Task<IActionResult> AssignUser([FromBody] AssignUserToDepartmentRequest request)
    {
        var result = await _departmentService.AssignUserToDepartmentAsync(request.UserId, request.DepartmentId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Remove a user from their department
    /// </summary>
    [HttpPost("remove-user/{userId}")]
 [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
    public async Task<IActionResult> RemoveUser(string userId)
    {
        var result = await _departmentService.RemoveUserFromDepartmentAsync(userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get all users in a department
    /// </summary>
[HttpGet("{id}/users")]
 [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
    public async Task<IActionResult> GetDepartmentUsers(int id)
{
        var result = await _departmentService.GetUsersByDepartmentAsync(id);
      return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get a user's department info
    /// </summary>
    [HttpGet("user/{userId}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
    public async Task<IActionResult> GetUserDepartment(string userId)
    {
        var result = await _departmentService.GetUserDepartmentAsync(userId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get current user's department
    /// </summary>
    [HttpGet("my-department")]
    public async Task<IActionResult> GetMyDepartment()
    {
        var result = await _departmentService.GetUserDepartmentAsync(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "");
   return result.Success ? Ok(result) : NotFound(result);
    }
}
