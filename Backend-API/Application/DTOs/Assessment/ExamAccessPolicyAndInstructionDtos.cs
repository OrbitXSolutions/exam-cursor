namespace Smart_Core.Application.DTOs.Assessment;

#region ExamAccessPolicy DTOs

/// <summary>
/// Access policy details
/// </summary>
public class ExamAccessPolicyDto
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public bool IsPublic { get; set; }
    public string? AccessCode { get; set; }
    public bool RestrictToAssignedCandidates { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
}

/// <summary>
/// Create or Update Access Policy DTO (same properties for both operations)
/// </summary>
public class SaveExamAccessPolicyDto
{
    public bool IsPublic { get; set; }
    public string? AccessCode { get; set; }
    public bool RestrictToAssignedCandidates { get; set; }
}

#endregion

#region ExamInstruction DTOs

/// <summary>
/// Instruction details
/// </summary>
public class ExamInstructionDto
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public string ContentEn { get; set; } = string.Empty;
    public string ContentAr { get; set; } = string.Empty;
    public int Order { get; set; }
    public DateTime CreatedDate { get; set; }
}

/// <summary>
/// Create or Update Instruction DTO (same properties for both operations)
/// </summary>
public class SaveExamInstructionDto
{
    public string ContentEn { get; set; } = string.Empty;
    public string ContentAr { get; set; } = string.Empty;
    public int Order { get; set; }
}

/// <summary>
/// Reorder instructions
/// </summary>
public class ReorderInstructionDto
{
    public int InstructionId { get; set; }
    public int NewOrder { get; set; }
}

#endregion
