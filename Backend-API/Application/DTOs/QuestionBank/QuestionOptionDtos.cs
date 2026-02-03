namespace Smart_Core.Application.DTOs.QuestionBank;

#region QuestionOption DTOs

public class QuestionOptionDto
{
  public int Id { get; set; }
    public int QuestionId { get; set; }
    
    // Bilingual Text
    public string TextEn { get; set; } = string.Empty;
  public string TextAr { get; set; } = string.Empty;
    
    public bool IsCorrect { get; set; }
    public int Order { get; set; }
    public string? AttachmentPath { get; set; }
    public DateTime CreatedDate { get; set; }
}

public class CreateQuestionOptionDto
{
 // Bilingual Text (required)
    public string TextEn { get; set; } = string.Empty;
    public string TextAr { get; set; } = string.Empty;
    
    public bool IsCorrect { get; set; }
    public int Order { get; set; }
    public string? AttachmentPath { get; set; }
}

public class UpdateQuestionOptionDto
{
    public int Id { get; set; }
    
    // Bilingual Text (required)
    public string TextEn { get; set; } = string.Empty;
    public string TextAr { get; set; } = string.Empty;
    
    public bool IsCorrect { get; set; }
    public int Order { get; set; }
    public string? AttachmentPath { get; set; }
}

public class BulkUpdateQuestionOptionsDto
{
    public int QuestionId { get; set; }
    public List<UpdateQuestionOptionDto> Options { get; set; } = new();
}

#endregion
