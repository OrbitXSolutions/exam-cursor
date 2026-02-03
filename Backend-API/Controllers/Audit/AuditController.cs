using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Audit;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Audit;

namespace Smart_Core.Controllers.Audit;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,SuperAdmin,Auditor")]
public class AuditController : ControllerBase
{
    private readonly IAuditService _auditService;
    private readonly ICurrentUserService _currentUserService;

    public AuditController(
        IAuditService auditService,
    ICurrentUserService currentUserService)
 {
 _auditService = auditService;
        _currentUserService = currentUserService;
    }

    #region Audit Log Queries

    /// <summary>
    /// Get audit log by ID
  /// </summary>
    [HttpGet("log/{logId}")]
    public async Task<IActionResult> GetLog(long logId)
    {
        var result = await _auditService.GetLogAsync(logId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Search audit logs
    /// </summary>
    [HttpGet("logs")]
    public async Task<IActionResult> SearchLogs([FromQuery] AuditLogSearchDto searchDto)
    {
        var result = await _auditService.SearchLogsAsync(searchDto);
    return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get entity history (all changes to a specific entity)
    /// </summary>
 [HttpGet("entity-history")]
    public async Task<IActionResult> GetEntityHistory([FromQuery] EntityHistoryRequestDto request)
    {
        var result = await _auditService.GetEntityHistoryAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get user activity (all actions by a specific user)
    /// </summary>
    [HttpGet("user-activity")]
    public async Task<IActionResult> GetUserActivity([FromQuery] UserActivityRequestDto request)
    {
   var result = await _auditService.GetUserActivityAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get logs by correlation ID (request tracing)
    /// </summary>
 [HttpGet("correlation/{correlationId}")]
    public async Task<IActionResult> GetByCorrelationId(string correlationId)
    {
        var result = await _auditService.GetByCorrelationIdAsync(correlationId);
        return result.Success ? Ok(result) : BadRequest(result);
  }

    /// <summary>
    /// Get recent failures
  /// </summary>
    [HttpGet("failures")]
    public async Task<IActionResult> GetRecentFailures([FromQuery] int count = 50)
    {
        var result = await _auditService.GetRecentFailuresAsync(count);
    return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Retention Policies

    /// <summary>
    /// Get all retention policies
    /// </summary>
    [HttpGet("policies")]
    public async Task<IActionResult> GetRetentionPolicies()
    {
        var result = await _auditService.GetRetentionPoliciesAsync();
        return result.Success ? Ok(result) : BadRequest(result);
  }

    /// <summary>
    /// Get retention policy by ID
    /// </summary>
    [HttpGet("policy/{policyId}")]
    public async Task<IActionResult> GetRetentionPolicy(int policyId)
    {
  var result = await _auditService.GetRetentionPolicyAsync(policyId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Create retention policy
    /// </summary>
    [HttpPost("policy")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> CreateRetentionPolicy([FromBody] CreateRetentionPolicyDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _auditService.CreateRetentionPolicyAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update retention policy
    /// </summary>
    [HttpPut("policy")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> UpdateRetentionPolicy([FromBody] UpdateRetentionPolicyDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _auditService.UpdateRetentionPolicyAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete retention policy
    /// </summary>
    [HttpDelete("policy/{policyId}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> DeleteRetentionPolicy(int policyId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _auditService.DeleteRetentionPolicyAsync(policyId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Set default retention policy
    /// </summary>
    [HttpPost("policy/{policyId}/set-default")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> SetDefaultPolicy(int policyId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _auditService.SetDefaultPolicyAsync(policyId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Execute retention policies manually
    /// </summary>
    [HttpPost("policies/execute")]
    [Authorize(Roles = "Admin,SuperAdmin")]
public async Task<IActionResult> ExecuteRetention()
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _auditService.ExecuteRetentionAsync(userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Preview retention policy execution
    /// </summary>
    [HttpGet("policy/{policyId}/preview")]
    public async Task<IActionResult> PreviewRetention(int policyId)
    {
    var result = await _auditService.PreviewRetentionAsync(policyId);
     return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Export Jobs

  /// <summary>
    /// Create export job
    /// </summary>
    [HttpPost("export")]
    public async Task<IActionResult> CreateExportJob([FromBody] CreateExportJobDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
    var result = await _auditService.CreateExportJobAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
  }

    /// <summary>
    /// Get export job by ID
    /// </summary>
    [HttpGet("export/{jobId}")]
 public async Task<IActionResult> GetExportJob(int jobId)
    {
  var result = await _auditService.GetExportJobAsync(jobId);
     return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get all export jobs
    /// </summary>
    [HttpGet("exports")]
    public async Task<IActionResult> GetExportJobs([FromQuery] ExportJobSearchDto searchDto)
    {
        var result = await _auditService.GetExportJobsAsync(searchDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get my export jobs
    /// </summary>
    [HttpGet("exports/my")]
    public async Task<IActionResult> GetMyExportJobs()
    {
     var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId))
  {
            return Unauthorized();
   }
        var result = await _auditService.GetMyExportJobsAsync(userId);
        return result.Success ? Ok(result) : BadRequest(result);
 }

    /// <summary>
  /// Cancel export job
    /// </summary>
    [HttpPost("export/{jobId}/cancel")]
    public async Task<IActionResult> CancelExportJob(int jobId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _auditService.CancelExportJobAsync(jobId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get download URL for completed export
    /// </summary>
    [HttpGet("export/{jobId}/download")]
    public async Task<IActionResult> GetExportDownloadUrl(int jobId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _auditService.GetExportDownloadUrlAsync(jobId, userId);
   return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Dashboard

    /// <summary>
    /// Get audit dashboard statistics
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var result = await _auditService.GetDashboardAsync(fromDate, toDate);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get audit statistics for a specific entity type
 /// </summary>
    [HttpGet("dashboard/entity/{entityName}")]
    public async Task<IActionResult> GetEntityDashboard(string entityName)
    {
    var result = await _auditService.GetEntityDashboardAsync(entityName);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion
}
