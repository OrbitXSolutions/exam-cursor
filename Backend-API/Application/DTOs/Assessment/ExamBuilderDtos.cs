using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.DTOs.Assessment;

#region Exam Builder DTOs

/// <summary>
/// DTO for getting/setting exam builder configuration
/// </summary>
public class ExamBuilderDto
{
    public int ExamId { get; set; }
    public SectionSourceType SourceType { get; set; }
    public List<int> SelectedSubjectIds { get; set; } = new();
    public List<BuilderSectionDto> Sections { get; set; } = new();
}

/// <summary>
/// Section configuration for Builder
/// </summary>
public class BuilderSectionDto
{
    public int? Id { get; set; } // null for new sections
    public SectionSourceType SourceType { get; set; }
    public int QuestionSubjectId { get; set; }
    public int? QuestionTopicId { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public int? DurationMinutes { get; set; }
    public int PickCount { get; set; }
    public int Order { get; set; }

    // Read-only fields returned by GET
    public int AvailableQuestionsCount { get; set; }
    public string? SubjectNameEn { get; set; }
    public string? SubjectNameAr { get; set; }
    public string? TopicNameEn { get; set; }
    public string? TopicNameAr { get; set; }
}

/// <summary>
/// Request to save exam builder configuration
/// </summary>
public class SaveExamBuilderRequest
{
    public SectionSourceType SourceType { get; set; }
    public List<SaveBuilderSectionDto> Sections { get; set; } = new();
}

/// <summary>
/// Section data for saving builder
/// </summary>
public class SaveBuilderSectionDto
{
    public SectionSourceType SourceType { get; set; }
    public int QuestionSubjectId { get; set; }
    public int? QuestionTopicId { get; set; }
    public string? TitleEn { get; set; } // optional - will auto-fill from subject/topic if empty
    public string? TitleAr { get; set; } // optional - will auto-fill from subject/topic if empty
    public int? DurationMinutes { get; set; }
    public int PickCount { get; set; }
    public int Order { get; set; }
}

/// <summary>
/// Response for questions count query
/// </summary>
public class QuestionsCountResponse
{
    public int Count { get; set; }
    public int? SubjectId { get; set; }
    public int? TopicId { get; set; }
}

#endregion
