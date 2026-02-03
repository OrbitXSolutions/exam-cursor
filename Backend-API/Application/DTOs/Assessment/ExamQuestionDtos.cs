namespace Smart_Core.Application.DTOs.Assessment;

#region ExamQuestion DTOs

/// <summary>
/// Exam question with question bank details
/// </summary>
public class ExamQuestionDto
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public int ExamSectionId { get; set; }
    public int? ExamTopicId { get; set; }
    public int QuestionId { get; set; }
    public int Order { get; set; }
    public decimal Points { get; set; }
    public bool IsRequired { get; set; }
    public DateTime CreatedDate { get; set; }
    
    // Question Bank details - Bilingual
    public string QuestionBodyEn { get; set; } = string.Empty;
    public string QuestionBodyAr { get; set; } = string.Empty;
    public string QuestionTypeNameEn { get; set; } = string.Empty;
    public string QuestionTypeNameAr { get; set; } = string.Empty;
    public string DifficultyLevelName { get; set; } = string.Empty;
    public decimal OriginalPoints { get; set; }
}

/// <summary>
/// Add single question to exam section or topic
/// </summary>
public class AddExamQuestionDto
{
    public int QuestionId { get; set; }
    public int Order { get; set; }
    public decimal? PointsOverride { get; set; }  // null = use original points
    public bool IsRequired { get; set; } = true;
}

/// <summary>
/// Update exam question (points, order, required status)
/// </summary>
public class UpdateExamQuestionDto
{
  public int Order { get; set; }
    public decimal Points { get; set; }
    public bool IsRequired { get; set; }
}

/// <summary>
/// Bulk add questions to section or topic (simple - auto order)
/// </summary>
public class BulkAddQuestionsDto
{
    public List<int> QuestionIds { get; set; } = new();
    public bool UseOriginalPoints { get; set; } = true;
    public bool MarkAsRequired { get; set; } = true;
}

/// <summary>
/// Manual selection: User picks specific questions with custom order and points
/// </summary>
public class ManualQuestionSelectionDto
{
    /// <summary>
    /// List of questions with their specific order and points
    /// </summary>
    public List<ManualQuestionItemDto> Questions { get; set; } = new();

    /// <summary>
    /// Mark all questions as required (default: true)
    /// </summary>
    public bool MarkAsRequired { get; set; } = true;
}

/// <summary>
/// Single question item for manual selection
/// </summary>
public class ManualQuestionItemDto
{
    /// <summary>
    /// Question ID from the Question Bank
    /// </summary>
    public int QuestionId { get; set; }

    /// <summary>
    /// Display order in the exam (1, 2, 3, ...)
    /// </summary>
    public int Order { get; set; }

    /// <summary>
    /// Custom points for this question (null = use original points from Question Bank)
    /// </summary>
    public decimal? PointsOverride { get; set; }

    /// <summary>
 /// Override required status for this specific question (null = use parent MarkAsRequired)
    /// </summary>
    public bool? IsRequired { get; set; }
}

/// <summary>
/// Random selection: System randomly picks questions based on criteria
/// </summary>
public class RandomQuestionSelectionDto
{
    /// <summary>
    /// Number of questions to randomly select
    /// </summary>
    public int Count { get; set; }

    /// <summary>
    /// Filter by category ID (optional)
    /// </summary>
    public int? CategoryId { get; set; }

    /// <summary>
    /// Filter by question type ID (optional): 1=MCQ_Single, 2=MCQ_Multi, 3=TrueFalse, etc.
    /// </summary>
  public int? QuestionTypeId { get; set; }

    /// <summary>
    /// Filter by difficulty level (optional): 1=Easy, 2=Medium, 3=Hard
    /// </summary>
    public int? DifficultyLevel { get; set; }

    /// <summary>
    /// Use original points from question bank (default: true)
    /// </summary>
    public bool UseOriginalPoints { get; set; } = true;

 /// <summary>
    /// Mark questions as required (default: true)
    /// </summary>
    public bool MarkAsRequired { get; set; } = true;

    /// <summary>
    /// Exclude questions already in the exam (default: true)
    /// </summary>
    public bool ExcludeExistingInExam { get; set; } = true;
}

/// <summary>
/// Reorder questions within section or topic
/// </summary>
public class ReorderQuestionDto
{
    public int ExamQuestionId { get; set; }
    public int NewOrder { get; set; }
}

#endregion
