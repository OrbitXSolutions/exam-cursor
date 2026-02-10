using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Lookups;

namespace Smart_Core.Application.Interfaces.Lookups;

public interface ILookupsService
{
    // Question Category
    Task<ApiResponse<PaginatedResponse<QuestionCategoryDto>>> GetAllQuestionCategoriesAsync(QuestionCategorySearchDto searchDto);
    Task<ApiResponse<QuestionCategoryDto>> GetQuestionCategoryByIdAsync(int id);
    Task<ApiResponse<QuestionCategoryDto>> CreateQuestionCategoryAsync(CreateQuestionCategoryDto dto, string createdBy);
    Task<ApiResponse<QuestionCategoryDto>> UpdateQuestionCategoryAsync(int id, UpdateQuestionCategoryDto dto, string updatedBy);
    Task<ApiResponse<bool>> DeleteQuestionCategoryAsync(int id);

    // Question Type
    Task<ApiResponse<PaginatedResponse<QuestionTypeDto>>> GetAllQuestionTypesAsync(QuestionTypeSearchDto searchDto);
    Task<ApiResponse<QuestionTypeDto>> GetQuestionTypeByIdAsync(int id);
    Task<ApiResponse<QuestionTypeDto>> CreateQuestionTypeAsync(CreateQuestionTypeDto dto, string createdBy);
    Task<ApiResponse<QuestionTypeDto>> UpdateQuestionTypeAsync(int id, UpdateQuestionTypeDto dto, string updatedBy);
    Task<ApiResponse<bool>> DeleteQuestionTypeAsync(int id);

    // Question Subject
    Task<ApiResponse<PaginatedResponse<QuestionSubjectDto>>> GetAllQuestionSubjectsAsync(QuestionSubjectSearchDto searchDto);
    Task<ApiResponse<QuestionSubjectDto>> GetQuestionSubjectByIdAsync(int id);
    Task<ApiResponse<QuestionSubjectDto>> CreateQuestionSubjectAsync(CreateQuestionSubjectDto dto, string createdBy);
    Task<ApiResponse<QuestionSubjectDto>> UpdateQuestionSubjectAsync(int id, UpdateQuestionSubjectDto dto, string updatedBy);
    Task<ApiResponse<bool>> DeleteQuestionSubjectAsync(int id);

    // Question Topic
    Task<ApiResponse<PaginatedResponse<QuestionTopicDto>>> GetAllQuestionTopicsAsync(QuestionTopicSearchDto searchDto);
    Task<ApiResponse<QuestionTopicDto>> GetQuestionTopicByIdAsync(int id);
    Task<ApiResponse<QuestionTopicDto>> CreateQuestionTopicAsync(CreateQuestionTopicDto dto, string createdBy);
    Task<ApiResponse<QuestionTopicDto>> UpdateQuestionTopicAsync(int id, UpdateQuestionTopicDto dto, string updatedBy);
    Task<ApiResponse<bool>> DeleteQuestionTopicAsync(int id);
}
