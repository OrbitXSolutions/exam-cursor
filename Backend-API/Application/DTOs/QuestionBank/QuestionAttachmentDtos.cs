namespace Smart_Core.Application.DTOs.QuestionBank;

#region QuestionAttachment DTOs

public class QuestionAttachmentDto
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public long FileSize { get; set; }
  public bool IsPrimary { get; set; }
    public DateTime CreatedDate { get; set; }
}

public class CreateQuestionAttachmentDto
{
    public int QuestionId { get; set; }
    public string FileName { get; set; } = string.Empty;
public string FilePath { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public bool IsPrimary { get; set; }
}

public class UpdateQuestionAttachmentDto
{
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
  public long FileSize { get; set; }
    public bool IsPrimary { get; set; }
}

#endregion
