using Smart_Core.Application.DTOs.Assessment;
using Smart_Core.Application.DTOs.Common;

namespace Smart_Core.Application.Interfaces.Assessment;

public interface IAssessmentService
{
    #region Exams

    Task<ApiResponse<PaginatedResponse<ExamListDto>>> GetAllExamsAsync(ExamSearchDto searchDto);
    /// <summary>
    /// Get exams for dropdowns (id + title only, no pagination limit).
    /// </summary>
    Task<ApiResponse<List<ExamDropdownItemDto>>> GetExamsForDropdownAsync();
    Task<ApiResponse<ExamDto>> GetExamByIdAsync(int id);
    Task<ApiResponse<ExamDto>> CreateExamAsync(SaveExamDto dto, string createdBy);
    Task<ApiResponse<ExamDto>> UpdateExamAsync(int id, SaveExamDto dto, string updatedBy);
    Task<ApiResponse<ExamDto>> UpdateExamSettingsAsync(int id, UpdateExamSettingsDto dto, string updatedBy);
    Task<ApiResponse<bool>> DeleteExamAsync(int id);
    Task<ApiResponse<bool>> PublishExamAsync(int id, string updatedBy);
    Task<ApiResponse<bool>> UnpublishExamAsync(int id, string updatedBy);
    Task<ApiResponse<bool>> ToggleExamStatusAsync(int id, string updatedBy);

    #endregion

    #region Exam Sections

    Task<ApiResponse<List<ExamSectionDto>>> GetExamSectionsAsync(int examId);
    Task<ApiResponse<ExamSectionDto>> GetSectionByIdAsync(int sectionId);
    Task<ApiResponse<ExamSectionDto>> CreateSectionAsync(int examId, SaveExamSectionDto dto, string createdBy);
    Task<ApiResponse<ExamSectionDto>> UpdateSectionAsync(int sectionId, SaveExamSectionDto dto, string updatedBy);
    Task<ApiResponse<bool>> DeleteSectionAsync(int sectionId);
    Task<ApiResponse<bool>> ReorderSectionsAsync(int examId, List<ReorderSectionDto> reorderDtos, string updatedBy);

    #endregion

    #region Exam Topics

    Task<ApiResponse<List<ExamTopicDto>>> GetSectionTopicsAsync(int sectionId);
    Task<ApiResponse<ExamTopicDto>> GetTopicByIdAsync(int topicId);
    Task<ApiResponse<ExamTopicDto>> CreateTopicAsync(int sectionId, SaveExamTopicDto dto, string createdBy);
    Task<ApiResponse<ExamTopicDto>> UpdateTopicAsync(int topicId, SaveExamTopicDto dto, string updatedBy);
    Task<ApiResponse<bool>> DeleteTopicAsync(int topicId);
    Task<ApiResponse<bool>> ReorderTopicsAsync(int sectionId, List<ReorderTopicDto> reorderDtos, string updatedBy);

    #endregion

    #region Exam Questions

    Task<ApiResponse<List<ExamQuestionDto>>> GetSectionQuestionsAsync(int sectionId);
    Task<ApiResponse<List<ExamQuestionDto>>> GetTopicQuestionsAsync(int topicId);
    
    // Single question add
    Task<ApiResponse<ExamQuestionDto>> AddQuestionToSectionAsync(int sectionId, AddExamQuestionDto dto, string createdBy);
    Task<ApiResponse<ExamQuestionDto>> AddQuestionToTopicAsync(int topicId, AddExamQuestionDto dto, string createdBy);
    
    // Bulk add (simple - auto order)
    Task<ApiResponse<List<ExamQuestionDto>>> BulkAddQuestionsToSectionAsync(int sectionId, BulkAddQuestionsDto dto, string createdBy);
    Task<ApiResponse<List<ExamQuestionDto>>> BulkAddQuestionsToTopicAsync(int topicId, BulkAddQuestionsDto dto, string createdBy);
    
    // Manual selection (user picks questions with custom order/points)
    Task<ApiResponse<List<ExamQuestionDto>>> ManualAddQuestionsToSectionAsync(int sectionId, ManualQuestionSelectionDto dto, string createdBy);
    Task<ApiResponse<List<ExamQuestionDto>>> ManualAddQuestionsToTopicAsync(int topicId, ManualQuestionSelectionDto dto, string createdBy);
    
    // Random selection (system picks questions based on criteria)
    Task<ApiResponse<List<ExamQuestionDto>>> RandomAddQuestionsToSectionAsync(int sectionId, RandomQuestionSelectionDto dto, string createdBy);
    Task<ApiResponse<List<ExamQuestionDto>>> RandomAddQuestionsToTopicAsync(int topicId, RandomQuestionSelectionDto dto, string createdBy);

    // Update and remove
    Task<ApiResponse<ExamQuestionDto>> UpdateExamQuestionAsync(int examQuestionId, UpdateExamQuestionDto dto, string updatedBy);
    Task<ApiResponse<bool>> RemoveQuestionFromExamAsync(int examQuestionId);
    Task<ApiResponse<bool>> ReorderQuestionsAsync(int sectionId, List<ReorderQuestionDto> reorderDtos, string updatedBy);

    #endregion

    #region Access Policy

    Task<ApiResponse<ExamAccessPolicyDto>> GetAccessPolicyAsync(int examId);
    Task<ApiResponse<ExamAccessPolicyDto>> SaveAccessPolicyAsync(int examId, SaveExamAccessPolicyDto dto, string userId);

    #endregion

    #region Instructions

    Task<ApiResponse<List<ExamInstructionDto>>> GetExamInstructionsAsync(int examId);
    Task<ApiResponse<ExamInstructionDto>> CreateInstructionAsync(int examId, SaveExamInstructionDto dto, string createdBy);
    Task<ApiResponse<ExamInstructionDto>> UpdateInstructionAsync(int instructionId, SaveExamInstructionDto dto, string updatedBy);
    Task<ApiResponse<bool>> DeleteInstructionAsync(int instructionId);
    Task<ApiResponse<bool>> ReorderInstructionsAsync(int examId, List<ReorderInstructionDto> reorderDtos, string updatedBy);

    #endregion

    #region Validation

    Task<ApiResponse<ExamValidationResultDto>> ValidateExamForPublishAsync(int examId);

    #endregion
}

/// <summary>
/// Result of exam validation for publishing
/// </summary>
public class ExamValidationResultDto
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}
