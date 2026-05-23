namespace Smart_Core.Application.DTOs.Assessment;

// ========== Enum ==========

public enum WalkInFieldTypeDto
{
    Text = 1,
    Number = 2
}

// ========== Field Definition DTOs (admin-side) ==========

/// <summary>
/// Read DTO returned to admin and candidate registration form
/// </summary>
public class WalkInFieldDto
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public string LabelEn { get; set; } = string.Empty;
    public string LabelAr { get; set; } = string.Empty;
    public WalkInFieldTypeDto FieldType { get; set; }
    public bool IsRequired { get; set; }
    public int DisplayOrder { get; set; }
}

/// <summary>
/// Create or update a dynamic registration field
/// </summary>
public class SaveWalkInFieldDto
{
    public string LabelEn { get; set; } = string.Empty;
    public string LabelAr { get; set; } = string.Empty;
    public WalkInFieldTypeDto FieldType { get; set; } = WalkInFieldTypeDto.Text;
    public bool IsRequired { get; set; } = false;
    public int DisplayOrder { get; set; } = 0;
}

/// <summary>
/// Used in bulk reorder request
/// </summary>
public class ReorderWalkInFieldDto
{
    public int FieldId { get; set; }
    public int DisplayOrder { get; set; }
}

// ========== Answer DTOs ==========

/// <summary>
/// Single answer submitted by candidate during walk-in registration
/// </summary>
public class WalkInFieldAnswerInputDto
{
    public int FieldId { get; set; }
    public string Value { get; set; } = string.Empty;
}

/// <summary>
/// Admin reporting: all answers for one candidate for this exam
/// </summary>
public class WalkInAnswerDto
{
    public string CandidateId { get; set; } = string.Empty;
    public string? CandidateName { get; set; }
    public string? CandidateEmail { get; set; }
    public List<WalkInAnswerValueDto> Answers { get; set; } = new();
}

public class WalkInAnswerValueDto
{
    public int FieldId { get; set; }
    public string LabelEn { get; set; } = string.Empty;
    public string LabelAr { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}
