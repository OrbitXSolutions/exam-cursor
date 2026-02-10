namespace Smart_Core.Application.DTOs.Lookups;

public class QuestionTopicDto
{
    public int Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public int SubjectId { get; set; }
    public string SubjectNameEn { get; set; } = string.Empty;
    public string SubjectNameAr { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public bool IsDeleted { get; set; }
}

public class CreateQuestionTopicDto
{
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public int SubjectId { get; set; }
}

public class UpdateQuestionTopicDto
{
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public int SubjectId { get; set; }
}

public class QuestionTopicSearchDto
{
    public string? Search { get; set; }
    public int? SubjectId { get; set; }
    public bool IncludeDeleted { get; set; } = false;
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
