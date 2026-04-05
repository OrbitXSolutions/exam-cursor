using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.ExamResult;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.ExamResult;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities.ExamResult;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.ExamResult;

public class CertificateService : ICertificateService
{
    private readonly ApplicationDbContext _context;
    private readonly ICacheService _cache;

    public CertificateService(ApplicationDbContext context, ICacheService cache)
    {
        _context = context;
        _cache = cache;
    }

    private void InvalidateCertificateCache() => _cache.RemoveByPrefix(CacheKeys.CertificatesPrefix);

    public async Task<ApiResponse<CertificateDto>> CreateForResultAsync(int resultId, string userId)
    {
        var result = await _context.Set<Result>()
            .Include(r => r.Exam)
            .Include(r => r.Candidate)
            .FirstOrDefaultAsync(r => r.Id == resultId);

        if (result == null)
            return ApiResponse<CertificateDto>.FailureResponse("Result not found");

        if (!result.IsPassed)
            return ApiResponse<CertificateDto>.FailureResponse("Certificate can only be issued for passed results");

        if (!result.IsPublishedToCandidate)
            return ApiResponse<CertificateDto>.FailureResponse("Result must be published before issuing certificate");

        var existing = await _context.Set<Certificate>()
            .FirstOrDefaultAsync(c => c.ResultId == resultId);

        if (existing != null)
            return ApiResponse<CertificateDto>.FailureResponse("Certificate already exists for this result");

        var code = GenerateCertificateCode();
        var now = DateTime.UtcNow;

        var cert = new Certificate
        {
            CertificateCode = code,
            ResultId = result.Id,
            ExamId = result.ExamId,
            AttemptId = result.AttemptId,
            CandidateId = result.CandidateId,
            Score = result.TotalScore,
            MaxScore = result.MaxPossibleScore,
            PassScore = result.PassScore,
            ExamTitleEn = result.Exam.TitleEn,
            ExamTitleAr = result.Exam.TitleAr,
            CandidateNameEn = result.Candidate?.DisplayName ?? result.Candidate?.UserName,
            CandidateNameAr = result.Candidate?.DisplayName ?? result.Candidate?.UserName,
            IssuedAt = now,
            CreatedDate = now,
            CreatedBy = userId
        };

        _context.Set<Certificate>().Add(cert);
        await _context.SaveChangesAsync();

        InvalidateCertificateCache();
        return ApiResponse<CertificateDto>.SuccessResponse(MapToDto(cert));
    }

    public async Task<ApiResponse<CertificateDto>> GetByIdAsync(int certificateId, string? candidateId = null)
    {
        var cacheKey = candidateId == null
            ? CacheKeys.CertificateById(certificateId)
            : $"{CacheKeys.CertificateById(certificateId)}:{candidateId}";

        if (_cache.TryGet<CertificateDto>(cacheKey, out var cached) && cached != null)
            return ApiResponse<CertificateDto>.SuccessResponse(cached);

        var cert = await _context.Set<Certificate>().FirstOrDefaultAsync(c => c.Id == certificateId);
        if (cert == null)
            return ApiResponse<CertificateDto>.FailureResponse("Certificate not found");

        if (candidateId != null && cert.CandidateId != candidateId)
            return ApiResponse<CertificateDto>.FailureResponse("Access denied");

        if (cert.IsRevoked)
            return ApiResponse<CertificateDto>.FailureResponse("Certificate has been revoked");

        var dto = MapToDto(cert);
        _cache.Set(cacheKey, dto, CacheKeys.Thirty);
        return ApiResponse<CertificateDto>.SuccessResponse(dto);
    }

    public async Task<ApiResponse<CertificateDto>> GetByResultIdAsync(int resultId, string? candidateId = null)
    {
        var cacheKey = candidateId == null
            ? CacheKeys.CertificateByResult(resultId)
            : $"{CacheKeys.CertificateByResult(resultId)}:{candidateId}";

        if (_cache.TryGet<CertificateDto>(cacheKey, out var cached) && cached != null)
            return ApiResponse<CertificateDto>.SuccessResponse(cached);

        var cert = await _context.Set<Certificate>()
            .FirstOrDefaultAsync(c => c.ResultId == resultId);

        if (cert == null)
            return ApiResponse<CertificateDto>.FailureResponse("Certificate not found");

        if (candidateId != null && cert.CandidateId != candidateId)
            return ApiResponse<CertificateDto>.FailureResponse("Access denied");

        if (cert.IsRevoked)
            return ApiResponse<CertificateDto>.FailureResponse("Certificate has been revoked");

        var dto = MapToDto(cert);
        _cache.Set(cacheKey, dto, CacheKeys.Thirty);
        return ApiResponse<CertificateDto>.SuccessResponse(dto);
    }

    public async Task<ApiResponse<CertificateDto>> GetByCodeAsync(string code)
    {
        var cacheKey = CacheKeys.CertificateByCode(code);
        if (_cache.TryGet<CertificateDto>(cacheKey, out var cached) && cached != null)
            return ApiResponse<CertificateDto>.SuccessResponse(cached);

        var cert = await _context.Set<Certificate>()
            .FirstOrDefaultAsync(c => c.CertificateCode == code);

        if (cert == null)
            return ApiResponse<CertificateDto>.FailureResponse("Certificate not found");

        if (cert.IsRevoked)
            return ApiResponse<CertificateDto>.FailureResponse("Certificate has been revoked");

        var dto = MapToDto(cert);
        _cache.Set(cacheKey, dto, CacheKeys.Thirty);
        return ApiResponse<CertificateDto>.SuccessResponse(dto);
    }

