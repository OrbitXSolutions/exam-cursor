using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.ExamResult;

namespace Smart_Core.Application.Interfaces.ExamResult;

public interface ICertificateService
{
    Task<ApiResponse<CertificateDto>> CreateForResultAsync(int resultId, string userId);
    Task<ApiResponse<CertificateDto>> GetByIdAsync(int certificateId, string? candidateId = null);
    Task<ApiResponse<CertificateDto>> GetByResultIdAsync(int resultId, string? candidateId = null);
    Task<ApiResponse<CertificateDto>> GetByCodeAsync(string code);
    Task<ApiResponse<CertificateVerificationDto>> VerifyAsync(string code);
    Task<ApiResponse<List<CertificateDto>>> GetMyCertificatesAsync(string candidateId);
    Task<ApiResponse<bool>> RevokeAsync(int certificateId, string reason, string userId);
    Task<ApiResponse<CertificateDto>> RegenerateAsync(int certificateId, string userId);
}
