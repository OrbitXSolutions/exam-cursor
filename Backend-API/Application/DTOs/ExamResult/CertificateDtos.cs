namespace Smart_Core.Application.DTOs.ExamResult;

public class CertificateDto
{
    public int Id { get; set; }
    public string CertificateCode { get; set; } = string.Empty;
    public int ResultId { get; set; }
    public int ExamId { get; set; }
    public int AttemptId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string ExamTitleAr { get; set; } = string.Empty;
    public string? CandidateNameEn { get; set; }
    public string? CandidateNameAr { get; set; }
    public decimal Score { get; set; }
    public decimal MaxScore { get; set; }
    public decimal PassScore { get; set; }
    public DateTime IssuedAt { get; set; }
    public bool IsRevoked { get; set; }
    public string? DownloadUrl { get; set; }
}

public class CertificateVerificationDto
{
    public bool IsValid { get; set; }
    public string? Message { get; set; }
    public string? CertificateCode { get; set; }
    public string? ExamTitle { get; set; }
    public string? CandidateName { get; set; }
    public decimal? Score { get; set; }
    public decimal? MaxScore { get; set; }
    public DateTime? IssuedAt { get; set; }
}