    public async Task<ApiResponse<CertificateVerificationDto>> VerifyAsync(string code)
    {
        var cacheKey = $"certs:verify:{code}";
        if (_cache.TryGet<CertificateVerificationDto>(cacheKey, out var cached) && cached != null)
            return ApiResponse<CertificateVerificationDto>.SuccessResponse(cached);

        var cert = await _context.Set<Certificate>()
            .FirstOrDefaultAsync(c => c.CertificateCode == code);

        CertificateVerificationDto result;
        if (cert == null)
        {
            result = new CertificateVerificationDto { IsValid = false, Message = "Certificate not found" };
            _cache.Set(cacheKey, result, CacheKeys.Thirty);
            return ApiResponse<CertificateVerificationDto>.SuccessResponse(result);
        }

        if (cert.IsRevoked)
        {
            result = new CertificateVerificationDto
            {
                IsValid = false,
                Message = "This certificate has been revoked",
                CertificateCode = cert.CertificateCode,
                ExamTitle = cert.ExamTitleEn,
                CandidateName = cert.CandidateNameEn,
                Score = cert.Score,
                MaxScore = cert.MaxScore,
                IssuedAt = cert.IssuedAt
            };
            _cache.Set(cacheKey, result, CacheKeys.Thirty);
            return ApiResponse<CertificateVerificationDto>.SuccessResponse(result);
        }

        result = new CertificateVerificationDto
        {
            IsValid = true,
            Message = "Certificate is valid",
            CertificateCode = cert.CertificateCode,
            ExamTitle = cert.ExamTitleEn,
            CandidateName = cert.CandidateNameEn,
            Score = cert.Score,
            MaxScore = cert.MaxScore,
            IssuedAt = cert.IssuedAt
        };
        _cache.Set(cacheKey, result, CacheKeys.Thirty);
        return ApiResponse<CertificateVerificationDto>.SuccessResponse(result);
    }

    public async Task<ApiResponse<List<CertificateDto>>> GetMyCertificatesAsync(string candidateId)
    {
        var cacheKey = CacheKeys.CertificatesByCandidate(candidateId);
        if (_cache.TryGet<List<CertificateDto>>(cacheKey, out var cached) && cached != null)
            return ApiResponse<List<CertificateDto>>.SuccessResponse(cached);

        var certs = await _context.Set<Certificate>()
            .Where(c => c.CandidateId == candidateId && !c.IsRevoked)
            .OrderByDescending(c => c.IssuedAt)
            .ToListAsync();

        var result = certs.Select(MapToDto).ToList();
        _cache.Set(cacheKey, result, CacheKeys.Thirty);
        return ApiResponse<List<CertificateDto>>.SuccessResponse(result);
    }

    public async Task<ApiResponse<bool>> RevokeAsync(int certificateId, string reason, string userId)
    {
        var cert = await _context.Set<Certificate>().FirstOrDefaultAsync(c => c.Id == certificateId);
        if (cert == null)
            return ApiResponse<bool>.FailureResponse("Certificate not found");

        cert.IsRevoked = true;
        cert.RevokedAt = DateTime.UtcNow;
        cert.RevokedBy = userId;
        cert.RevokeReason = reason;
        cert.UpdatedDate = DateTime.UtcNow;
        cert.UpdatedBy = userId;

        await _context.SaveChangesAsync();
        InvalidateCertificateCache();
        return ApiResponse<bool>.SuccessResponse(true, "Certificate revoked");
    }

    public async Task<ApiResponse<CertificateDto>> RegenerateAsync(int certificateId, string userId)
    {
        var cert = await _context.Set<Certificate>().FirstOrDefaultAsync(c => c.Id == certificateId);
        if (cert == null)
            return ApiResponse<CertificateDto>.FailureResponse("Certificate not found");

        cert.CertificateCode = GenerateCertificateCode();
        cert.RevokedAt = null;
        cert.RevokedBy = null;
        cert.RevokeReason = null;
        cert.IsRevoked = false;
        cert.FilePath = null;
        cert.FileUrl = null;
        cert.UpdatedDate = DateTime.UtcNow;
        cert.UpdatedBy = userId;

        await _context.SaveChangesAsync();
        InvalidateCertificateCache();
        return ApiResponse<CertificateDto>.SuccessResponse(MapToDto(cert), "Certificate regenerated");
    }

    private static string GenerateCertificateCode()
    {
        var guid = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        var date = DateTime.UtcNow.ToString("yyyyMMdd");
        return $"CERT-{date}-{guid}";
    }

    private static CertificateDto MapToDto(Certificate c)
    {
        return new CertificateDto
        {
            Id = c.Id,
            CertificateCode = c.CertificateCode,
            ResultId = c.ResultId,
            ExamId = c.ExamId,
            AttemptId = c.AttemptId,
            ExamTitleEn = c.ExamTitleEn,
            ExamTitleAr = c.ExamTitleAr,
            CandidateNameEn = c.CandidateNameEn,
            CandidateNameAr = c.CandidateNameAr,
            Score = c.Score,
            MaxScore = c.MaxScore,
            PassScore = c.PassScore,
            IssuedAt = c.IssuedAt,
            IsRevoked = c.IsRevoked,
            DownloadUrl = !string.IsNullOrEmpty(c.FileUrl) ? c.FileUrl : $"/api/Certificate/{c.Id}/download"
        };
    }
}
