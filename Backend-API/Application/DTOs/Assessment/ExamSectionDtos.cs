namespace Smart_Core.Application.DTOs.Assessment;

#region ExamSection DTOs

/// <summary>
/// Full section details with topics and questions
/// </summary>
public class ExamSectionDto
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public int Order { get; set; }
    public int? DurationMinutes { get; set; }
    public decimal? TotalPointsOverride { get; set; }
    public DateTime CreatedDate { get; set; }
    public int TopicsCount { get; set; }
    public int QuestionsCount { get; set; }
    public decimal TotalPoints { get; set; }
    public List<ExamTopicDto> Topics { get; set; } = new();
    public List<ExamQuestionDto> Questions { get; set; } = new();
}

/// <summary>
/// Create or Update Section DTO (same properties for both operations)
/// </summary>
public class SaveExamSectionDto
{
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public int Order { get; set; }
    public int? DurationMinutes { get; set; }
    public decimal? TotalPointsOverride { get; set; }
}

/// <summary>
/// Reorder sections
/// </summary>
public class ReorderSectionDto
{
    public int SectionId { get; set; }
    public int NewOrder { get; set; }
}

#endregion

#region ExamTopic DTOs

/// <summary>
/// Full topic details with questions
/// </summary>
public class ExamTopicDto
{
    public int Id { get; set; }
    public int ExamSectionId { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public int Order { get; set; }
    public DateTime CreatedDate { get; set; }
    public int QuestionsCount { get; set; }
    public decimal TotalPoints { get; set; }
    public List<ExamQuestionDto> Questions { get; set; } = new();
}

/// <summary>
/// Create or Update Topic DTO
/// </summary>
public class SaveExamTopicDto
{
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public int Order { get; set; }
}

/// <summary>
/// Reorder topics within a section
/// </summary>
public class ReorderTopicDto
{
    public int TopicId { get; set; }
    public int NewOrder { get; set; }
}

#endregion
