using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.QuestionBank;

/// <summary>
/// Stores the correct answer definition for non-MCQ question types.
/// MCQ/TrueFalse correctness is stored in QuestionOption.IsCorrect.
/// One-to-Zero-or-One relationship with Question (optional for MCQ types, required for ShortAnswer/Essay).
/// </summary>
public class QuestionAnswerKey : BaseEntity
{
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to Question. One AnswerKey per Question maximum.
    /// </summary>
    public int QuestionId { get; set; }

    #region ShortAnswer Properties

    /// <summary>
    /// JSON array of accepted answer strings in English for ShortAnswer questions.
    /// Example: ["answer1", "answer 1", "ans1"]
    /// </summary>
    public string? AcceptedAnswersJsonEn { get; set; }

    /// <summary>
    /// JSON array of accepted answer strings in Arabic for ShortAnswer questions.
    /// Example: ["???????1", "??????? ??????"]
    /// </summary>
    public string? AcceptedAnswersJsonAr { get; set; }

    /// <summary>
    /// If true, comparison is case-sensitive. Default: false.
    /// </summary>
    public bool CaseSensitive { get; set; } = false;

    /// <summary>
    /// If true, leading/trailing spaces are trimmed before comparison. Default: true.
    /// </summary>
    public bool TrimSpaces { get; set; } = true;

    /// <summary>
    /// If true, multiple consecutive spaces are collapsed to single space. Default: true.
    /// </summary>
    public bool NormalizeWhitespace { get; set; } = true;

    #endregion

    #region Essay Properties

    /// <summary>
    /// Grading rubric or model answer in English for Essay questions.
    /// Used by graders for manual evaluation.
    /// </summary>
    public string? RubricTextEn { get; set; }

    /// <summary>
    /// Grading rubric or model answer in Arabic for Essay questions.
    /// Used by graders for manual evaluation.
    /// </summary>
    public string? RubricTextAr { get; set; }

    #endregion

    #region Numeric Properties

    /// <summary>
    /// The correct numeric answer for Numeric question types.
    /// </summary>
    public decimal? NumericAnswer { get; set; }

    /// <summary>
    /// Acceptable tolerance range for numeric answers.
    /// Example: If NumericAnswer=10 and Tolerance=0.5, answers 9.5-10.5 are correct.
    /// </summary>
    public decimal? Tolerance { get; set; }

    #endregion

    // Navigation Property
    public virtual Question Question { get; set; } = null!;
}
