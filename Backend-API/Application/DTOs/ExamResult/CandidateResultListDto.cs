using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.DTOs.ExamResult
{
    public class CandidateResultListDto
    {
        public string ExamTitleEn { get; set; } = string.Empty;
        public string ExamTitleAr { get; set; } = string.Empty;
        public int ExamId { get; set; }
        public string CandidateId { get; set; } = string.Empty;
        public string CandidateName { get; set; } = string.Empty;
        public string? CandidateEmail { get; set; }
        public int TotalAttempts { get; set; }
        public int AttemptId { get; set; }
        public int AttemptNumber { get; set; }
        public int? GradingSessionId { get; set; }
        public int? ResultId { get; set; }
        public decimal? Score { get; set; }
        public decimal? MaxPossibleScore { get; set; }
        public decimal? Percentage { get; set; }
        public bool? IsPassed { get; set; }
        public bool IsPublished { get; set; }
        public bool IsResultFinalized { get; set; }
        public GradingStatus GradingStatusCode { get; set; }
        public string GradingStatus { get; set; } = string.Empty;
        public DateTime? GradedAt { get; set; }
        public DateTime? LastAttemptAt { get; set; }
    }

    public class CandidateResultListSummaryDto
    {
        public int TotalCandidates { get; set; }
    }

    public class CandidateResultListResponseDto
    {
        public List<CandidateResultListDto> Items { get; set; } = new();
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public CandidateResultListSummaryDto Summary { get; set; } = new();
    }
}
