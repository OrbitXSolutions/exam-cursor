using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.Assessment;

namespace Smart_Core.Domain.Entities.ExamResult;

/// <summary>
/// Summary of a candidate's performance across all attempts for an exam.
/// One record per (ExamId, CandidateId).
/// </summary>
public class CandidateExamSummary : BaseEntity
{
    public int Id { get; set; }

    public int ExamId { get; set; }
    public string CandidateId { get; set; } = null!;

    // Attempt history summary
    public int TotalAttempts { get; set; }
    public int? BestAttemptId { get; set; }
    public int? BestResultId { get; set; }
    public decimal? BestScore { get; set; }
    public bool? BestIsPassed { get; set; }

 // Latest attempt info
    public int? LatestAttemptId { get; set; }
    public DateTime? LastAttemptAt { get; set; }
 public decimal? LatestScore { get; set; }
    public bool? LatestIsPassed { get; set; }

    // Navigation Properties
    public virtual Exam Exam { get; set; } = null!;
    public virtual ApplicationUser Candidate { get; set; } = null!;
    public virtual Attempt.Attempt? BestAttempt { get; set; }
    public virtual Result? BestResult { get; set; }
}
