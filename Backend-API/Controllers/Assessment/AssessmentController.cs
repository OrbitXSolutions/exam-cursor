using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Assessment;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Assessment;

namespace Smart_Core.Controllers.Assessment;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssessmentController : ControllerBase
{
    private readonly IAssessmentService _assessmentService;
    private readonly ICurrentUserService _currentUserService;

    public AssessmentController(
        IAssessmentService assessmentService,
        ICurrentUserService currentUserService)
    {
        _assessmentService = assessmentService;
        _currentUserService = currentUserService;
    }

    #region Exams

    /// <summary>
    /// Get all exams with pagination and filtering
    /// </summary>
    [HttpGet("exams")]
    public async Task<IActionResult> GetAllExams([FromQuery] ExamSearchDto searchDto)
    {
        var result = await _assessmentService.GetAllExamsAsync(searchDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get exams for dropdowns (id + title only, no pagination).
    /// </summary>
    [HttpGet("exams/dropdown")]
    public async Task<IActionResult> GetExamsForDropdown()
    {
        var result = await _assessmentService.GetExamsForDropdownAsync();
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get exam by ID with full details
    /// </summary>
    [HttpGet("exams/{id}")]
    public async Task<IActionResult> GetExamById(int id)
    {
        var result = await _assessmentService.GetExamByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Create a new exam
    /// </summary>
    [HttpPost("exams")]
    public async Task<IActionResult> CreateExam([FromBody] SaveExamDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.CreateExamAsync(dto, userId);
        return result.Success ? CreatedAtAction(nameof(GetExamById), new { id = result.Data?.Id }, result) : BadRequest(result);
    }

    /// <summary>
    /// Update an existing exam
    /// </summary>
    [HttpPut("exams/{id}")]
    public async Task<IActionResult> UpdateExam(int id, [FromBody] SaveExamDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.UpdateExamAsync(id, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete an exam (soft delete)
    /// </summary>
    [HttpDelete("exams/{id}")]
    public async Task<IActionResult> DeleteExam(int id)
    {
        var result = await _assessmentService.DeleteExamAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Publish an exam
    /// </summary>
    [HttpPost("exams/{id}/publish")]
    public async Task<IActionResult> PublishExam(int id)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.PublishExamAsync(id, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Unpublish an exam
    /// </summary>
    [HttpPost("exams/{id}/unpublish")]
    public async Task<IActionResult> UnpublishExam(int id)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.UnpublishExamAsync(id, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Toggle exam active status
    /// </summary>
    [HttpPost("exams/{id}/toggle-status")]
    public async Task<IActionResult> ToggleExamStatus(int id)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.ToggleExamStatusAsync(id, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Clone an existing exam as a new draft exam (Create from Template)
    /// </summary>
    [HttpPost("exams/{sourceExamId}/clone")]
    public async Task<IActionResult> CloneExam(int sourceExamId, [FromBody] CloneExamDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.CloneExamAsync(sourceExamId, dto, userId);
        return result.Success ? CreatedAtAction(nameof(GetExamById), new { id = result.Data?.Id }, result) : BadRequest(result);
    }

    /// <summary>
    /// Validate exam for publishing
    /// </summary>
    [HttpGet("exams/{id}/validate")]
    public async Task<IActionResult> ValidateExamForPublish(int id)
    {
        var result = await _assessmentService.ValidateExamForPublishAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update only exam settings (result/review, proctoring, security)
    /// </summary>
    /// <remarks>
    /// Use this endpoint to update exam settings without modifying other exam properties.
    /// 
    /// **Result &amp; Review Settings:**
    /// - `showResults`: Show results to candidate after submission
    /// - `allowReview`: Allow candidate to review their answers
    /// - `showCorrectAnswers`: Show correct answers during review (requires allowReview=true)
    /// 
    /// **Proctoring Settings:**
    /// - `requireProctoring`: Enable AI/human proctoring
    /// - `requireIdVerification`: Require ID verification before starting
    /// - `requireWebcam`: Require webcam during exam
    /// 
    /// **Security Settings:**
    /// - `preventCopyPaste`: Block copy/paste operations
    /// - `preventScreenCapture`: Block screenshots/screen recording
    /// - `requireFullscreen`: Force fullscreen mode
    /// - `browserLockdown`: Enable browser lockdown mode
    /// </remarks>
    [HttpPost("exams/{id}/settings")]
    public async Task<IActionResult> UpdateExamSettings(int id, [FromBody] UpdateExamSettingsDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.UpdateExamSettingsAsync(id, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Exam Sections

    /// <summary>
    /// Get all sections for an exam
    /// </summary>
    [HttpGet("exams/{examId}/sections")]
    public async Task<IActionResult> GetExamSections(int examId)
    {
        var result = await _assessmentService.GetExamSectionsAsync(examId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get section by ID
    /// </summary>
    [HttpGet("sections/{sectionId}")]
    public async Task<IActionResult> GetSectionById(int sectionId)
    {
        var result = await _assessmentService.GetSectionByIdAsync(sectionId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Create a new section in an exam
    /// </summary>
    [HttpPost("exams/{examId}/sections")]
    public async Task<IActionResult> CreateSection(int examId, [FromBody] SaveExamSectionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.CreateSectionAsync(examId, dto, userId);
        return result.Success ? CreatedAtAction(nameof(GetSectionById), new { sectionId = result.Data?.Id }, result) : BadRequest(result);
    }

    /// <summary>
    /// Update an existing section
    /// </summary>
    [HttpPut("sections/{sectionId}")]
    public async Task<IActionResult> UpdateSection(int sectionId, [FromBody] SaveExamSectionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.UpdateSectionAsync(sectionId, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete a section
    /// </summary>
    [HttpDelete("sections/{sectionId}")]
    public async Task<IActionResult> DeleteSection(int sectionId)
    {
        var result = await _assessmentService.DeleteSectionAsync(sectionId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Reorder sections within an exam
    /// </summary>
    [HttpPost("exams/{examId}/sections/reorder")]
    public async Task<IActionResult> ReorderSections(int examId, [FromBody] List<ReorderSectionDto> reorderDtos)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.ReorderSectionsAsync(examId, reorderDtos, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Exam Topics

    /// <summary>
    /// Get all topics in a section
    /// </summary>
    [HttpGet("sections/{sectionId}/topics")]
    public async Task<IActionResult> GetSectionTopics(int sectionId)
    {
        var result = await _assessmentService.GetSectionTopicsAsync(sectionId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get topic by ID
    /// </summary>
    [HttpGet("topics/{topicId}")]
    public async Task<IActionResult> GetTopicById(int topicId)
    {
        var result = await _assessmentService.GetTopicByIdAsync(topicId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Create a new topic in a section
    /// </summary>
    [HttpPost("sections/{sectionId}/topics")]
    public async Task<IActionResult> CreateTopic(int sectionId, [FromBody] SaveExamTopicDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.CreateTopicAsync(sectionId, dto, userId);
        return result.Success ? CreatedAtAction(nameof(GetTopicById), new { topicId = result.Data?.Id }, result) : BadRequest(result);
    }

    /// <summary>
    /// Update an existing topic
    /// </summary>
    [HttpPut("topics/{topicId}")]
    public async Task<IActionResult> UpdateTopic(int topicId, [FromBody] SaveExamTopicDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.UpdateTopicAsync(topicId, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete a topic
    /// </summary>
    [HttpDelete("topics/{topicId}")]
    public async Task<IActionResult> DeleteTopic(int topicId)
    {
        var result = await _assessmentService.DeleteTopicAsync(topicId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Reorder topics within a section
    /// </summary>
    [HttpPost("sections/{sectionId}/topics/reorder")]
    public async Task<IActionResult> ReorderTopics(int sectionId, [FromBody] List<ReorderTopicDto> reorderDtos)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.ReorderTopicsAsync(sectionId, reorderDtos, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get all questions in a topic
    /// </summary>
    [HttpGet("topics/{topicId}/questions")]
    public async Task<IActionResult> GetTopicQuestions(int topicId)
    {
        var result = await _assessmentService.GetTopicQuestionsAsync(topicId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Add a single question to a topic
    /// </summary>
    [HttpPost("topics/{topicId}/questions")]
    public async Task<IActionResult> AddQuestionToTopic(int topicId, [FromBody] AddExamQuestionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.AddQuestionToTopicAsync(topicId, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Bulk add questions to a topic (simple - auto order)
    /// </summary>
    [HttpPost("topics/{topicId}/questions/bulk")]
    public async Task<IActionResult> BulkAddQuestionsToTopic(int topicId, [FromBody] BulkAddQuestionsDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.BulkAddQuestionsToTopicAsync(topicId, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Manual add questions to a topic (user selects questions with custom order/points)
    /// </summary>
    /// <remarks>
    /// Use this when the user wants to:
    /// - Select specific questions from the Question Bank
    /// - Define custom order for each question
    /// - Override points for specific questions
    /// </remarks>
    [HttpPost("topics/{topicId}/questions/manual")]
    public async Task<IActionResult> ManualAddQuestionsToTopic(int topicId, [FromBody] ManualQuestionSelectionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.ManualAddQuestionsToTopicAsync(topicId, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Random add questions to a topic (system randomly selects based on criteria)
    /// </summary>
    /// <remarks>
    /// Use this when you want to:
    /// - Automatically populate a topic with random questions
    /// - Filter by category, type, or difficulty
    /// - Ensure no duplicate questions in the exam
    /// </remarks>
    [HttpPost("topics/{topicId}/questions/random")]
    public async Task<IActionResult> RandomAddQuestionsToTopic(int topicId, [FromBody] RandomQuestionSelectionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.RandomAddQuestionsToTopicAsync(topicId, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Exam Questions

    /// <summary>
    /// Get all questions in a section
    /// </summary>
    [HttpGet("sections/{sectionId}/questions")]
    public async Task<IActionResult> GetSectionQuestions(int sectionId)
    {
        var result = await _assessmentService.GetSectionQuestionsAsync(sectionId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Add a single question to a section
    /// </summary>
    [HttpPost("sections/{sectionId}/questions")]
    public async Task<IActionResult> AddQuestionToSection(int sectionId, [FromBody] AddExamQuestionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.AddQuestionToSectionAsync(sectionId, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Bulk add questions to a section (simple - auto order)
    /// </summary>
    [HttpPost("sections/{sectionId}/questions/bulk")]
    public async Task<IActionResult> BulkAddQuestions(int sectionId, [FromBody] BulkAddQuestionsDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.BulkAddQuestionsToSectionAsync(sectionId, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Manual add questions to a section (user selects questions with custom order/points)
    /// </summary>
    /// <remarks>
    /// Use this when the user wants to:
    /// - Select specific questions from the Question Bank
    /// - Define custom order for each question
    /// - Override points for specific questions
    /// 
    /// Example:
    /// ```json
    /// {
    ///   "questions": [
    ///     { "questionId": 1, "order": 1, "pointsOverride": 5.0 },
    ///     { "questionId": 5, "order": 2, "pointsOverride": null },
    ///     { "questionId": 12, "order": 3, "pointsOverride": 10.0, "isRequired": false }
    ///   ],
    ///   "markAsRequired": true
    /// }
    /// ```
    /// </remarks>
    [HttpPost("sections/{sectionId}/questions/manual")]
    public async Task<IActionResult> ManualAddQuestionsToSection(int sectionId, [FromBody] ManualQuestionSelectionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.ManualAddQuestionsToSectionAsync(sectionId, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Random add questions to a section (system randomly selects based on criteria)
    /// </summary>
    /// <remarks>
    /// Use this when you want to:
    /// - Automatically populate a section with random questions
    /// - Filter by category, question type, or difficulty level
    /// - Ensure no duplicate questions in the exam
    /// 
    /// Example:
    /// ```json
    /// {
    ///   "count": 10,
    ///   "categoryId": 1,
    ///   "questionTypeId": 1,
    ///   "difficultyLevel": 2,
    ///   "useOriginalPoints": true,
    ///   "markAsRequired": true,
    ///   "excludeExistingInExam": true
    /// }
    /// ```
    /// 
    /// Difficulty Levels: 1=Easy, 2=Medium, 3=Hard
    /// </remarks>
    [HttpPost("sections/{sectionId}/questions/random")]
    public async Task<IActionResult> RandomAddQuestionsToSection(int sectionId, [FromBody] RandomQuestionSelectionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.RandomAddQuestionsToSectionAsync(sectionId, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update an exam question
    /// </summary>
    [HttpPut("exam-questions/{examQuestionId}")]
    public async Task<IActionResult> UpdateExamQuestion(int examQuestionId, [FromBody] UpdateExamQuestionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.UpdateExamQuestionAsync(examQuestionId, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Remove a question from an exam
    /// </summary>
    [HttpDelete("exam-questions/{examQuestionId}")]
    public async Task<IActionResult> RemoveQuestionFromExam(int examQuestionId)
    {
        var result = await _assessmentService.RemoveQuestionFromExamAsync(examQuestionId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Reorder questions within a section
    /// </summary>
    [HttpPost("sections/{sectionId}/questions/reorder")]
    public async Task<IActionResult> ReorderQuestions(int sectionId, [FromBody] List<ReorderQuestionDto> reorderDtos)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.ReorderQuestionsAsync(sectionId, reorderDtos, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Access Policy

    /// <summary>
    /// Get access policy for an exam
    /// </summary>
    [HttpGet("exams/{examId}/access-policy")]
    public async Task<IActionResult> GetAccessPolicy(int examId)
    {
        var result = await _assessmentService.GetAccessPolicyAsync(examId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create or update access policy for an exam
    /// </summary>
    [HttpPut("exams/{examId}/access-policy")]
    public async Task<IActionResult> SaveAccessPolicy(int examId, [FromBody] SaveExamAccessPolicyDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.SaveAccessPolicyAsync(examId, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Instructions

    /// <summary>
    /// Get all instructions for an exam
    /// </summary>
    [HttpGet("exams/{examId}/instructions")]
    public async Task<IActionResult> GetExamInstructions(int examId)
    {
        var result = await _assessmentService.GetExamInstructionsAsync(examId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create a new instruction for an exam
    /// </summary>
    [HttpPost("exams/{examId}/instructions")]
    public async Task<IActionResult> CreateInstruction(int examId, [FromBody] SaveExamInstructionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.CreateInstructionAsync(examId, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update an instruction
    /// </summary>
    [HttpPut("instructions/{instructionId}")]
    public async Task<IActionResult> UpdateInstruction(int instructionId, [FromBody] SaveExamInstructionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.UpdateInstructionAsync(instructionId, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete an instruction
    /// </summary>
    [HttpDelete("instructions/{instructionId}")]
    public async Task<IActionResult> DeleteInstruction(int instructionId)
    {
        var result = await _assessmentService.DeleteInstructionAsync(instructionId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Reorder instructions within an exam
    /// </summary>
    [HttpPost("exams/{examId}/instructions/reorder")]
    public async Task<IActionResult> ReorderInstructions(int examId, [FromBody] List<ReorderInstructionDto> reorderDtos)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.ReorderInstructionsAsync(examId, reorderDtos, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Exam Builder

    /// <summary>
    /// Get exam builder configuration
    /// </summary>
    [HttpGet("exams/{examId}/builder")]
    public async Task<IActionResult> GetExamBuilder(int examId)
    {
        var result = await _assessmentService.GetExamBuilderAsync(examId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Save exam builder configuration - replaces existing sections
    /// </summary>
    [HttpPut("exams/{examId}/builder")]
    public async Task<IActionResult> SaveExamBuilder(int examId, [FromBody] SaveExamBuilderRequest dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _assessmentService.SaveExamBuilderAsync(examId, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion
}
