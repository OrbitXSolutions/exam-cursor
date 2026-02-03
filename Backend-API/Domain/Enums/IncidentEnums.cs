namespace Smart_Core.Domain.Enums;

/// <summary>
/// Status of an incident case
/// </summary>
public enum IncidentStatus : byte
{
    /// <summary>
    /// Case is open and awaiting review
    /// </summary>
    Open = 1,

    /// <summary>
    /// Case is actively being reviewed
    /// </summary>
    InReview = 2,

    /// <summary>
 /// Case has been resolved with a decision
    /// </summary>
    Resolved = 3,

  /// <summary>
  /// Case is closed (final state)
    /// </summary>
    Closed = 4
}

/// <summary>
/// Severity level of an incident
/// </summary>
public enum IncidentSeverity : byte
{
    /// <summary>
    /// Low severity - minor concern
    /// </summary>
    Low = 1,

    /// <summary>
    /// Medium severity - requires attention
    /// </summary>
    Medium = 2,

    /// <summary>
    /// High severity - significant concern
    /// </summary>
    High = 3,

/// <summary>
    /// Critical severity - immediate attention required
    /// </summary>
    Critical = 4
}

/// <summary>
/// Source of incident creation
/// </summary>
public enum IncidentSource : byte
{
    /// <summary>
    /// Automatically created by proctor system
    /// </summary>
    ProctorAuto = 1,

    /// <summary>
    /// Manually reported by reviewer/admin
    /// </summary>
    ManualReport = 2,

    /// <summary>
    /// Created by system rule trigger
    /// </summary>
    SystemRule = 3
}

/// <summary>
/// Outcome of incident review
/// </summary>
public enum IncidentOutcome : byte
{
    /// <summary>
    /// No integrity issue found
 /// </summary>
    Cleared = 1,

    /// <summary>
    /// Suspicious activity - flag for monitoring
    /// </summary>
    Suspicious = 2,

    /// <summary>
    /// Confirmed cheating - attempt invalidated
    /// </summary>
    Invalidated = 3,

    /// <summary>
    /// Requires escalation to higher authority
    /// </summary>
    Escalated = 4
}

/// <summary>
/// Types of timeline events in an incident
/// </summary>
public enum IncidentTimelineEventType : byte
{
    /// <summary>
    /// Case was created
    /// </summary>
    Created = 1,

    /// <summary>
    /// Case was assigned to a reviewer
    /// </summary>
    Assigned = 2,

    /// <summary>
    /// Case status changed
    /// </summary>
    StatusChanged = 3,

    /// <summary>
    /// Evidence was linked to the case
    /// </summary>
    EvidenceLinked = 4,

    /// <summary>
    /// A decision was recorded
    /// </summary>
    DecisionRecorded = 5,

    /// <summary>
    /// A comment was added
    /// </summary>
    CommentAdded = 6,

    /// <summary>
    /// An appeal was submitted
    /// </summary>
    AppealSubmitted = 7,

    /// <summary>
    /// An appeal was reviewed
    /// </summary>
    AppealReviewed = 8,

    /// <summary>
  /// Severity was changed
    /// </summary>
    SeverityChanged = 9,

    /// <summary>
    /// Case was reopened
    /// </summary>
    Reopened = 10
}

/// <summary>
/// Status of an appeal request
/// </summary>
public enum AppealStatus : byte
{
    /// <summary>
    /// Appeal has been submitted
    /// </summary>
    Submitted = 1,

    /// <summary>
    /// Appeal is under review
 /// </summary>
    InReview = 2,

    /// <summary>
    /// Appeal was approved
    /// </summary>
    Approved = 3,

 /// <summary>
    /// Appeal was rejected
    /// </summary>
    Rejected = 4
}
