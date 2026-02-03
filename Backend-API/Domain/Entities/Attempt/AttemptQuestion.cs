using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.QuestionBank;

namespace Smart_Core.Domain.Entities.Attempt;

/// <summary>
/// Snapshot of a question assigned to an attempt.
/// Order and Points are frozen at attempt creation for consistency.
/// </summary>
public class AttemptQuestion : BaseEntity
{
    public int Id { get; set; }

    public int AttemptId { get; set; }
    public int QuestionId { get; set; }

    // Snapshot data (important for shuffle/versioning safety)
    public int Order { get; set; }
    public decimal Points { get; set; }

    // Navigation Properties
    public virtual Attempt Attempt { get; set; } = null!;
    public virtual Question Question { get; set; } = null!;

    public virtual ICollection<AttemptAnswer> Answers { get; set; }
= new List<AttemptAnswer>();
}
