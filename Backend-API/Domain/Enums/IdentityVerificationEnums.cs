namespace Smart_Core.Domain.Enums;

/// <summary>
/// Status of an identity verification request.
/// </summary>
public enum IdentityVerificationStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Flagged = 3
}

/// <summary>
/// Result of a liveness detection check.
/// </summary>
public enum LivenessResult
{
    NotChecked = 0,
    Passed = 1,
    Failed = 2,
    Inconclusive = 3
}
