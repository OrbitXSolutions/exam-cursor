using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities;

namespace Smart_Core.Domain.Entities.Batch;

public class Batch : BaseEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public virtual ICollection<BatchCandidate> BatchCandidates { get; set; } = new List<BatchCandidate>();
}

public class BatchCandidate
{
    public int Id { get; set; }

    public int BatchId { get; set; }
    public virtual Batch Batch { get; set; } = null!;

    public string CandidateId { get; set; } = null!;
    public virtual ApplicationUser Candidate { get; set; } = null!;

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    public string? AddedBy { get; set; }
}
