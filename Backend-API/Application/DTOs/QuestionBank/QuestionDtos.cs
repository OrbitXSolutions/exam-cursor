using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.DTOs.QuestionBank;

#region Question DTOs

public class QuestionDto
{
    public int Id { get; set; }

    // Bilingual Body
    public string BodyEn { get; set; } = string.Empty;
    public string BodyAr { get; set; } = string.Empty;

    // Bilingual Explanation
    public string? ExplanationEn { get; set; }
    public string? ExplanationAr { get; set; }

    public int QuestionTypeId { get; set; }
    public string QuestionTypeNameEn { get; set; } = string.Empty;
    public string QuestionTypeNameAr { get; set; } = string.Empty;

    public int QuestionCategoryId { get; set; }
    public string QuestionCategoryNameEn { get; set; } = string.Empty;
    public string QuestionCategoryNameAr { get; set; } = string.Empty;

    // Subject & Topic
    public int SubjectId { get; set; }
    public string SubjectNameEn { get; set; } = string.Empty;
    public string SubjectNameAr { get; set; } = string.Empty;
    public int? TopicId { get; set; }
    public string? TopicNameEn { get; set; }
    public string? TopicNameAr { get; set; }

    public decimal Points { get; set; }
    public DifficultyLevel DifficultyLevel { get; set; }
    public string DifficultyLevelName => DifficultyLevel.ToString();
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public bool IsDeleted { get; set; }

    public List<QuestionOptionDto> Options { get; set; } = new();
    public List<QuestionAttachmentDto> Attachments { get; set; } = new();
    public QuestionAnswerKeyDto? AnswerKey { get; set; }
}

public class QuestionListDto
{
    public int Id { get; set; }

    // Bilingual Body
    public string BodyEn { get; set; } = string.Empty;
    public string BodyAr { get; set; } = string.Empty;

    public string QuestionTypeNameEn { get; set; } = string.Empty;
    public string QuestionTypeNameAr { get; set; } = string.Empty;

    public string QuestionCategoryNameEn { get; set; } = string.Empty;
    public string QuestionCategoryNameAr { get; set; } = string.Empty;

    // Subject & Topic
    public int SubjectId { get; set; }
    public string SubjectNameEn { get; set; } = string.Empty;
    public string SubjectNameAr { get; set; } = string.Empty;
    public int? TopicId { get; set; }
    public string? TopicNameEn { get; set; }
    public string? TopicNameAr { get; set; }

    public decimal Points { get; set; }
    public DifficultyLevel DifficultyLevel { get; set; }
    public string DifficultyLevelName => DifficultyLevel.ToString();
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
    public int OptionsCount { get; set; }
    public int AttachmentsCount { get; set; }
}

public class CreateQuestionDto
{
    // Bilingual Body (required)
    public string BodyEn { get; set; } = string.Empty;
    public string BodyAr { get; set; } = string.Empty;

    // Bilingual Explanation (optional)
    public string? ExplanationEn { get; set; }
    public string? ExplanationAr { get; set; }

    public int QuestionTypeId { get; set; }
    public int QuestionCategoryId { get; set; }
    public int SubjectId { get; set; }
    public int? TopicId { get; set; }
    public decimal Points { get; set; }
    public DifficultyLevel DifficultyLevel { get; set; }
    public bool IsActive { get; set; } = true;

    public List<CreateQuestionOptionDto> Options { get; set; } = new();
    public CreateQuestionAnswerKeyDto? AnswerKey { get; set; }
}

public class UpdateQuestionDto
{
    // Bilingual Body (required)
    public string BodyEn { get; set; } = string.Empty;
    public string BodyAr { get; set; } = string.Empty;

    // Bilingual Explanation (optional)
    public string? ExplanationEn { get; set; }
    public string? ExplanationAr { get; set; }

    public int QuestionTypeId { get; set; }
    public int QuestionCategoryId { get; set; }
    public int SubjectId { get; set; }
    public int? TopicId { get; set; }
    public decimal Points { get; set; }
    public DifficultyLevel DifficultyLevel { get; set; }
    public bool IsActive { get; set; }
}

public class QuestionSearchDto
{
    public string? Search { get; set; }
    public int? QuestionTypeId { get; set; }
    public int? QuestionCategoryId { get; set; }
    public int? SubjectId { get; set; }
    public int? TopicId { get; set; }
    public DifficultyLevel? DifficultyLevel { get; set; }
    public bool? IsActive { get; set; }
    public bool IncludeDeleted { get; set; } = false;
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

#endregion

#region QuestionAnswerKey DTOs

public class QuestionAnswerKeyDto
{
    public int Id { get; set; }
    public int QuestionId { get; set; }

    // ShortAnswer - Bilingual
    public string? AcceptedAnswersJsonEn { get; set; }
    public string? AcceptedAnswersJsonAr { get; set; }
    public bool CaseSensitive { get; set; }
    public bool TrimSpaces { get; set; }
    public bool NormalizeWhitespace { get; set; }

    // Essay - Bilingual (already bilingual)
    public string? RubricTextEn { get; set; }
    public string? RubricTextAr { get; set; }

    // Numeric
    public decimal? NumericAnswer { get; set; }
    public decimal? Tolerance { get; set; }
}

public class CreateQuestionAnswerKeyDto
{
    // ShortAnswer - Bilingual
    public string? AcceptedAnswersJsonEn { get; set; }
    public string? AcceptedAnswersJsonAr { get; set; }
    public bool CaseSensitive { get; set; } = false;
    public bool TrimSpaces { get; set; } = true;
    public bool NormalizeWhitespace { get; set; } = true;

    // Essay - Bilingual
    public string? RubricTextEn { get; set; }
    public string? RubricTextAr { get; set; }

    // Numeric
    public decimal? NumericAnswer { get; set; }
    public decimal? Tolerance { get; set; }
}

public class UpdateQuestionAnswerKeyDto
{
    // ShortAnswer - Bilingual
    public string? AcceptedAnswersJsonEn { get; set; }
    public string? AcceptedAnswersJsonAr { get; set; }
    public bool CaseSensitive { get; set; }
    public bool TrimSpaces { get; set; }
    public bool NormalizeWhitespace { get; set; }

    // Essay - Bilingual
    public string? RubricTextEn { get; set; }
    public string? RubricTextAr { get; set; }

    // Numeric
    public decimal? NumericAnswer { get; set; }
    public decimal? Tolerance { get; set; }
}

#endregion
