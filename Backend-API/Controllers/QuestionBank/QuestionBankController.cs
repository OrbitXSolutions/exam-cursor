using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.QuestionBank;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.QuestionBank;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Controllers.QuestionBank;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Instructor}")]
public class QuestionBankController : ControllerBase
{
    private readonly IQuestionBankService _questionBankService;
    private readonly ICurrentUserService _currentUserService;

    public QuestionBankController(IQuestionBankService questionBankService, ICurrentUserService currentUserService)
    {
        _questionBankService = questionBankService;
        _currentUserService = currentUserService;
    }

    #region Question Endpoints

    /// <summary>
    /// Get all questions with pagination, search and filters
    /// </summary>
    [HttpGet("questions")]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<QuestionListDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllQuestions([FromQuery] QuestionSearchDto searchDto)
    {
        var result = await _questionBankService.GetAllQuestionsAsync(searchDto);
        return Ok(result);
    }

    /// <summary>
    /// Get question by ID with options and attachments
    /// </summary>
    [HttpGet("questions/{id}")]
    [ProducesResponseType(typeof(ApiResponse<QuestionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<QuestionDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQuestionById(int id)
    {
        var result = await _questionBankService.GetQuestionByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Create a new question with options
    /// </summary>
    [HttpPost("questions")]
    [ProducesResponseType(typeof(ApiResponse<QuestionDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<QuestionDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateQuestion([FromBody] CreateQuestionDto dto)
    {
        var result = await _questionBankService.CreateQuestionAsync(dto, _currentUserService.UserId!);
        return result.Success
   ? CreatedAtAction(nameof(GetQuestionById), new { id = result.Data!.Id }, result)
          : BadRequest(result);
    }

    /// <summary>
    /// Update a question
    /// </summary>
    [HttpPut("questions/{id}")]
    [ProducesResponseType(typeof(ApiResponse<QuestionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<QuestionDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<QuestionDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateQuestion(int id, [FromBody] UpdateQuestionDto dto)
    {
        var result = await _questionBankService.UpdateQuestionAsync(id, dto, _currentUserService.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete a question (hard delete)
    /// </summary>
    [HttpDelete("questions/{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteQuestion(int id)
    {
        var result = await _questionBankService.DeleteQuestionAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Toggle question active status
    /// </summary>
    [HttpPatch("questions/{id}/toggle-status")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleQuestionStatus(int id)
    {
        var result = await _questionBankService.ToggleQuestionStatusAsync(id, _currentUserService.UserId!);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get count of available questions for a subject or topic
    /// </summary>
    [HttpGet("questions/count")]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetQuestionsCount([FromQuery] int? subjectId, [FromQuery] int? topicId)
    {
        var result = await _questionBankService.GetQuestionsCountAsync(subjectId, topicId);
        return Ok(result);
    }

    #endregion

    #region Question Options Endpoints

    /// <summary>
    /// Get all options for a question
    /// </summary>
    [HttpGet("questions/{questionId}/options")]
    [ProducesResponseType(typeof(ApiResponse<List<QuestionOptionDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<List<QuestionOptionDto>>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQuestionOptions(int questionId)
    {
        var result = await _questionBankService.GetQuestionOptionsAsync(questionId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Add an option to a question
    /// </summary>
    [HttpPost("questions/{questionId}/options")]
    [ProducesResponseType(typeof(ApiResponse<QuestionOptionDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<QuestionOptionDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddQuestionOption(int questionId, [FromBody] CreateQuestionOptionDto dto)
    {
        var result = await _questionBankService.AddQuestionOptionAsync(questionId, dto, _currentUserService.UserId!);
        return result.Success ? Created(string.Empty, result) : BadRequest(result);
    }

    /// <summary>
    /// Update a question option
    /// </summary>
    [HttpPut("options/{optionId}")]
    [ProducesResponseType(typeof(ApiResponse<QuestionOptionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<QuestionOptionDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateQuestionOption(int optionId, [FromBody] UpdateQuestionOptionDto dto)
    {
        var result = await _questionBankService.UpdateQuestionOptionAsync(optionId, dto, _currentUserService.UserId!);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Delete a question option
    /// </summary>
    [HttpDelete("options/{optionId}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteQuestionOption(int optionId)
    {
        var result = await _questionBankService.DeleteQuestionOptionAsync(optionId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Bulk update question options
    /// </summary>
    [HttpPut("questions/{questionId}/options/bulk")]
    [ProducesResponseType(typeof(ApiResponse<List<QuestionOptionDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<List<QuestionOptionDto>>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BulkUpdateQuestionOptions(int questionId, [FromBody] List<UpdateQuestionOptionDto> options)
    {
        var dto = new BulkUpdateQuestionOptionsDto
        {
            QuestionId = questionId,
            Options = options
        };
        var result = await _questionBankService.BulkUpdateQuestionOptionsAsync(dto, _currentUserService.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Question Attachments Endpoints

    /// <summary>
    /// Get all attachments for a question
    /// </summary>
    [HttpGet("questions/{questionId}/attachments")]
    [ProducesResponseType(typeof(ApiResponse<List<QuestionAttachmentDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<List<QuestionAttachmentDto>>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQuestionAttachments(int questionId)
    {
        var result = await _questionBankService.GetQuestionAttachmentsAsync(questionId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Add an attachment to a question
    /// </summary>
    [HttpPost("questions/{questionId}/attachments")]
    [ProducesResponseType(typeof(ApiResponse<QuestionAttachmentDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<QuestionAttachmentDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddQuestionAttachment(int questionId, [FromBody] CreateQuestionAttachmentDto dto)
    {
        dto.QuestionId = questionId;
        var result = await _questionBankService.AddQuestionAttachmentAsync(dto, _currentUserService.UserId!);
        return result.Success ? Created(string.Empty, result) : BadRequest(result);
    }

    /// <summary>
    /// Update a question attachment
    /// </summary>
    [HttpPut("attachments/{attachmentId}")]
    [ProducesResponseType(typeof(ApiResponse<QuestionAttachmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<QuestionAttachmentDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateQuestionAttachment(int attachmentId, [FromBody] UpdateQuestionAttachmentDto dto)
    {
        var result = await _questionBankService.UpdateQuestionAttachmentAsync(attachmentId, dto, _currentUserService.UserId!);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Delete a question attachment
    /// </summary>
    [HttpDelete("attachments/{attachmentId}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteQuestionAttachment(int attachmentId)
    {
        var result = await _questionBankService.DeleteQuestionAttachmentAsync(attachmentId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Set an attachment as primary
    /// </summary>
    [HttpPatch("attachments/{attachmentId}/set-primary")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetPrimaryAttachment(int attachmentId)
    {
        var result = await _questionBankService.SetPrimaryAttachmentAsync(attachmentId, _currentUserService.UserId!);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion
}
