namespace Smart_Core.Domain.Enums;

/// <summary>
/// Outcome of an audited action
/// </summary>
public enum AuditOutcome : byte
{
    /// <summary>
    /// Action completed successfully
    /// </summary>
    Success = 1,

    /// <summary>
    /// Action failed
    /// </summary>
    Failure = 2
}

/// <summary>
/// Type of actor performing an action
/// </summary>
public enum ActorType : byte
{
    /// <summary>
    /// Human user
    /// </summary>
    User = 1,

    /// <summary>
    /// System/background job
    /// </summary>
    System = 2,

    /// <summary>
    /// External service/API
    /// </summary>
    Service = 3
}

/// <summary>
/// Source of the audit event
/// </summary>
public enum AuditSource : byte
{
    /// <summary>
    /// API endpoint
    /// </summary>
    Api = 1,

    /// <summary>
    /// Background job
    /// </summary>
    BackgroundJob = 2,

    /// <summary>
    /// Scheduled task
    /// </summary>
    Scheduler = 3,

    /// <summary>
    /// Message queue handler
    /// </summary>
    MessageHandler = 4,

    /// <summary>
    /// Database trigger
    /// </summary>
    DatabaseTrigger = 5
}

/// <summary>
/// Channel/client type
/// </summary>
public enum AuditChannel : byte
{
    /// <summary>
    /// Web application
    /// </summary>
    Web = 1,

    /// <summary>
    /// Mobile application
    /// </summary>
    Mobile = 2,

    /// <summary>
    /// Admin portal
    /// </summary>
    AdminPortal = 3,

    /// <summary>
    /// API client
    /// </summary>
    ApiClient = 4,

    /// <summary>
    /// Internal system
    /// </summary>
    Internal = 5
}
