using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.QuestionBank;

namespace Smart_Core.Application.Interfaces.QuestionBank;

public interface IQuestionBankService
{
  #region Questions

  Task<ApiResponse<PaginatedResponse<QuestionListDto>>> GetAllQuestionsAsync(QuestionSearchDto searchDto);
  Task<ApiResponse<QuestionDto>> GetQuestionByIdAsync(int id);
  Task<ApiResponse<QuestionDto>> CreateQuestionAsync(CreateQuestionDto dto, string createdBy);
  Task<ApiResponse<QuestionDto>> UpdateQuestionAsync(int id, UpdateQuestionDto dto, string updatedBy);
  Task<ApiResponse<bool>> DeleteQuestionAsync(int id);
  Task<ApiResponse<bool>> ToggleQuestionStatusAsync(int id, string updatedBy);

  /// <summary>
  /// Get count of active questions for a subject or topic
  /// </summary>
  Task<ApiResponse<int>> GetQuestionsCountAsync(int? subjectId, int? topicId);

  #endregion

  #region Question Options

  Task<ApiResponse<List<QuestionOptionDto>>> GetQuestionOptionsAsync(int questionId);
  Task<ApiResponse<QuestionOptionDto>> AddQuestionOptionAsync(int questionId, CreateQuestionOptionDto dto, string createdBy);
  Task<ApiResponse<QuestionOptionDto>> UpdateQuestionOptionAsync(int optionId, UpdateQuestionOptionDto dto, string updatedBy);
  Task<ApiResponse<bool>> DeleteQuestionOptionAsync(int optionId);
  Task<ApiResponse<List<QuestionOptionDto>>> BulkUpdateQuestionOptionsAsync(BulkUpdateQuestionOptionsDto dto, string updatedBy);

  #endregion

  #region Question Attachments

  Task<ApiResponse<List<QuestionAttachmentDto>>> GetQuestionAttachmentsAsync(int questionId);
  Task<ApiResponse<QuestionAttachmentDto>> AddQuestionAttachmentAsync(CreateQuestionAttachmentDto dto, string createdBy);
  Task<ApiResponse<QuestionAttachmentDto>> UpdateQuestionAttachmentAsync(int attachmentId, UpdateQuestionAttachmentDto dto, string updatedBy);
  Task<ApiResponse<bool>> DeleteQuestionAttachmentAsync(int attachmentId);
  Task<ApiResponse<bool>> SetPrimaryAttachmentAsync(int attachmentId, string updatedBy);

  #endregion
}
