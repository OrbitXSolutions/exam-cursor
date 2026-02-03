using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.Incident;

/// <summary>
/// Internal comment on an incident case.
/// Not visible to candidates by default.
/// </summary>
public class IncidentComment : BaseEntity
{
    public int Id { get; set; }

    public int IncidentCaseId { get; set; }

    public string AuthorId { get; set; } = null!;
    public string? AuthorName { get; set; }

    public string Body { get; set; } = null!;

    /// <summary>
/// Whether this comment is visible to the candidate
    /// </summary>
    public bool IsVisibleToCandidate { get; set; }

    /// <summary>
    /// Whether this comment has been edited
    /// </summary>
    public bool IsEdited { get; set; }
    public DateTime? EditedAt { get; set; }

    // Navigation Properties
    public virtual IncidentCase IncidentCase { get; set; } = null!;
    public virtual ApplicationUser Author { get; set; } = null!;
}
