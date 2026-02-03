namespace Smart_Core.Application.DTOs.Lookups;

public class QuestionTypeDto
{
    public int Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public bool IsDeleted { get; set; }
}

public class CreateQuestionTypeDto
{
    public string NameEn { get; set; } = string.Empty;
 public string NameAr { get; set; } = string.Empty;
}

public class UpdateQuestionTypeDto
{
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
}

public class QuestionTypeSearchDto
{
    public string? Search { get; set; }
    public bool IncludeDeleted { get; set; } = false;
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
