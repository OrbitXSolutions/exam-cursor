using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.QuestionBank;

public class QuestionAttachment : BaseEntity
{
    public int Id { get; set; }

    public int QuestionId { get; set; }

    public string FileName { get; set; } = null!;
    public string FilePath { get; set; } = null!;
    public string FileType { get; set; } = null!;   // Image / PDF
    public long FileSize { get; set; }

    public bool IsPrimary { get; set; }

    // Navigation Property
    public virtual Question Question { get; set; } = null!;
}
