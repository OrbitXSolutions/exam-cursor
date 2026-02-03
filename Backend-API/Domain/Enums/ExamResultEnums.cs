namespace Smart_Core.Domain.Enums;

/// <summary>
/// Format for result exports
/// </summary>
public enum ExportFormat : byte
{
    /// <summary>
    /// Comma-separated values
    /// </summary>
    Csv = 1,

    /// <summary>
    /// Microsoft Excel format
    /// </summary>
    Excel = 2,

    /// <summary>
    /// PDF document
    /// </summary>
    Pdf = 3,

    /// <summary>
    /// JSON format
    /// </summary>
    Json = 4
}

/// <summary>
/// Status of an export job
/// </summary>
public enum ExportStatus : byte
{
    /// <summary>
    /// Job is queued and waiting to be processed
    /// </summary>
    Pending = 1,

    /// <summary>
    /// Job is currently being processed
    /// </summary>
    Processing = 2,

    /// <summary>
    /// Job completed successfully
    /// </summary>
    Completed = 3,

    /// <summary>
    /// Job failed with an error
    /// </summary>
    Failed = 4
}
