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
}
