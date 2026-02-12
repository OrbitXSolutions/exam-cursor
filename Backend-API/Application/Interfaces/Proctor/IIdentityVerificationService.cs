using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Proctor;

namespace Smart_Core.Application.Interfaces.Proctor;

/// <summary>
/// Service interface for identity verification operations.
/// </summary>
public interface IIdentityVerificationService
{
    /// <summary>
    /// Get paginated list of identity verifications with filters.
    /// </summary>
    Task<ApiResponse<PaginatedResponse<IdentityVerificationListDto>>> GetVerificationsAsync(
        IdentityVerificationSearchDto searchDto);

    /// <summary>
    /// Get full detail of a single identity verification.
    /// </summary>
    Task<ApiResponse<IdentityVerificationDetailDto>> GetVerificationDetailAsync(int id);

    /// <summary>
    /// Apply a single action (Approve / Reject / Flag) to one verification.
    /// </summary>
    Task<ApiResponse<IdentityVerificationListDto>> ApplyActionAsync(
        IdentityVerificationActionDto dto, string reviewerId);

    /// <summary>
    /// Apply a bulk action to multiple verifications inside a transaction.
    /// </summary>
    Task<ApiResponse<BulkActionResultDto>> ApplyBulkActionAsync(
        IdentityVerificationBulkActionDto dto, string reviewerId);
}
