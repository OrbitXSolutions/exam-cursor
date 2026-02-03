using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Lookups;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Lookups;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Controllers.Lookups;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Instructor}")]
public class LookupsController : ControllerBase
{
    private readonly ILookupsService _lookupsService;
    private readonly ICurrentUserService _currentUserService;

  public LookupsController(ILookupsService lookupsService, ICurrentUserService currentUserService)
    {
        _lookupsService = lookupsService;
        _currentUserService = currentUserService;
    }

    #region Question Category Endpoints

    /// <summary>
    /// Get all question categories with pagination and search
    /// </summary>
    [AllowAnonymous]
    [HttpGet("question-categories")]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<QuestionCategoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllQuestionCategories([FromQuery] QuestionCategorySearchDto searchDto)
    {
        var result = await _lookupsService.GetAllQuestionCategoriesAsync(searchDto);
        return Ok(result);
    }

    /// <summary>
    /// Get question category by ID
    /// </summary>
    [HttpGet("question-categories/{id}")]
 [ProducesResponseType(typeof(ApiResponse<QuestionCategoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<QuestionCategoryDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQuestionCategoryById(int id)
    {
        var result = await _lookupsService.GetQuestionCategoryByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

 /// <summary>
    /// Create a new question category
    /// </summary>
    [HttpPost("question-categories")]
    [ProducesResponseType(typeof(ApiResponse<QuestionCategoryDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<QuestionCategoryDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateQuestionCategory([FromBody] CreateQuestionCategoryDto dto)
    {
        var result = await _lookupsService.CreateQuestionCategoryAsync(dto, _currentUserService.UserId!);
        return result.Success 
        ? CreatedAtAction(nameof(GetQuestionCategoryById), new { id = result.Data!.Id }, result) 
            : BadRequest(result);
    }

    /// <summary>
    /// Update a question category
    /// </summary>
    [HttpPut("question-categories/{id}")]
    [ProducesResponseType(typeof(ApiResponse<QuestionCategoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<QuestionCategoryDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<QuestionCategoryDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateQuestionCategory(int id, [FromBody] UpdateQuestionCategoryDto dto)
    {
  var result = await _lookupsService.UpdateQuestionCategoryAsync(id, dto, _currentUserService.UserId!);
  return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete a question category (hard delete)
 /// </summary>
    [HttpDelete("question-categories/{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteQuestionCategory(int id)
    {
     var result = await _lookupsService.DeleteQuestionCategoryAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Question Type Endpoints

    /// <summary>
    /// Get all question types with pagination and search
    /// </summary>
    [HttpGet("question-types")]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<QuestionTypeDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllQuestionTypes([FromQuery] QuestionTypeSearchDto searchDto)
    {
 var result = await _lookupsService.GetAllQuestionTypesAsync(searchDto);
   return Ok(result);
    }

    /// <summary>
    /// Get question type by ID
    /// </summary>
    [HttpGet("question-types/{id}")]
    [ProducesResponseType(typeof(ApiResponse<QuestionTypeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<QuestionTypeDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQuestionTypeById(int id)
    {
      var result = await _lookupsService.GetQuestionTypeByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Create a new question type
 /// </summary>
    [HttpPost("question-types")]
    [ProducesResponseType(typeof(ApiResponse<QuestionTypeDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<QuestionTypeDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateQuestionType([FromBody] CreateQuestionTypeDto dto)
    {
        var result = await _lookupsService.CreateQuestionTypeAsync(dto, _currentUserService.UserId!);
        return result.Success 
      ? CreatedAtAction(nameof(GetQuestionTypeById), new { id = result.Data!.Id }, result) 
 : BadRequest(result);
    }

    /// <summary>
    /// Update a question type
    /// </summary>
    [HttpPut("question-types/{id}")]
    [ProducesResponseType(typeof(ApiResponse<QuestionTypeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<QuestionTypeDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<QuestionTypeDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateQuestionType(int id, [FromBody] UpdateQuestionTypeDto dto)
    {
        var result = await _lookupsService.UpdateQuestionTypeAsync(id, dto, _currentUserService.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete a question type (hard delete)
    /// </summary>
    [HttpDelete("question-types/{id}")]
  [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
 [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteQuestionType(int id)
    {
      var result = await _lookupsService.DeleteQuestionTypeAsync(id);
      return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion
}
