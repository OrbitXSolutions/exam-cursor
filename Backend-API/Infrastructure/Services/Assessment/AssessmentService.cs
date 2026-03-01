using Mapster;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Assessment;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Assessment;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Assessment;

public class AssessmentService : IAssessmentService
{
  private readonly ApplicationDbContext _context;
  private readonly IDepartmentService _departmentService;
  private readonly ICurrentUserService _currentUserService;
  private readonly UserManager<ApplicationUser> _userManager;
  private const int MaxDurationMinutes = 600;
  private const int MinAccessCodeLength = 6;

  public AssessmentService(
    ApplicationDbContext context,
   IDepartmentService departmentService,
      ICurrentUserService currentUserService,
      UserManager<ApplicationUser> userManager)
  {
    _context = context;
    _departmentService = departmentService;
    _currentUserService = currentUserService;
    _userManager = userManager;
  }

  #region Exams

  public async Task<ApiResponse<PaginatedResponse<ExamListDto>>> GetAllExamsAsync(ExamSearchDto searchDto)
  {
    var query = _context.Exams
     .Include(x => x.Department)
        .Include(x => x.Sections)
.ThenInclude(s => s.Questions)
.AsQueryable();

    // Include deleted if requested
    if (searchDto.IncludeDeleted)
    {
      query = query.IgnoreQueryFilters();
    }

    // Department-based access control
    if (searchDto.FilterByUserDepartment)
    {
      var isSuperDev = await IsCurrentUserSuperDevAsync();
      if (!isSuperDev)
      {
        var userDepartmentId = await _departmentService.GetCurrentUserDepartmentIdAsync();
        if (userDepartmentId.HasValue)
        {
          query = query.Where(x => x.DepartmentId == userDepartmentId.Value);
        }
        else
        {
          // User has no department - return empty
          return ApiResponse<PaginatedResponse<ExamListDto>>.SuccessResponse(
      new PaginatedResponse<ExamListDto>
      {
        Items = new List<ExamListDto>(),
        PageNumber = searchDto.PageNumber,
        PageSize = searchDto.PageSize,
        TotalCount = 0
      });
        }
      }
    }

    // Filter by specific department if provided
    if (searchDto.DepartmentId.HasValue)
    {
      query = query.Where(x => x.DepartmentId == searchDto.DepartmentId.Value);
    }

    // Filter by exam type
    if (searchDto.ExamType.HasValue)
    {
      query = query.Where(x => x.ExamType == searchDto.ExamType.Value);
    }

    // Search filter
    if (!string.IsNullOrWhiteSpace(searchDto.Search))
    {
      var search = searchDto.Search.ToLower();
      query = query.Where(x =>
           x.TitleEn.ToLower().Contains(search) ||
         x.TitleAr.ToLower().Contains(search));
    }

    // Filter by IsPublished
    if (searchDto.IsPublished.HasValue)
    {
      query = query.Where(x => x.IsPublished == searchDto.IsPublished.Value);
    }

    // Filter by IsActive
    if (searchDto.IsActive.HasValue)
    {
      query = query.Where(x => x.IsActive == searchDto.IsActive.Value);
    }

    // Filter by date range
    if (searchDto.StartDateFrom.HasValue)
    {
      query = query.Where(x => x.StartAt >= searchDto.StartDateFrom.Value);
    }

    if (searchDto.StartDateTo.HasValue)
    {
      query = query.Where(x => x.StartAt <= searchDto.StartDateTo.Value);
    }

    // Sort by newest first
    query = query.OrderByDescending(x => x.CreatedDate);

    // Pagination
    var totalCount = await query.CountAsync();
    var items = await query
        .Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
        .Take(searchDto.PageSize)
.ToListAsync();

    var itemDtos = items.Select(MapToExamListDto).ToList();

    var response = new PaginatedResponse<ExamListDto>
    {
      Items = itemDtos,
      PageNumber = searchDto.PageNumber,
      PageSize = searchDto.PageSize,
      TotalCount = totalCount
    };

    return ApiResponse<PaginatedResponse<ExamListDto>>.SuccessResponse(response);
  }

  private const int DropdownMaxExams = 500;

  public async Task<ApiResponse<List<ExamDropdownItemDto>>> GetExamsForDropdownAsync()
  {
    var query = _context.Exams.AsQueryable();

    if (!await IsCurrentUserSuperDevAsync())
    {
      var userDepartmentId = await _departmentService.GetCurrentUserDepartmentIdAsync();
      if (userDepartmentId.HasValue)
        query = query.Where(x => x.DepartmentId == userDepartmentId.Value);
      // When user has no department (e.g. some Admin accounts), still return all exams so dropdown works
    }

    var items = await query
        .OrderByDescending(x => x.CreatedDate)
        .Take(DropdownMaxExams)
        .Select(x => new ExamDropdownItemDto
        {
          Id = x.Id,
          TitleEn = x.TitleEn,
          TitleAr = x.TitleAr ?? ""
        })
        .ToListAsync();

    return ApiResponse<List<ExamDropdownItemDto>>.SuccessResponse(items);
  }

  public async Task<ApiResponse<ExamDto>> GetExamByIdAsync(int id)
  {
    var entity = await _context.Exams
        .Include(x => x.Department)
        .Include(x => x.Sections.OrderBy(s => s.Order))
       .ThenInclude(s => s.Topics.OrderBy(t => t.Order))
      .Include(x => x.Sections.OrderBy(s => s.Order))
  .ThenInclude(s => s.Questions.OrderBy(q => q.Order))
.ThenInclude(q => q.Question)
.ThenInclude(q => q.QuestionType)
.Include(x => x.Instructions.OrderBy(i => i.Order))
   .Include(x => x.AccessPolicy)
 .FirstOrDefaultAsync(x => x.Id == id);

    if (entity == null)
    {
      return ApiResponse<ExamDto>.FailureResponse("Exam not found");
    }

    // Check department access
    var hasAccess = await HasAccessToExamAsync(entity.DepartmentId);
    if (!hasAccess)
    {
      return ApiResponse<ExamDto>.FailureResponse("You do not have access to this exam");
    }

    return ApiResponse<ExamDto>.SuccessResponse(MapToExamDto(entity));
  }

  public async Task<ApiResponse<ExamDto>> CreateExamAsync(SaveExamDto dto, string createdBy)
  {
    // Handle nullable DepartmentId - use user's department if not provided
    int departmentId;
    if (dto.DepartmentId.HasValue && dto.DepartmentId.Value > 0)
    {
      departmentId = dto.DepartmentId.Value;
    }
    else
    {
      var userDepartmentId = await _departmentService.GetCurrentUserDepartmentIdAsync();
      if (!userDepartmentId.HasValue)
      {
        return ApiResponse<ExamDto>.FailureResponse("Department ID is required. Please provide a department or ensure your user account is assigned to a department.");
      }
      departmentId = userDepartmentId.Value;
    }

    // Validate department exists
    var department = await _context.Departments.FindAsync(departmentId);
    if (department == null)
    {
      return ApiResponse<ExamDto>.FailureResponse("Department not found");
    }

    // Check if user has access to create exam in this department
    var hasAccess = await HasAccessToExamAsync(departmentId);
    if (!hasAccess)
    {
      return ApiResponse<ExamDto>.FailureResponse("You do not have permission to create exams in this department");
    }

    // Validate logical combinations
    if (dto.ShowCorrectAnswers && !dto.AllowReview)
    {
      return ApiResponse<ExamDto>.FailureResponse(
  "Cannot show correct answers without allowing review. Enable 'AllowReview' first.");
    }

    // Validate unique title within department (excluding soft-deleted)
    var titleExists = await _context.Exams
  .AnyAsync(x => x.DepartmentId == departmentId &&
   !x.IsDeleted &&
   (x.TitleEn.ToLower() == dto.TitleEn.ToLower() ||
     x.TitleAr.ToLower() == dto.TitleAr.ToLower()));

    if (titleExists)
    {
      return ApiResponse<ExamDto>.FailureResponse("An exam with this title already exists in this department");
    }

    var entity = new Exam
    {
      DepartmentId = departmentId,
      ExamType = dto.ExamType,
      TitleEn = dto.TitleEn,
      TitleAr = dto.TitleAr,
      DescriptionEn = dto.DescriptionEn,
      DescriptionAr = dto.DescriptionAr,
      StartAt = dto.StartAt,
      EndAt = dto.EndAt,
      DurationMinutes = dto.DurationMinutes,
      MaxAttempts = dto.MaxAttempts,
      ShuffleQuestions = dto.ShuffleQuestions,
      ShuffleOptions = dto.ShuffleOptions,
      PassScore = dto.PassScore,
      IsActive = dto.IsActive,
      IsPublished = false,
      // Result & Review Settings
      ShowResults = dto.ShowResults,
      AllowReview = dto.AllowReview,
      ShowCorrectAnswers = dto.ShowCorrectAnswers,
      // Proctoring Settings
      RequireProctoring = dto.RequireProctoring,
      RequireIdVerification = dto.RequireIdVerification,
      RequireWebcam = dto.RequireWebcam,
      // Security Settings
      PreventCopyPaste = dto.PreventCopyPaste,
      PreventScreenCapture = dto.PreventScreenCapture,
      RequireFullscreen = dto.RequireFullscreen,
      BrowserLockdown = dto.BrowserLockdown,
      CreatedDate = DateTime.UtcNow,
      CreatedBy = createdBy
    };

    _context.Exams.Add(entity);
    await _context.SaveChangesAsync();

    return await GetExamByIdAsync(entity.Id);
  }

  public async Task<ApiResponse<ExamDto>> UpdateExamAsync(int id, SaveExamDto dto, string updatedBy)
  {
    var entity = await _context.Exams
        .Include(x => x.Sections)
.ThenInclude(s => s.Questions)
    .FirstOrDefaultAsync(x => x.Id == id);

    if (entity == null)
    {
      return ApiResponse<ExamDto>.FailureResponse("Exam not found");
    }

    // Check department access
    var hasAccess = await HasAccessToExamAsync(entity.DepartmentId);
    if (!hasAccess)
    {
      return ApiResponse<ExamDto>.FailureResponse("You do not have permission to update this exam");
    }

    // Handle nullable DepartmentId - use existing if not provided
    int newDepartmentId = dto.DepartmentId.HasValue && dto.DepartmentId.Value > 0
? dto.DepartmentId.Value
     : entity.DepartmentId;

    // Check if published exam has attempts
    if (entity.IsPublished)
    {
      var hasStructuralChanges = dto.DurationMinutes != entity.DurationMinutes ||
          dto.PassScore != entity.PassScore;

      if (hasStructuralChanges)
      {
        return ApiResponse<ExamDto>.FailureResponse(
     "Cannot modify duration or pass score of a published exam. Unpublish the exam first or create a new version.");
      }
    }

    // Validate logical combinations
    if (dto.ShowCorrectAnswers && !dto.AllowReview)
    {
      return ApiResponse<ExamDto>.FailureResponse(
       "Cannot show correct answers without allowing review. Enable 'AllowReview' first.");
    }

    // Validate unique title within department (excluding current exam and soft-deleted)
    var titleExists = await _context.Exams
.AnyAsync(x => x.Id != id &&
    x.DepartmentId == newDepartmentId &&
   !x.IsDeleted &&
   (x.TitleEn.ToLower() == dto.TitleEn.ToLower() ||
   x.TitleAr.ToLower() == dto.TitleAr.ToLower()));

    if (titleExists)
    {
      return ApiResponse<ExamDto>.FailureResponse("An exam with this title already exists in this department");
    }

    entity.DepartmentId = newDepartmentId;
    entity.ExamType = dto.ExamType;
    entity.TitleEn = dto.TitleEn;
    entity.TitleAr = dto.TitleAr;
    entity.DescriptionEn = dto.DescriptionEn;
    entity.DescriptionAr = dto.DescriptionAr;
    entity.StartAt = dto.StartAt;
    entity.EndAt = dto.EndAt;
    entity.DurationMinutes = dto.DurationMinutes;
    entity.MaxAttempts = dto.MaxAttempts;
    entity.ShuffleQuestions = dto.ShuffleQuestions;
    entity.ShuffleOptions = dto.ShuffleOptions;
    entity.PassScore = dto.PassScore;
    entity.IsActive = dto.IsActive;
    // Result & Review Settings
    entity.ShowResults = dto.ShowResults;
    entity.AllowReview = dto.AllowReview;
    entity.ShowCorrectAnswers = dto.ShowCorrectAnswers;
    // Proctoring Settings
    entity.RequireProctoring = dto.RequireProctoring;
    entity.RequireIdVerification = dto.RequireIdVerification;
    entity.RequireWebcam = dto.RequireWebcam;
    // Security Settings
    entity.PreventCopyPaste = dto.PreventCopyPaste;
    entity.PreventScreenCapture = dto.PreventScreenCapture;
    entity.RequireFullscreen = dto.RequireFullscreen;
    entity.BrowserLockdown = dto.BrowserLockdown;
    entity.UpdatedDate = DateTime.UtcNow;
    entity.UpdatedBy = updatedBy;

    await _context.SaveChangesAsync();

    return await GetExamByIdAsync(entity.Id);
  }

  public async Task<ApiResponse<bool>> DeleteExamAsync(int id)
  {
    var entity = await _context.Exams
        .IgnoreQueryFilters()
  .FirstOrDefaultAsync(x => x.Id == id);

    if (entity == null)
    {
      return ApiResponse<bool>.FailureResponse("Exam not found");
    }

    // Check if exam has any candidate attempts (including soft-deleted ones)
    var hasAttempts = await _context.Attempts.IgnoreQueryFilters().AnyAsync(a => a.ExamId == id);
    if (hasAttempts)
    {
      return ApiResponse<bool>.FailureResponse(
        "Cannot delete this exam because it has candidate attempts. You can archive it instead.");
    }

    // Soft delete
    entity.IsDeleted = true;
    entity.UpdatedDate = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return ApiResponse<bool>.SuccessResponse(true, "Exam deleted successfully");
  }

  public async Task<ApiResponse<bool>> PublishExamAsync(int id, string updatedBy)
  {
    var validationResult = await ValidateExamForPublishAsync(id);

    if (!validationResult.Success || !validationResult.Data!.IsValid)
    {
      return ApiResponse<bool>.FailureResponse(
                  "Exam cannot be published",
          validationResult.Data?.Errors ?? new List<string>());
    }

    var entity = await _context.Exams.FindAsync(id);
    if (entity == null)
    {
      return ApiResponse<bool>.FailureResponse("Exam not found");
    }

    entity.IsPublished = true;
    entity.UpdatedDate = DateTime.UtcNow;
    entity.UpdatedBy = updatedBy;

    await _context.SaveChangesAsync();

    return ApiResponse<bool>.SuccessResponse(true, "Exam published successfully");
  }

  public async Task<ApiResponse<bool>> UnpublishExamAsync(int id, string updatedBy)
  {
    var entity = await _context.Exams.FindAsync(id);

    if (entity == null)
    {
      return ApiResponse<bool>.FailureResponse("Exam not found");
    }

    entity.IsPublished = false;
    entity.UpdatedDate = DateTime.UtcNow;
    entity.UpdatedBy = updatedBy;

    await _context.SaveChangesAsync();

    return ApiResponse<bool>.SuccessResponse(true, "Exam unpublished successfully");
  }

  public async Task<ApiResponse<bool>> ToggleExamStatusAsync(int id, string updatedBy)
  {
    var entity = await _context.Exams.FindAsync(id);

    if (entity == null)
    {
      return ApiResponse<bool>.FailureResponse("Exam not found");
    }

    entity.IsActive = !entity.IsActive;
    entity.UpdatedDate = DateTime.UtcNow;
    entity.UpdatedBy = updatedBy;

    await _context.SaveChangesAsync();

    var status = entity.IsActive ? "activated" : "deactivated";
    return ApiResponse<bool>.SuccessResponse(true, $"Exam {status} successfully");
  }

  public async Task<ApiResponse<ExamDto>> UpdateExamSettingsAsync(int id, UpdateExamSettingsDto dto, string updatedBy)
  {
    var entity = await _context.Exams
.Include(x => x.Department)
 .FirstOrDefaultAsync(x => x.Id == id);

    if (entity == null)
    {
      return ApiResponse<ExamDto>.FailureResponse("Exam not found");
    }

    // Check department access
    var hasAccess = await HasAccessToExamAsync(entity.DepartmentId);
    if (!hasAccess)
    {
      return ApiResponse<ExamDto>.FailureResponse("You do not have permission to update this exam");
    }

    // Validate logical combinations
    if (dto.ShowCorrectAnswers && !dto.AllowReview)
    {
      return ApiResponse<ExamDto>.FailureResponse(
             "Cannot show correct answers without allowing review. Enable 'AllowReview' first.");
    }

    // Update Result & Review Settings
    entity.ShowResults = dto.ShowResults;
    entity.AllowReview = dto.AllowReview;
    entity.ShowCorrectAnswers = dto.ShowCorrectAnswers;

    // Update Proctoring Settings
    entity.RequireProctoring = dto.RequireProctoring;
    entity.RequireIdVerification = dto.RequireIdVerification;
    entity.RequireWebcam = dto.RequireWebcam;

    // Update Security Settings
    entity.PreventCopyPaste = dto.PreventCopyPaste;
    entity.PreventScreenCapture = dto.PreventScreenCapture;
    entity.RequireFullscreen = dto.RequireFullscreen;
    entity.BrowserLockdown = dto.BrowserLockdown;

    entity.UpdatedDate = DateTime.UtcNow;
    entity.UpdatedBy = updatedBy;

    await _context.SaveChangesAsync();

    return await GetExamByIdAsync(entity.Id);
  }

  #endregion

  #region Exam Sections

  public async Task<ApiResponse<List<ExamSectionDto>>> GetExamSectionsAsync(int examId)
  {
    var examExists = await _context.Exams.AnyAsync(x => x.Id == examId);
    if (!examExists)
    {
      return ApiResponse<List<ExamSectionDto>>.FailureResponse("Exam not found");
    }

    var sections = await _context.ExamSections
      .Include(x => x.Topics.OrderBy(t => t.Order))
      .Include(x => x.Questions.OrderBy(q => q.Order))
 .ThenInclude(q => q.Question)
      .ThenInclude(q => q.QuestionType)
.Where(x => x.ExamId == examId)
.OrderBy(x => x.Order)
 .ToListAsync();

    var dtos = sections.Select(MapToExamSectionDto).ToList();
    return ApiResponse<List<ExamSectionDto>>.SuccessResponse(dtos);
  }

  public async Task<ApiResponse<ExamSectionDto>> GetSectionByIdAsync(int sectionId)
  {
    var section = await _context.ExamSections
               .Include(x => x.Questions.OrderBy(q => q.Order))
        .ThenInclude(q => q.Question)
          .ThenInclude(q => q.QuestionType)
            .FirstOrDefaultAsync(x => x.Id == sectionId);

    if (section == null)
    {
      return ApiResponse<ExamSectionDto>.FailureResponse("Section not found");
    }

    return ApiResponse<ExamSectionDto>.SuccessResponse(MapToExamSectionDto(section));
  }

  public async Task<ApiResponse<ExamSectionDto>> CreateSectionAsync(int examId, SaveExamSectionDto dto, string createdBy)
  {
    var exam = await _context.Exams
      .FirstOrDefaultAsync(x => x.Id == examId);

    if (exam == null)
    {
      return ApiResponse<ExamSectionDto>.FailureResponse("Exam not found");
    }

    // Check if requested order conflicts with existing non-deleted sections
    var orderExists = await _context.ExamSections
        .IgnoreQueryFilters()
.AnyAsync(x => x.ExamId == examId && x.Order == dto.Order && !x.IsDeleted);

    string? warningMessage = null;
    int assignedOrder = dto.Order;

    if (orderExists)
    {
      // Auto-assign next available order instead of failing
      var maxOrder = await _context.ExamSections
          .IgnoreQueryFilters()
.Where(x => x.ExamId == examId && !x.IsDeleted)
  .MaxAsync(x => (int?)x.Order) ?? 0;

      assignedOrder = maxOrder + 1;
      warningMessage = $"Order {dto.Order} was already taken. Section was assigned order {assignedOrder} instead.";
    }

    var entity = new ExamSection
    {
      ExamId = examId,
      TitleEn = dto.TitleEn,
      TitleAr = dto.TitleAr,
      DescriptionEn = dto.DescriptionEn,
      DescriptionAr = dto.DescriptionAr,
      Order = assignedOrder,
      DurationMinutes = dto.DurationMinutes,
      TotalPointsOverride = dto.TotalPointsOverride,
      CreatedDate = DateTime.UtcNow,
      CreatedBy = createdBy
    };

    _context.ExamSections.Add(entity);
    await _context.SaveChangesAsync();

    var result = await GetSectionByIdAsync(entity.Id);

    // Add warning message if order was auto-adjusted
    if (warningMessage != null && result.Success)
    {
      result.Message = warningMessage;
    }

    return result;
  }

  public async Task<ApiResponse<ExamSectionDto>> UpdateSectionAsync(int sectionId, SaveExamSectionDto dto, string updatedBy)
  {
    var entity = await _context.ExamSections
   .Include(x => x.Exam)
  .FirstOrDefaultAsync(x => x.Id == sectionId);

    if (entity == null)
    {
      return ApiResponse<ExamSectionDto>.FailureResponse("Section not found");
    }

    string? warningMessage = null;
    int assignedOrder = dto.Order;

    // Check if requested order conflicts with existing non-deleted sections (excluding current)
    var orderExists = await _context.ExamSections
   .IgnoreQueryFilters()
 .AnyAsync(x => x.ExamId == entity.ExamId &&
x.Id != sectionId &&
x.Order == dto.Order &&
   !x.IsDeleted);

    if (orderExists)
    {
      // Auto-assign next available order instead of failing
      var maxOrder = await _context.ExamSections
       .IgnoreQueryFilters()
            .Where(x => x.ExamId == entity.ExamId && !x.IsDeleted)
     .MaxAsync(x => (int?)x.Order) ?? 0;

      assignedOrder = maxOrder + 1;
      warningMessage = $"Order {dto.Order} was already taken. Section was assigned order {assignedOrder} instead.";
    }

    entity.TitleEn = dto.TitleEn;
    entity.TitleAr = dto.TitleAr;
    entity.DescriptionEn = dto.DescriptionEn;
    entity.DescriptionAr = dto.DescriptionAr;
    entity.Order = assignedOrder;
    entity.DurationMinutes = dto.DurationMinutes;
    entity.TotalPointsOverride = dto.TotalPointsOverride;
    entity.UpdatedDate = DateTime.UtcNow;
    entity.UpdatedBy = updatedBy;

    await _context.SaveChangesAsync();

    var result = await GetSectionByIdAsync(entity.Id);

    // Add warning message if order was auto-adjusted
    if (warningMessage != null && result.Success)
    {
      result.Message = warningMessage;
    }

    return result;
  }

  public async Task<ApiResponse<bool>> DeleteSectionAsync(int sectionId)
  {
    var entity = await _context.ExamSections
 .Include(x => x.Exam)
      .FirstOrDefaultAsync(x => x.Id == sectionId);

    if (entity == null)
    {
      return ApiResponse<bool>.FailureResponse("Section not found");
    }

    if (entity.Exam.IsPublished)
    {
      return ApiResponse<bool>.FailureResponse(
      "Cannot delete a section from a published exam. Unpublish the exam first.");
    }

    // Soft delete
    entity.IsDeleted = true;
    entity.UpdatedDate = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return ApiResponse<bool>.SuccessResponse(true, "Section deleted successfully");
  }

  public async Task<ApiResponse<bool>> ReorderSectionsAsync(int examId, List<ReorderSectionDto> reorderDtos, string updatedBy)
  {
    var examExists = await _context.Exams.AnyAsync(x => x.Id == examId);
    if (!examExists)
    {
      return ApiResponse<bool>.FailureResponse("Exam not found");
    }

    var sections = await _context.ExamSections
    .Where(x => x.ExamId == examId)
  .ToListAsync();

    // Validate all section IDs exist
    var sectionIds = reorderDtos.Select(x => x.SectionId).ToList();
    var existingSectionIds = sections.Select(x => x.Id).ToList();
    var invalidIds = sectionIds.Except(existingSectionIds).ToList();

    if (invalidIds.Any())
    {
      return ApiResponse<bool>.FailureResponse(
        $"Section IDs not found: {string.Join(", ", invalidIds)}");
    }

    // Validate unique orders
    var orders = reorderDtos.Select(x => x.NewOrder).ToList();
    if (orders.Distinct().Count() != orders.Count)
    {
      return ApiResponse<bool>.FailureResponse("Duplicate order values are not allowed");
    }

    foreach (var reorder in reorderDtos)
    {
      var section = sections.First(x => x.Id == reorder.SectionId);
      section.Order = reorder.NewOrder;
      section.UpdatedDate = DateTime.UtcNow;
      section.UpdatedBy = updatedBy;
    }

    await _context.SaveChangesAsync();

    return ApiResponse<bool>.SuccessResponse(true, "Sections reordered successfully");
  }

  #endregion

  #region Exam Questions

  public async Task<ApiResponse<List<ExamQuestionDto>>> GetSectionQuestionsAsync(int sectionId)
  {
    var sectionExists = await _context.ExamSections.AnyAsync(x => x.Id == sectionId);
    if (!sectionExists)
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse("Section not found");
    }

    var questions = await _context.ExamQuestions
         .Include(x => x.Question)
             .ThenInclude(q => q.QuestionType)
          .Where(x => x.ExamSectionId == sectionId)
       .OrderBy(x => x.Order)
   .ToListAsync();

    var dtos = questions.Select(MapToExamQuestionDto).ToList();
    return ApiResponse<List<ExamQuestionDto>>.SuccessResponse(dtos);
  }

  public async Task<ApiResponse<ExamQuestionDto>> AddQuestionToSectionAsync(int sectionId, AddExamQuestionDto dto, string createdBy)
  {
    var section = await _context.ExamSections
     .Include(x => x.Exam)
 .FirstOrDefaultAsync(x => x.Id == sectionId);

    if (section == null)
    {
      return ApiResponse<ExamQuestionDto>.FailureResponse("Section not found");
    }

    // Validate question exists and is active
    var question = await _context.Questions.FindAsync(dto.QuestionId);
    if (question == null)
    {
      return ApiResponse<ExamQuestionDto>.FailureResponse("Question not found in Question Bank");
    }

    if (!question.IsActive)
    {
      return ApiResponse<ExamQuestionDto>.FailureResponse(
"Cannot add inactive question to exam. Activate the question first.");
    }

    // Check if question already exists in this exam (exclude soft-deleted)
    var questionExistsInExam = await _context.ExamQuestions
   .IgnoreQueryFilters()
    .AnyAsync(x => x.ExamId == section.ExamId && x.QuestionId == dto.QuestionId && !x.IsDeleted);

    if (questionExistsInExam)
    {
      return ApiResponse<ExamQuestionDto>.FailureResponse(
    "This question already exists in the exam. Each question can only be added once.");
    }

    string? warningMessage = null;
    int assignedOrder = dto.Order;

    // Check if requested order conflicts with existing non-deleted questions
    var orderExists = await _context.ExamQuestions
.IgnoreQueryFilters()
.AnyAsync(x => x.ExamSectionId == sectionId && x.Order == dto.Order && !x.IsDeleted);

    if (orderExists)
    {
      // Auto-assign next available order instead of failing
      var maxOrder = await _context.ExamQuestions
    .IgnoreQueryFilters()
         .Where(x => x.ExamSectionId == sectionId && !x.IsDeleted)
        .MaxAsync(x => (int?)x.Order) ?? 0;

      assignedOrder = maxOrder + 1;
      warningMessage = $"Order {dto.Order} was already taken. Question was assigned order {assignedOrder} instead.";
    }

    var entity = new ExamQuestion
    {
      ExamId = section.ExamId,
      ExamSectionId = sectionId,
      QuestionId = dto.QuestionId,
      Order = assignedOrder,
      Points = dto.PointsOverride ?? question.Points,
      IsRequired = dto.IsRequired,
      CreatedDate = DateTime.UtcNow,
      CreatedBy = createdBy
    };

    _context.ExamQuestions.Add(entity);
    await _context.SaveChangesAsync();

    // Reload with includes
    var result = await _context.ExamQuestions
.Include(x => x.Question)
 .ThenInclude(q => q.QuestionType)
.FirstOrDefaultAsync(x => x.Id == entity.Id);

    var response = ApiResponse<ExamQuestionDto>.SuccessResponse(
       MapToExamQuestionDto(result!),
            warningMessage ?? "Question added to section successfully");

    return response;
  }

  public async Task<ApiResponse<List<ExamQuestionDto>>> BulkAddQuestionsToSectionAsync(int sectionId, BulkAddQuestionsDto dto, string createdBy)
  {
    var section = await _context.ExamSections
         .Include(x => x.Exam)
      .FirstOrDefaultAsync(x => x.Id == sectionId);

    if (section == null)
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse("Section not found");
    }

    // Validate all questions exist
    var questions = await _context.Questions
   .Where(x => dto.QuestionIds.Contains(x.Id))
   .ToListAsync();

    var missingIds = dto.QuestionIds.Except(questions.Select(x => x.Id)).ToList();
    if (missingIds.Any())
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse(
  $"Questions not found: {string.Join(", ", missingIds)}");
    }

    // Check for inactive questions
    var inactiveQuestions = questions.Where(x => !x.IsActive).ToList();
    if (inactiveQuestions.Any())
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse(
 $"Cannot add inactive questions: {string.Join(", ", inactiveQuestions.Select(x => x.Id))}");
    }

    // Check for duplicates in exam (exclude soft-deleted) - skip silently instead of error
    var existingQuestionIds = await _context.ExamQuestions
  .IgnoreQueryFilters()
.Where(x => x.ExamId == section.ExamId && dto.QuestionIds.Contains(x.QuestionId) && !x.IsDeleted)
.Select(x => x.QuestionId)
  .ToListAsync();

    // Filter out already existing questions
    var questionsToAdd = questions.Where(q => !existingQuestionIds.Contains(q.Id)).ToList();

    if (!questionsToAdd.Any())
    {
      // All questions already exist - return current list with message
      var currentResult = await GetSectionQuestionsAsync(sectionId);
      currentResult.Message = "All questions already exist in the exam. No new questions added.";
      return currentResult;
    }

    // Get max order in section (exclude soft-deleted)
    var maxOrder = await _context.ExamQuestions
     .IgnoreQueryFilters()
   .Where(x => x.ExamSectionId == sectionId && !x.IsDeleted)
   .MaxAsync(x => (int?)x.Order) ?? 0;

    var entities = new List<ExamQuestion>();
    foreach (var question in questionsToAdd)
    {
      maxOrder++;
      entities.Add(new ExamQuestion
      {
        ExamId = section.ExamId,
        ExamSectionId = sectionId,
        QuestionId = question.Id,
        Order = maxOrder,
        Points = dto.UseOriginalPoints ? question.Points : 0,
        IsRequired = dto.MarkAsRequired,
        CreatedDate = DateTime.UtcNow,
        CreatedBy = createdBy
      });
    }

    _context.ExamQuestions.AddRange(entities);
    await _context.SaveChangesAsync();

    var result = await GetSectionQuestionsAsync(sectionId);

    // Add info about skipped questions
    if (existingQuestionIds.Any())
    {
      result.Message = $"Added {questionsToAdd.Count} questions. Skipped {existingQuestionIds.Count} duplicate(s).";
    }

    return result;
  }

  public async Task<ApiResponse<ExamQuestionDto>> UpdateExamQuestionAsync(int examQuestionId, UpdateExamQuestionDto dto, string updatedBy)
  {
    var entity = await _context.ExamQuestions
                .Include(x => x.ExamSection)
             .ThenInclude(s => s.Exam)
      .Include(x => x.Question)
         .ThenInclude(q => q.QuestionType)
                .FirstOrDefaultAsync(x => x.Id == examQuestionId);

    if (entity == null)
    {
      return ApiResponse<ExamQuestionDto>.FailureResponse("Exam question not found");
    }

    string? warningMessage = null;
    int assignedOrder = dto.Order;

    // Check if requested order conflicts with existing non-deleted questions (excluding current)
    var orderExists = await _context.ExamQuestions
.IgnoreQueryFilters()
.AnyAsync(x => x.ExamSectionId == entity.ExamSectionId &&
x.Id != examQuestionId &&
x.Order == dto.Order &&
        !x.IsDeleted);

    if (orderExists)
    {
      // Auto-assign next available order instead of failing
      var maxOrder = await _context.ExamQuestions
     .IgnoreQueryFilters()
      .Where(x => x.ExamSectionId == entity.ExamSectionId && !x.IsDeleted)
  .MaxAsync(x => (int?)x.Order) ?? 0;

      assignedOrder = maxOrder + 1;
      warningMessage = $"Order {dto.Order} was already taken. Question was assigned order {assignedOrder} instead.";
    }

    entity.Order = assignedOrder;
    entity.Points = dto.Points;
    entity.IsRequired = dto.IsRequired;
    entity.UpdatedDate = DateTime.UtcNow;
    entity.UpdatedBy = updatedBy;

    await _context.SaveChangesAsync();

    return ApiResponse<ExamQuestionDto>.SuccessResponse(
MapToExamQuestionDto(entity),
warningMessage ?? "Exam question updated successfully");
  }

  public async Task<ApiResponse<bool>> RemoveQuestionFromExamAsync(int examQuestionId)
  {
    var entity = await _context.ExamQuestions
  .Include(x => x.ExamSection)
    .ThenInclude(s => s.Exam)
.FirstOrDefaultAsync(x => x.Id == examQuestionId);

    if (entity == null)
    {
      return ApiResponse<bool>.FailureResponse("Exam question not found");
    }

    if (entity.ExamSection.Exam.IsPublished)
    {
      return ApiResponse<bool>.FailureResponse(
     "Cannot remove question from a published exam. Unpublish the exam first.");
    }

    // Soft delete
    entity.IsDeleted = true;
    entity.UpdatedDate = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return ApiResponse<bool>.SuccessResponse(true, "Question removed from exam successfully");
  }

  public async Task<ApiResponse<bool>> ReorderQuestionsAsync(int sectionId, List<ReorderQuestionDto> reorderDtos, string updatedBy)
  {
    var sectionExists = await _context.ExamSections.AnyAsync(x => x.Id == sectionId);
    if (!sectionExists)
    {
      return ApiResponse<bool>.FailureResponse("Section not found");
    }

    var questions = await _context.ExamQuestions
        .Where(x => x.ExamSectionId == sectionId)
 .ToListAsync();

    // Validate all question IDs exist
    var questionIds = reorderDtos.Select(x => x.ExamQuestionId).ToList();
    var existingQuestionIds = questions.Select(x => x.Id).ToList();
    var invalidIds = questionIds.Except(existingQuestionIds).ToList();

    if (invalidIds.Any())
    {
      return ApiResponse<bool>.FailureResponse(
 $"Exam question IDs not found: {string.Join(", ", invalidIds)}");
    }

    // Validate unique orders
    var orders = reorderDtos.Select(x => x.NewOrder).ToList();
    if (orders.Distinct().Count() != orders.Count)
    {
      return ApiResponse<bool>.FailureResponse("Duplicate order values are not allowed");
    }

    foreach (var reorder in reorderDtos)
    {
      var question = questions.First(x => x.Id == reorder.ExamQuestionId);
      question.Order = reorder.NewOrder;
      question.UpdatedDate = DateTime.UtcNow;
      question.UpdatedBy = updatedBy;
    }

    await _context.SaveChangesAsync();

    return ApiResponse<bool>.SuccessResponse(true, "Questions reordered successfully");
  }

  #endregion

  #region Access Policy

  public async Task<ApiResponse<ExamAccessPolicyDto>> GetAccessPolicyAsync(int examId)
  {
    var examExists = await _context.Exams.AnyAsync(x => x.Id == examId);
    if (!examExists)
    {
      return ApiResponse<ExamAccessPolicyDto>.FailureResponse("Exam not found");
    }

    var policy = await _context.ExamAccessPolicies
        .FirstOrDefaultAsync(x => x.ExamId == examId);

    if (policy == null)
    {
      // Return default policy
      return ApiResponse<ExamAccessPolicyDto>.SuccessResponse(new ExamAccessPolicyDto
      {
        ExamId = examId,
        IsPublic = false,
        RestrictToAssignedCandidates = false
      });
    }

    return ApiResponse<ExamAccessPolicyDto>.SuccessResponse(policy.Adapt<ExamAccessPolicyDto>());
  }

  public async Task<ApiResponse<ExamAccessPolicyDto>> SaveAccessPolicyAsync(int examId, SaveExamAccessPolicyDto dto, string userId)
  {
    var examExists = await _context.Exams.AnyAsync(x => x.Id == examId);
    if (!examExists)
    {
      return ApiResponse<ExamAccessPolicyDto>.FailureResponse("Exam not found");
    }

    // Validate access code if provided
    if (!string.IsNullOrEmpty(dto.AccessCode) && dto.AccessCode.Length < MinAccessCodeLength)
    {
      return ApiResponse<ExamAccessPolicyDto>.FailureResponse(
 $"Access code must be at least {MinAccessCodeLength} characters");
    }

    var existingPolicy = await _context.ExamAccessPolicies
.FirstOrDefaultAsync(x => x.ExamId == examId);

    if (existingPolicy == null)
    {
      // Create new
      var entity = new ExamAccessPolicy
      {
        ExamId = examId,
        IsPublic = dto.IsPublic,
        AccessCode = dto.AccessCode,
        RestrictToAssignedCandidates = dto.RestrictToAssignedCandidates,
        CreatedDate = DateTime.UtcNow,
        CreatedBy = userId
      };

      _context.ExamAccessPolicies.Add(entity);
      await _context.SaveChangesAsync();

      return ApiResponse<ExamAccessPolicyDto>.SuccessResponse(
    entity.Adapt<ExamAccessPolicyDto>(),
       "Access policy created successfully");
    }
    else
    {
      // Update existing
      existingPolicy.IsPublic = dto.IsPublic;
      existingPolicy.AccessCode = dto.AccessCode;
      existingPolicy.RestrictToAssignedCandidates = dto.RestrictToAssignedCandidates;
      existingPolicy.UpdatedDate = DateTime.UtcNow;
      existingPolicy.UpdatedBy = userId;

      await _context.SaveChangesAsync();

      return ApiResponse<ExamAccessPolicyDto>.SuccessResponse(
      existingPolicy.Adapt<ExamAccessPolicyDto>(),
"Access policy updated successfully");
    }
  }

  #endregion

  #region Instructions

  public async Task<ApiResponse<List<ExamInstructionDto>>> GetExamInstructionsAsync(int examId)
  {
    var examExists = await _context.Exams.AnyAsync(x => x.Id == examId);
    if (!examExists)
    {
      return ApiResponse<List<ExamInstructionDto>>.FailureResponse("Exam not found");
    }

    var instructions = await _context.ExamInstructions
        .Where(x => x.ExamId == examId)
.OrderBy(x => x.Order)
  .ToListAsync();

    return ApiResponse<List<ExamInstructionDto>>.SuccessResponse(
          instructions.Adapt<List<ExamInstructionDto>>());
  }

  public async Task<ApiResponse<ExamInstructionDto>> CreateInstructionAsync(int examId, SaveExamInstructionDto dto, string createdBy)
  {
    var examExists = await _context.Exams.AnyAsync(x => x.Id == examId);
    if (!examExists)
    {
      return ApiResponse<ExamInstructionDto>.FailureResponse("Exam not found");
    }

    string? warningMessage = null;
    int assignedOrder = dto.Order;

    // Check if requested order conflicts with existing non-deleted instructions
    var orderExists = await _context.ExamInstructions
 .IgnoreQueryFilters()
.AnyAsync(x => x.ExamId == examId && x.Order == dto.Order && !x.IsDeleted);

    if (orderExists)
    {
      // Auto-assign next available order instead of failing
      var maxOrder = await _context.ExamInstructions
          .IgnoreQueryFilters()
               .Where(x => x.ExamId == examId && !x.IsDeleted)
       .MaxAsync(x => (int?)x.Order) ?? 0;

      assignedOrder = maxOrder + 1;
      warningMessage = $"Order {dto.Order} was already taken. Instruction was assigned order {assignedOrder} instead.";
    }

    var entity = new ExamInstruction
    {
      ExamId = examId,
      ContentEn = dto.ContentEn,
      ContentAr = dto.ContentAr,
      Order = assignedOrder,
      CreatedDate = DateTime.UtcNow,
      CreatedBy = createdBy
    };

    _context.ExamInstructions.Add(entity);
    await _context.SaveChangesAsync();

    return ApiResponse<ExamInstructionDto>.SuccessResponse(
entity.Adapt<ExamInstructionDto>(),
   warningMessage ?? "Instruction created successfully");
  }

  public async Task<ApiResponse<ExamInstructionDto>> UpdateInstructionAsync(int instructionId, SaveExamInstructionDto dto, string updatedBy)
  {
    var entity = await _context.ExamInstructions.FindAsync(instructionId);

    if (entity == null)
    {
      return ApiResponse<ExamInstructionDto>.FailureResponse("Instruction not found");
    }

    string? warningMessage = null;
    int assignedOrder = dto.Order;

    // Check if requested order conflicts with existing non-deleted instructions (excluding current)
    var orderExists = await _context.ExamInstructions
  .IgnoreQueryFilters()
  .AnyAsync(x => x.ExamId == entity.ExamId &&
 x.Id != instructionId &&
x.Order == dto.Order &&
!x.IsDeleted);

    if (orderExists)
    {
      // Auto-assign next available order instead of failing
      var maxOrder = await _context.ExamInstructions
     .IgnoreQueryFilters()
      .Where(x => x.ExamId == entity.ExamId && !x.IsDeleted)
            .MaxAsync(x => (int?)x.Order) ?? 0;

      assignedOrder = maxOrder + 1;
      warningMessage = $"Order {dto.Order} was already taken. Instruction was assigned order {assignedOrder} instead.";
    }

    entity.ContentEn = dto.ContentEn;
    entity.ContentAr = dto.ContentAr;
    entity.Order = assignedOrder;
    entity.UpdatedDate = DateTime.UtcNow;
    entity.UpdatedBy = updatedBy;

    await _context.SaveChangesAsync();

    return ApiResponse<ExamInstructionDto>.SuccessResponse(
entity.Adapt<ExamInstructionDto>(),
  warningMessage ?? "Instruction updated successfully");
  }

  public async Task<ApiResponse<bool>> DeleteInstructionAsync(int instructionId)
  {
    var entity = await _context.ExamInstructions
     .IgnoreQueryFilters()
        .FirstOrDefaultAsync(x => x.Id == instructionId);

    if (entity == null)
    {
      return ApiResponse<bool>.FailureResponse("Instruction not found");
    }

    // Soft delete
    entity.IsDeleted = true;
    entity.UpdatedDate = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return ApiResponse<bool>.SuccessResponse(true, "Instruction deleted successfully");
  }

  public async Task<ApiResponse<bool>> ReorderInstructionsAsync(int examId, List<ReorderInstructionDto> reorderDtos, string updatedBy)
  {
    var examExists = await _context.Exams.AnyAsync(x => x.Id == examId);
    if (!examExists)
    {
      return ApiResponse<bool>.FailureResponse("Exam not found");
    }

    var instructions = await _context.ExamInstructions
          .Where(x => x.ExamId == examId)
        .ToListAsync();

    // Validate all instruction IDs exist
    var instructionIds = reorderDtos.Select(x => x.InstructionId).ToList();
    var existingInstructionIds = instructions.Select(x => x.Id).ToList();
    var invalidIds = instructionIds.Except(existingInstructionIds).ToList();

    if (invalidIds.Any())
    {
      return ApiResponse<bool>.FailureResponse(
$"Instruction IDs not found: {string.Join(", ", invalidIds)}");
    }

    // Validate unique orders
    var orders = reorderDtos.Select(x => x.NewOrder).ToList();
    if (orders.Distinct().Count() != orders.Count)
    {
      return ApiResponse<bool>.FailureResponse("Duplicate order values are not allowed");
    }

    foreach (var reorder in reorderDtos)
    {
      var instruction = instructions.First(x => x.Id == reorder.InstructionId);
      instruction.Order = reorder.NewOrder;
      instruction.UpdatedDate = DateTime.UtcNow;
      instruction.UpdatedBy = updatedBy;
    }

    await _context.SaveChangesAsync();

    return ApiResponse<bool>.SuccessResponse(true, "Instructions reordered successfully");
  }

  #endregion

  #region Validation

  public async Task<ApiResponse<ExamValidationResultDto>> ValidateExamForPublishAsync(int examId)
  {
    var exam = await _context.Exams
   .Include(x => x.Sections.Where(s => !s.IsDeleted))
      .ThenInclude(s => s.Questions.Where(q => !q.IsDeleted))
 .ThenInclude(q => q.Question)
     .ThenInclude(q => q.QuestionType)
        .Include(x => x.Sections.Where(s => !s.IsDeleted))
.ThenInclude(s => s.Questions.Where(q => !q.IsDeleted))
 .ThenInclude(q => q.Question)
 .ThenInclude(q => q.Options)
.FirstOrDefaultAsync(x => x.Id == examId);

    if (exam == null)
    {
      return ApiResponse<ExamValidationResultDto>.FailureResponse("Exam not found");
    }

    var result = new ExamValidationResultDto { IsValid = true };

    // Rule: Exam must have at least one section
    if (!exam.Sections.Any())
    {
      result.IsValid = false;
      result.Errors.Add("Exam must have at least one section");
    }

    // Rule: Each section must have at least one question (or be a valid Builder section)
    foreach (var section in exam.Sections)
    {
      // Builder mode: SourceType is set with QuestionSubjectId and PickCount
      if (section.SourceType.HasValue && section.QuestionSubjectId.HasValue)
      {
        // Builder section - validate PickCount
        if (section.PickCount <= 0)
        {
          result.IsValid = false;
          result.Errors.Add($"Section '{section.TitleEn}' must have a valid PickCount (greater than 0)");
        }
        else
        {
          // Validate enough questions are available in QuestionBank
          var availableCount = await _context.Questions
            .Where(q => q.SubjectId == section.QuestionSubjectId && q.IsActive && !q.IsDeleted)
            .Where(q => !section.QuestionTopicId.HasValue || q.TopicId == section.QuestionTopicId)
            .CountAsync();

          if (availableCount < section.PickCount)
          {
            result.IsValid = false;
            result.Errors.Add($"Section '{section.TitleEn}' requires {section.PickCount} questions, but only {availableCount} are available in the QuestionBank");
          }
        }
      }
      else
      {
        // Manual mode - must have ExamQuestions
        if (!section.Questions.Any())
        {
          result.IsValid = false;
          result.Errors.Add($"Section '{section.TitleEn}' must have at least one question");
        }
      }
    }

    // Rule: All questions must be active
    var allQuestions = exam.Sections.SelectMany(s => s.Questions).ToList();
    var inactiveQuestions = allQuestions.Where(q => !q.Question.IsActive).ToList();
    if (inactiveQuestions.Any())
    {
      result.IsValid = false;
      foreach (var q in inactiveQuestions)
      {
        result.Errors.Add($"Question ID {q.QuestionId} is inactive and cannot be included in a published exam");
      }
    }

    // Rule: Validate question types
    foreach (var examQuestion in allQuestions)
    {
      var question = examQuestion.Question;
      var questionTypeName = question.QuestionType?.NameEn?.ToLower() ?? "";

      // MCQ validation
      if (questionTypeName.Contains("mcq") || questionTypeName.Contains("multiple choice"))
      {
        if (question.Options.Count < 2)
        {
          result.IsValid = false;
          result.Errors.Add($"Question ID {question.Id}: MCQ must have at least 2 options");
        }

        var correctOptions = question.Options.Count(o => o.IsCorrect);

        if (questionTypeName.Contains("single") && correctOptions != 1)
        {
          result.IsValid = false;
          result.Errors.Add($"Question ID {question.Id}: Single-choice MCQ must have exactly 1 correct option");
        }

        if (questionTypeName.Contains("multiple") && correctOptions < 1)
        {
          result.IsValid = false;
          result.Errors.Add($"Question ID {question.Id}: Multiple-choice MCQ must have at least 1 correct option");
        }
      }

      // True/False validation
      if (questionTypeName.Contains("true") && questionTypeName.Contains("false"))
      {
        if (question.Options.Count != 2)
        {
          result.IsValid = false;
          result.Errors.Add($"Question ID {question.Id}: True/False question must have exactly 2 options");
        }
      }

      // Points validation
      if (examQuestion.Points <= 0)
      {
        result.IsValid = false;
        result.Errors.Add($"Question ID {question.Id}: Points must be greater than 0");
      }
    }

    // Rule: PassScore must be valid
    // Include points from manual questions
    var totalPoints = allQuestions.Sum(q => q.Points);
    // Include points from Builder sections (calculate from available questions in QuestionBank)
    foreach (var section in exam.Sections.Where(s => s.SourceType.HasValue && s.QuestionSubjectId.HasValue))
    {
      if (section.TotalPointsOverride.HasValue)
      {
        totalPoints += section.TotalPointsOverride.Value;
      }
      else
      {
        // Get actual question points from QuestionBank
        var questionPointsQuery = _context.Questions
            .Where(q => q.IsActive && !q.IsDeleted && q.SubjectId == section.QuestionSubjectId);

        if (section.QuestionTopicId.HasValue)
        {
          questionPointsQuery = questionPointsQuery.Where(q => q.TopicId == section.QuestionTopicId);
        }

        // Get sum and count to calculate average (handles empty set)
        var pointsSum = await questionPointsQuery.SumAsync(q => q.Points);
        var questionCount = await questionPointsQuery.CountAsync();

        // Calculate average points, default to 1 if no questions
        var avgPointsPerQuestion = questionCount > 0 ? (pointsSum / questionCount) : 1m;

        totalPoints += section.PickCount * avgPointsPerQuestion;
      }
    }
    if (exam.PassScore > totalPoints)
    {
      result.IsValid = false;
      result.Errors.Add($"Pass score ({exam.PassScore}) cannot exceed total exam points ({totalPoints})");
    }

    // Warnings
    if (exam.PassScore == 0)
    {
      result.Warnings.Add("Pass score is set to 0. All candidates will pass regardless of their score.");
    }

    if (!exam.IsActive)
    {
      result.Warnings.Add("Exam is marked as inactive. It will not be available to candidates even after publishing.");
    }

    if (exam.StartAt.HasValue && exam.StartAt < DateTime.UtcNow)
    {
      result.Warnings.Add("Exam start date is in the past.");
    }

    if (exam.EndAt.HasValue && exam.EndAt < DateTime.UtcNow)
    {
      result.Warnings.Add("Exam end date is in the past. Candidates will not be able to take this exam.");
    }

    return ApiResponse<ExamValidationResultDto>.SuccessResponse(result);
  }

  #endregion

  #region Private Mapping Methods

  private ExamListDto MapToExamListDto(Exam exam)
  {
    var allQuestions = exam.Sections?.SelectMany(s => s.Questions) ?? Enumerable.Empty<ExamQuestion>();

    return new ExamListDto
    {
      Id = exam.Id,
      DepartmentId = exam.DepartmentId,
      DepartmentNameEn = exam.Department?.NameEn,
      DepartmentNameAr = exam.Department?.NameAr,
      ExamType = exam.ExamType,
      TitleEn = exam.TitleEn,
      TitleAr = exam.TitleAr,
      StartAt = exam.StartAt,
      EndAt = exam.EndAt,
      DurationMinutes = exam.DurationMinutes,
      PassScore = exam.PassScore,
      IsPublished = exam.IsPublished,
      IsActive = exam.IsActive,
      CreatedDate = exam.CreatedDate,
      SectionsCount = exam.Sections?.Count ?? 0,
      QuestionsCount = allQuestions.Count(),
      TotalPoints = allQuestions.Sum(q => q.Points)
    };
  }

  private ExamDto MapToExamDto(Exam exam)
  {
    var allQuestions = exam.Sections?.SelectMany(s => s.Questions) ?? Enumerable.Empty<ExamQuestion>();

    return new ExamDto
    {
      Id = exam.Id,
      DepartmentId = exam.DepartmentId,
      DepartmentNameEn = exam.Department?.NameEn,
      DepartmentNameAr = exam.Department?.NameAr,
      ExamType = exam.ExamType,
      TitleEn = exam.TitleEn,
      TitleAr = exam.TitleAr,
      DescriptionEn = exam.DescriptionEn,
      DescriptionAr = exam.DescriptionAr,
      StartAt = exam.StartAt,
      EndAt = exam.EndAt,
      DurationMinutes = exam.DurationMinutes,
      MaxAttempts = exam.MaxAttempts,
      ShuffleQuestions = exam.ShuffleQuestions,
      ShuffleOptions = exam.ShuffleOptions,
      PassScore = exam.PassScore,
      IsPublished = exam.IsPublished,
      IsActive = exam.IsActive,
      // Result & Review Settings
      ShowResults = exam.ShowResults,
      AllowReview = exam.AllowReview,
      ShowCorrectAnswers = exam.ShowCorrectAnswers,
      // Proctoring Settings
      RequireProctoring = exam.RequireProctoring,
      RequireIdVerification = exam.RequireIdVerification,
      RequireWebcam = exam.RequireWebcam,
      // Security Settings
      PreventCopyPaste = exam.PreventCopyPaste,
      PreventScreenCapture = exam.PreventScreenCapture,
      RequireFullscreen = exam.RequireFullscreen,
      BrowserLockdown = exam.BrowserLockdown,
      CreatedDate = exam.CreatedDate,
      UpdatedDate = exam.UpdatedDate,
      SectionsCount = exam.Sections?.Count ?? 0,
      QuestionsCount = allQuestions.Count(),
      TotalPoints = allQuestions.Sum(q => q.Points),
      Sections = exam.Sections?.Select(MapToExamSectionDto).ToList() ?? new List<ExamSectionDto>(),
      Instructions = exam.Instructions?.Adapt<List<ExamInstructionDto>>() ?? new List<ExamInstructionDto>(),
      AccessPolicy = exam.AccessPolicy?.Adapt<ExamAccessPolicyDto>()
    };
  }

  private ExamSectionDto MapToExamSectionDto(ExamSection section)
  {
    var topicList = section.Topics?.OrderBy(t => t.Order).Select(t => new ExamTopicDto
    {
      Id = t.Id,
      ExamSectionId = t.ExamSectionId,
      TitleEn = t.TitleEn,
      TitleAr = t.TitleAr,
      DescriptionEn = t.DescriptionEn,
      DescriptionAr = t.DescriptionAr,
      Order = t.Order,
      CreatedDate = t.CreatedDate,
      QuestionsCount = 0,
      TotalPoints = 0,
      Questions = new List<ExamQuestionDto>()
    }).ToList() ?? new List<ExamTopicDto>();

    return new ExamSectionDto
    {
      Id = section.Id,
      ExamId = section.ExamId,
      TitleEn = section.TitleEn,
      TitleAr = section.TitleAr,
      DescriptionEn = section.DescriptionEn,
      DescriptionAr = section.DescriptionAr,
      Order = section.Order,
      DurationMinutes = section.DurationMinutes,
      TotalPointsOverride = section.TotalPointsOverride,
      CreatedDate = section.CreatedDate,
      TopicsCount = topicList.Count,
      QuestionsCount = section.Questions?.Count ?? 0,
      TotalPoints = section.Questions?.Sum(q => q.Points) ?? 0,
      Topics = topicList,
      Questions = section.Questions?.Select(MapToExamQuestionDto).ToList() ?? new List<ExamQuestionDto>()
    };
  }

  private ExamQuestionDto MapToExamQuestionDto(ExamQuestion examQuestion)
  {
    return new ExamQuestionDto
    {
      Id = examQuestion.Id,
      ExamId = examQuestion.ExamId,
      ExamSectionId = examQuestion.ExamSectionId,
      QuestionId = examQuestion.QuestionId,
      Order = examQuestion.Order,
      Points = examQuestion.Points,
      IsRequired = examQuestion.IsRequired,
      CreatedDate = examQuestion.CreatedDate,
      QuestionBodyEn = examQuestion.Question?.BodyEn ?? string.Empty,
      QuestionBodyAr = examQuestion.Question?.BodyAr ?? string.Empty,
      QuestionTypeNameEn = examQuestion.Question?.QuestionType?.NameEn ?? string.Empty,
      QuestionTypeNameAr = examQuestion.Question?.QuestionType?.NameAr ?? string.Empty,
      DifficultyLevelName = examQuestion.Question?.DifficultyLevel.ToString() ?? string.Empty,
      OriginalPoints = examQuestion.Question?.Points ?? 0
    };
  }

  #endregion

  #region Private Helper Methods

  private async Task<bool> IsCurrentUserSuperDevAsync()
  {
    var userId = _currentUserService.UserId;
    if (string.IsNullOrEmpty(userId))
      return false;

    var user = await _userManager.FindByIdAsync(userId);
    if (user == null)
      return false;

    return await _userManager.IsInRoleAsync(user, AppRoles.SuperDev);
  }

  private async Task<bool> HasAccessToExamAsync(int departmentId)
  {
    // SuperDev can access all exams
    if (await IsCurrentUserSuperDevAsync())
      return true;

    // Check if user belongs to the same department
    var userDepartmentId = await _departmentService.GetCurrentUserDepartmentIdAsync();
    return userDepartmentId.HasValue && userDepartmentId.Value == departmentId;
  }

  #endregion

  #region Exam Topics

  public async Task<ApiResponse<List<ExamTopicDto>>> GetSectionTopicsAsync(int sectionId)
  {
    var sectionExists = await _context.ExamSections.AnyAsync(x => x.Id == sectionId);
    if (!sectionExists)
    {
      return ApiResponse<List<ExamTopicDto>>.FailureResponse("Section not found");
    }

    var topics = await _context.ExamTopics
    .Where(x => x.ExamSectionId == sectionId)
  .OrderBy(x => x.Order)
 .ToListAsync();

    var dtos = topics.Select(t => new ExamTopicDto
    {
      Id = t.Id,
      ExamSectionId = t.ExamSectionId,
      TitleEn = t.TitleEn,
      TitleAr = t.TitleAr,
      DescriptionEn = t.DescriptionEn,
      DescriptionAr = t.DescriptionAr,
      Order = t.Order,
      CreatedDate = t.CreatedDate
    }).ToList();

    return ApiResponse<List<ExamTopicDto>>.SuccessResponse(dtos);
  }

  public async Task<ApiResponse<ExamTopicDto>> GetTopicByIdAsync(int topicId)
  {
    var topic = await _context.ExamTopics.FirstOrDefaultAsync(x => x.Id == topicId);

    if (topic == null)
    {
      return ApiResponse<ExamTopicDto>.FailureResponse("Topic not found");
    }

    var dto = new ExamTopicDto
    {
      Id = topic.Id,
      ExamSectionId = topic.ExamSectionId,
      TitleEn = topic.TitleEn,
      TitleAr = topic.TitleAr,
      DescriptionEn = topic.DescriptionEn,
      DescriptionAr = topic.DescriptionAr,
      Order = topic.Order,
      CreatedDate = topic.CreatedDate
    };

    return ApiResponse<ExamTopicDto>.SuccessResponse(dto);
  }

  public async Task<ApiResponse<ExamTopicDto>> CreateTopicAsync(int sectionId, SaveExamTopicDto dto, string createdBy)
  {
    var section = await _context.ExamSections.FirstOrDefaultAsync(x => x.Id == sectionId);
    if (section == null)
    {
      return ApiResponse<ExamTopicDto>.FailureResponse("Section not found");
    }

    string? warningMessage = null;
    int assignedOrder = dto.Order;

    // Check if requested order conflicts with existing non-deleted topics
    var orderExists = await _context.ExamTopics
        .IgnoreQueryFilters()
        .AnyAsync(x => x.ExamSectionId == sectionId && x.Order == dto.Order && !x.IsDeleted);

    if (orderExists)
    {
      var maxOrder = await _context.ExamTopics
.IgnoreQueryFilters()
  .Where(x => x.ExamSectionId == sectionId && !x.IsDeleted)
.MaxAsync(x => (int?)x.Order) ?? 0;

      assignedOrder = maxOrder + 1;
      warningMessage = $"Order {dto.Order} was already taken. Topic was assigned order {assignedOrder} instead.";
    }

    var entity = new ExamTopic
    {
      ExamSectionId = sectionId,
      TitleEn = dto.TitleEn,
      TitleAr = dto.TitleAr,
      DescriptionEn = dto.DescriptionEn,
      DescriptionAr = dto.DescriptionAr,
      Order = assignedOrder,
      CreatedDate = DateTime.UtcNow,
      CreatedBy = createdBy
    };

    _context.ExamTopics.Add(entity);
    await _context.SaveChangesAsync();

    var result = await GetTopicByIdAsync(entity.Id);
    if (warningMessage != null && result.Success)
    {
      result.Message = warningMessage;
    }

    return result;
  }

  public async Task<ApiResponse<ExamTopicDto>> UpdateTopicAsync(int topicId, SaveExamTopicDto dto, string updatedBy)
  {
    var entity = await _context.ExamTopics.FirstOrDefaultAsync(x => x.Id == topicId);
    if (entity == null)
    {
      return ApiResponse<ExamTopicDto>.FailureResponse("Topic not found");
    }

    string? warningMessage = null;
    int assignedOrder = dto.Order;

    var orderExists = await _context.ExamTopics
        .IgnoreQueryFilters()
        .AnyAsync(x => x.ExamSectionId == entity.ExamSectionId &&
    x.Id != topicId &&
  x.Order == dto.Order &&
!x.IsDeleted);

    if (orderExists)
    {
      var maxOrder = await _context.ExamTopics
 .IgnoreQueryFilters()
.Where(x => x.ExamSectionId == entity.ExamSectionId && !x.IsDeleted)
      .MaxAsync(x => (int?)x.Order) ?? 0;

      assignedOrder = maxOrder + 1;
      warningMessage = $"Order {dto.Order} was already taken. Topic was assigned order {assignedOrder} instead.";
    }

    entity.TitleEn = dto.TitleEn;
    entity.TitleAr = dto.TitleAr;
    entity.DescriptionEn = dto.DescriptionEn;
    entity.DescriptionAr = dto.DescriptionAr;
    entity.Order = assignedOrder;
    entity.UpdatedDate = DateTime.UtcNow;
    entity.UpdatedBy = updatedBy;

    await _context.SaveChangesAsync();

    var result = await GetTopicByIdAsync(entity.Id);
    if (warningMessage != null && result.Success)
    {
      result.Message = warningMessage;
    }

    return result;
  }

  public async Task<ApiResponse<bool>> DeleteTopicAsync(int topicId)
  {
    var entity = await _context.ExamTopics.FirstOrDefaultAsync(x => x.Id == topicId);
    if (entity == null)
    {
      return ApiResponse<bool>.FailureResponse("Topic not found");
    }

    entity.IsDeleted = true;
    entity.UpdatedDate = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return ApiResponse<bool>.SuccessResponse(true, "Topic deleted successfully");
  }

  public async Task<ApiResponse<bool>> ReorderTopicsAsync(int sectionId, List<ReorderTopicDto> reorderDtos, string updatedBy)
  {
    var sectionExists = await _context.ExamSections.AnyAsync(x => x.Id == sectionId);
    if (!sectionExists)
    {
      return ApiResponse<bool>.FailureResponse("Section not found");
    }

    var topics = await _context.ExamTopics
      .Where(x => x.ExamSectionId == sectionId)
     .ToListAsync();

    var topicIds = reorderDtos.Select(x => x.TopicId).ToList();
    var existingTopicIds = topics.Select(x => x.Id).ToList();
    var invalidIds = topicIds.Except(existingTopicIds).ToList();

    if (invalidIds.Any())
    {
      return ApiResponse<bool>.FailureResponse($"Topic IDs not found: {string.Join(", ", invalidIds)}");
    }

    // Validate unique orders
    var orders = reorderDtos.Select(x => x.NewOrder).ToList();
    if (orders.Distinct().Count() != orders.Count)
    {
      return ApiResponse<bool>.FailureResponse("Duplicate order values are not allowed");
    }

    foreach (var reorder in reorderDtos)
    {
      var topic = topics.First(x => x.Id == reorder.TopicId);
      topic.Order = reorder.NewOrder;
      topic.UpdatedDate = DateTime.UtcNow;
      topic.UpdatedBy = updatedBy;
    }

    await _context.SaveChangesAsync();

    return ApiResponse<bool>.SuccessResponse(true, "Topics reordered successfully");
  }

  public async Task<ApiResponse<List<ExamQuestionDto>>> GetTopicQuestionsAsync(int topicId)
  {
    var topicExists = await _context.ExamTopics.AnyAsync(x => x.Id == topicId);
    if (!topicExists)
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse("Topic not found");
    }

    var questions = await _context.ExamQuestions
         .Include(x => x.Question)
             .ThenInclude(q => q.QuestionType)
      .Where(x => x.ExamTopicId == topicId)
               .OrderBy(x => x.Order)
               .ToListAsync();

    var dtos = questions.Select(MapToExamQuestionDto).ToList();
    return ApiResponse<List<ExamQuestionDto>>.SuccessResponse(dtos);
  }

  public async Task<ApiResponse<ExamQuestionDto>> AddQuestionToTopicAsync(int topicId, AddExamQuestionDto dto, string createdBy)
  {
    var topic = await _context.ExamTopics
      .Include(x => x.ExamSection)
   .ThenInclude(s => s.Exam)
 .FirstOrDefaultAsync(x => x.Id == topicId);

    if (topic == null)
    {
      return ApiResponse<ExamQuestionDto>.FailureResponse("Topic not found");
    }

    // Validate question exists and is active
    var question = await _context.Questions.FindAsync(dto.QuestionId);
    if (question == null)
    {
      return ApiResponse<ExamQuestionDto>.FailureResponse("Question not found in Question Bank");
    }

    if (!question.IsActive)
    {
      return ApiResponse<ExamQuestionDto>.FailureResponse(
"Cannot add inactive question to exam. Activate the question first.");
    }

    // Check if question already exists in this exam (exclude soft-deleted)
    var questionExistsInExam = await _context.ExamQuestions
   .IgnoreQueryFilters()
    .AnyAsync(x => x.ExamId == topic.ExamSection.ExamId && x.QuestionId == dto.QuestionId && !x.IsDeleted);

    if (questionExistsInExam)
    {
      return ApiResponse<ExamQuestionDto>.FailureResponse(
    "This question already exists in the exam. Each question can only be added once.");
    }

    string? warningMessage = null;
    int assignedOrder = dto.Order;

    // Check if requested order conflicts with existing non-deleted questions
    var orderExists = await _context.ExamQuestions
.IgnoreQueryFilters()
.AnyAsync(x => x.ExamTopicId == topicId && x.Order == dto.Order && !x.IsDeleted);

    if (orderExists)
    {
      // Auto-assign next available order instead of failing
      var maxOrder = await _context.ExamQuestions
    .IgnoreQueryFilters()
         .Where(x => x.ExamTopicId == topicId && !x.IsDeleted)
        .MaxAsync(x => (int?)x.Order) ?? 0;

      assignedOrder = maxOrder + 1;
      warningMessage = $"Order {dto.Order} was already taken. Question was assigned order {assignedOrder} instead.";
    }

    var entity = new ExamQuestion
    {
      ExamId = topic.ExamSection.ExamId,
      ExamSectionId = topic.ExamSectionId,
      ExamTopicId = topicId,
      QuestionId = dto.QuestionId,
      Order = assignedOrder,
      Points = dto.PointsOverride ?? question.Points,
      IsRequired = dto.IsRequired,
      CreatedDate = DateTime.UtcNow,
      CreatedBy = createdBy
    };

    _context.ExamQuestions.Add(entity);
    await _context.SaveChangesAsync();

    var result = await _context.ExamQuestions
    .Include(x => x.Question)
        .ThenInclude(q => q.QuestionType)
    .FirstOrDefaultAsync(x => x.Id == entity.Id);

    return ApiResponse<ExamQuestionDto>.SuccessResponse(
        MapToExamQuestionDto(result!),
        warningMessage ?? "Question added to topic successfully");
  }

  public async Task<ApiResponse<List<ExamQuestionDto>>> BulkAddQuestionsToTopicAsync(int topicId, BulkAddQuestionsDto dto, string createdBy)
  {
    var topic = await _context.ExamTopics
        .Include(x => x.ExamSection)
 .ThenInclude(s => s.Exam)
.FirstOrDefaultAsync(x => x.Id == topicId);

    if (topic == null)
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse("Topic not found");
    }

    // Validate all questions exist
    var questions = await _context.Questions
   .Where(x => dto.QuestionIds.Contains(x.Id))
   .ToListAsync();

    var missingIds = dto.QuestionIds.Except(questions.Select(x => x.Id)).ToList();
    if (missingIds.Any())
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse(
$"Questions not found: {string.Join(", ", missingIds)}");
    }

    // Check for inactive questions
    var inactiveQuestions = questions.Where(x => !x.IsActive).ToList();
    if (inactiveQuestions.Any())
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse(
 $"Cannot add inactive questions: {string.Join(", ", inactiveQuestions.Select(x => x.Id))}");
    }

    // Check for duplicates in exam (exclude soft-deleted) - skip silently instead of error
    var existingQuestionIds = await _context.ExamQuestions
  .IgnoreQueryFilters()
.Where(x => x.ExamId == topic.ExamSection.ExamId && dto.QuestionIds.Contains(x.QuestionId) && !x.IsDeleted)
.Select(x => x.QuestionId)
  .ToListAsync();

    // Filter out already existing questions
    var questionsToAdd = questions.Where(q => !existingQuestionIds.Contains(q.Id)).ToList();

    if (!questionsToAdd.Any())
    {
      // All questions already exist - return current list with message
      var currentResult = await GetTopicQuestionsAsync(topicId);
      currentResult.Message = "All questions already exist in the exam. No new questions added.";
      return currentResult;
    }

    // Get max order in section (exclude soft-deleted)
    var maxOrder = await _context.ExamQuestions
     .IgnoreQueryFilters()
   .Where(x => x.ExamTopicId == topicId && !x.IsDeleted)
   .MaxAsync(x => (int?)x.Order) ?? 0;

    var entities = new List<ExamQuestion>();
    foreach (var question in questionsToAdd)
    {
      maxOrder++;
      entities.Add(new ExamQuestion
      {
        ExamId = topic.ExamSection.ExamId,
        ExamSectionId = topic.ExamSectionId,
        ExamTopicId = topicId,
        QuestionId = question.Id,
        Order = maxOrder,
        Points = dto.UseOriginalPoints ? question.Points : 0,
        IsRequired = dto.MarkAsRequired,
        CreatedDate = DateTime.UtcNow,
        CreatedBy = createdBy
      });
    }

    _context.ExamQuestions.AddRange(entities);
    await _context.SaveChangesAsync();

    var result = await GetTopicQuestionsAsync(topicId);
    if (existingQuestionIds.Any())
    {
      result.Message = $"Added {questionsToAdd.Count} questions. Skipped {existingQuestionIds.Count} duplicate(s).";
    }

    return result;
  }

  public async Task<ApiResponse<List<ExamQuestionDto>>> ManualAddQuestionsToSectionAsync(int sectionId, ManualQuestionSelectionDto dto, string createdBy)
  {
    var section = await _context.ExamSections
        .Include(x => x.Exam)
.FirstOrDefaultAsync(x => x.Id == sectionId);

    if (section == null)
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse("Section not found");
    }

    if (!dto.Questions.Any())
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse("At least one question must be selected");
    }

    var questionIds = dto.Questions.Select(q => q.QuestionId).ToList();
    var questions = await _context.Questions
   .Where(x => questionIds.Contains(x.Id))
        .ToDictionaryAsync(x => x.Id);

    var missingIds = questionIds.Except(questions.Keys).ToList();
    if (missingIds.Any())
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse($"Questions not found: {string.Join(", ", missingIds)}");
    }

    var existingQuestionIds = await _context.ExamQuestions
   .IgnoreQueryFilters()
.Where(x => x.ExamId == section.ExamId && !x.IsDeleted)
.Select(x => x.QuestionId)
.ToListAsync();

    var questionsToAdd = dto.Questions.Where(q => !existingQuestionIds.Contains(q.QuestionId)).ToList();

    if (!questionsToAdd.Any())
    {
      var currentResult = await GetSectionQuestionsAsync(sectionId);
      currentResult.Message = "All questions already exist in the exam. No new questions added.";
      return currentResult;
    }

    var existingOrders = await _context.ExamQuestions
          .IgnoreQueryFilters()
   .Where(x => x.ExamSectionId == sectionId && !x.IsDeleted)
            .Select(x => x.Order)
            .ToListAsync();

    var maxOrder = existingOrders.Any() ? existingOrders.Max() : 0;

    var entities = new List<ExamQuestion>();
    foreach (var item in questionsToAdd)
    {
      var questionBank = questions[item.QuestionId];
      var order = item.Order;

      if (existingOrders.Contains(order))
      {
        maxOrder++;
        order = maxOrder;
      }

      entities.Add(new ExamQuestion
      {
        ExamId = section.ExamId,
        ExamSectionId = sectionId,
        QuestionId = item.QuestionId,
        Order = order,
        Points = item.PointsOverride ?? questionBank.Points,
        IsRequired = item.IsRequired ?? dto.MarkAsRequired,
        CreatedDate = DateTime.UtcNow,
        CreatedBy = createdBy
      });
    }

    _context.ExamQuestions.AddRange(entities);
    await _context.SaveChangesAsync();

    var result = await GetSectionQuestionsAsync(sectionId);
    if (existingQuestionIds.Any())
    {
      result.Message = $"Added {questionsToAdd.Count} questions. Skipped {existingQuestionIds.Count} duplicate(s).";
    }

    return result;
  }

  public async Task<ApiResponse<List<ExamQuestionDto>>> ManualAddQuestionsToTopicAsync(int topicId, ManualQuestionSelectionDto dto, string createdBy)
  {
    var topic = await _context.ExamTopics
       .Include(x => x.ExamSection)
                .ThenInclude(s => s.Exam)
        .FirstOrDefaultAsync(x => x.Id == topicId);

    if (topic == null)
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse("Topic not found");
    }

    if (!dto.Questions.Any())
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse("At least one question must be selected");
    }

    var questionIds = dto.Questions.Select(q => q.QuestionId).ToList();
    var questions = await _context.Questions
   .Where(x => questionIds.Contains(x.Id))
           .ToDictionaryAsync(x => x.Id);

    var missingIds = questionIds.Except(questions.Keys).ToList();
    if (missingIds.Any())
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse($"Questions not found: {string.Join(", ", missingIds)}");
    }

    var existingQuestionIds = await _context.ExamQuestions
     .IgnoreQueryFilters()
             .Where(x => x.ExamId == topic.ExamSection.ExamId && questionIds.Contains(x.QuestionId) && !x.IsDeleted)
             .Select(x => x.QuestionId)
             .ToListAsync();

    var questionsToAdd = dto.Questions.Where(q => !existingQuestionIds.Contains(q.QuestionId)).ToList();

    if (!questionsToAdd.Any())
    {
      var currentResult = await GetTopicQuestionsAsync(topicId);
      currentResult.Message = "All questions already exist in the exam. No new questions added.";
      return currentResult;
    }

    var existingOrders = await _context.ExamQuestions
        .IgnoreQueryFilters()
        .Where(x => x.ExamTopicId == topicId && !x.IsDeleted)
     .Select(x => x.Order)
  .ToListAsync();

    var maxOrder = existingOrders.Any() ? existingOrders.Max() : 0;

    var entities = new List<ExamQuestion>();
    foreach (var item in questionsToAdd)
    {
      var questionBank = questions[item.QuestionId];
      var order = item.Order;

      if (existingOrders.Contains(order))
      {
        maxOrder++;
        order = maxOrder;
      }

      entities.Add(new ExamQuestion
      {
        ExamId = topic.ExamSection.ExamId,
        ExamSectionId = topic.ExamSectionId,
        ExamTopicId = topicId,
        QuestionId = item.QuestionId,
        Order = order,
        Points = item.PointsOverride ?? questionBank.Points,
        IsRequired = item.IsRequired ?? dto.MarkAsRequired,
        CreatedDate = DateTime.UtcNow,
        CreatedBy = createdBy
      });
    }

    _context.ExamQuestions.AddRange(entities);
    await _context.SaveChangesAsync();

    var result = await GetTopicQuestionsAsync(topicId);
    if (existingQuestionIds.Any())
    {
      result.Message = $"Added {questionsToAdd.Count} questions. Skipped {existingQuestionIds.Count} duplicate(s).";
    }

    return result;
  }

  public async Task<ApiResponse<List<ExamQuestionDto>>> RandomAddQuestionsToSectionAsync(int sectionId, RandomQuestionSelectionDto dto, string createdBy)
  {
    var section = await _context.ExamSections
  .Include(x => x.Exam)
        .FirstOrDefaultAsync(x => x.Id == sectionId);

    if (section == null)
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse("Section not found");
    }

    if (dto.Count <= 0)
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse("Count must be greater than 0");
    }

    var query = _context.Questions.Where(x => x.IsActive);

    if (dto.CategoryId.HasValue)
    {
      query = query.Where(x => x.QuestionCategoryId == dto.CategoryId.Value);
    }

    if (dto.QuestionTypeId.HasValue)
    {
      query = query.Where(x => x.QuestionTypeId == dto.QuestionTypeId.Value);
    }

    if (dto.DifficultyLevel.HasValue)
    {
      var difficulty = (Domain.Enums.DifficultyLevel)dto.DifficultyLevel.Value;
      query = query.Where(x => x.DifficultyLevel == difficulty);
    }

    if (dto.ExcludeExistingInExam)
    {
      var existingQuestionIds = await _context.ExamQuestions
          .IgnoreQueryFilters()
      .Where(x => x.ExamId == section.ExamId && !x.IsDeleted)
  .Select(x => x.QuestionId)
       .ToListAsync();

      query = query.Where(x => !existingQuestionIds.Contains(x.Id));
    }

    var availableQuestions = await query.ToListAsync();

    if (!availableQuestions.Any())
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse("No questions found matching the criteria");
    }

    if (availableQuestions.Count < dto.Count)
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse(
        $"Only {availableQuestions.Count} questions available, but {dto.Count} requested.");
    }

    var random = new Random();
    var selectedQuestions = availableQuestions.OrderBy(x => random.Next()).Take(dto.Count).ToList();

    var maxOrder = await _context.ExamQuestions
  .IgnoreQueryFilters()
        .Where(x => x.ExamSectionId == sectionId && !x.IsDeleted)
  .MaxAsync(x => (int?)x.Order) ?? 0;

    var entities = new List<ExamQuestion>();
    foreach (var question in selectedQuestions)
    {
      maxOrder++;
      entities.Add(new ExamQuestion
      {
        ExamId = section.ExamId,
        ExamSectionId = sectionId,
        QuestionId = question.Id,
        Order = maxOrder,
        Points = dto.UseOriginalPoints ? question.Points : 0,
        IsRequired = dto.MarkAsRequired,
        CreatedDate = DateTime.UtcNow,
        CreatedBy = createdBy
      });
    }

    _context.ExamQuestions.AddRange(entities);
    await _context.SaveChangesAsync();

    return await GetSectionQuestionsAsync(sectionId);
  }

  public async Task<ApiResponse<List<ExamQuestionDto>>> RandomAddQuestionsToTopicAsync(int topicId, RandomQuestionSelectionDto dto, string createdBy)
  {
    var topic = await _context.ExamTopics
          .Include(x => x.ExamSection)
              .ThenInclude(s => s.Exam)
     .FirstOrDefaultAsync(x => x.Id == topicId);

    if (topic == null)
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse("Topic not found");
    }

    if (dto.Count <= 0)
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse("Count must be greater than 0");
    }

    var query = _context.Questions.Where(x => x.IsActive);

    if (dto.CategoryId.HasValue)
    {
      query = query.Where(x => x.QuestionCategoryId == dto.CategoryId.Value);
    }

    if (dto.QuestionTypeId.HasValue)
    {
      query = query.Where(x => x.QuestionTypeId == dto.QuestionTypeId.Value);
    }

    if (dto.DifficultyLevel.HasValue)
    {
      var difficulty = (Domain.Enums.DifficultyLevel)dto.DifficultyLevel.Value;
      query = query.Where(x => x.DifficultyLevel == difficulty);
    }

    if (dto.ExcludeExistingInExam)
    {
      var existingQuestionIds = await _context.ExamQuestions
          .IgnoreQueryFilters()
      .Where(x => x.ExamId == topic.ExamSection.ExamId && !x.IsDeleted)
  .Select(x => x.QuestionId)
       .ToListAsync();

      query = query.Where(x => !existingQuestionIds.Contains(x.Id));
    }

    var availableQuestions = await query.ToListAsync();

    if (!availableQuestions.Any())
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse("No questions found matching the criteria");
    }

    if (availableQuestions.Count < dto.Count)
    {
      return ApiResponse<List<ExamQuestionDto>>.FailureResponse(
        $"Only {availableQuestions.Count} questions available, but {dto.Count} requested.");
    }

    var random = new Random();
    var selectedQuestions = availableQuestions.OrderBy(x => random.Next()).Take(dto.Count).ToList();

    var maxOrder = await _context.ExamQuestions
  .IgnoreQueryFilters()
        .Where(x => x.ExamTopicId == topicId && !x.IsDeleted)
  .MaxAsync(x => (int?)x.Order) ?? 0;

    var entities = new List<ExamQuestion>();
    foreach (var question in selectedQuestions)
    {
      maxOrder++;
      entities.Add(new ExamQuestion
      {
        ExamId = topic.ExamSection.ExamId,
        ExamSectionId = topic.ExamSectionId,
        ExamTopicId = topicId,
        QuestionId = question.Id,
        Order = maxOrder,
        Points = dto.UseOriginalPoints ? question.Points : 0,
        IsRequired = dto.MarkAsRequired,
        CreatedDate = DateTime.UtcNow,
        CreatedBy = createdBy
      });
    }

    _context.ExamQuestions.AddRange(entities);
    await _context.SaveChangesAsync();

    return await GetTopicQuestionsAsync(topicId);
  }

  #endregion

  #region Exam Builder

  public async Task<ApiResponse<ExamBuilderDto>> GetExamBuilderAsync(int examId)
  {
    var exam = await _context.Exams
        .Include(e => e.Sections.Where(s => !s.IsDeleted))
            .ThenInclude(s => s.QuestionSubject)
        .Include(e => e.Sections.Where(s => !s.IsDeleted))
            .ThenInclude(s => s.QuestionTopic)
        .FirstOrDefaultAsync(e => e.Id == examId);

    if (exam == null)
    {
      return ApiResponse<ExamBuilderDto>.FailureResponse("Exam not found");
    }

    // Include all sections that have QuestionSubjectId (they can be loaded in builder)
    // Infer SourceType if not set: if TopicId is set => Topic, otherwise => Subject
    var builderSections = exam.Sections
        .Where(s => s.QuestionSubjectId.HasValue)
        .OrderBy(s => s.Order)
        .Select(s => new BuilderSectionDto
        {
          Id = s.Id,
          SourceType = s.SourceType ?? (s.QuestionTopicId.HasValue
              ? Domain.Enums.SectionSourceType.Topic
              : Domain.Enums.SectionSourceType.Subject),
          QuestionSubjectId = s.QuestionSubjectId ?? 0,
          QuestionTopicId = s.QuestionTopicId,
          TitleEn = s.TitleEn,
          TitleAr = s.TitleAr,
          DurationMinutes = s.DurationMinutes,
          PickCount = s.PickCount,
          Order = s.Order,
          SubjectNameEn = s.QuestionSubject?.NameEn,
          SubjectNameAr = s.QuestionSubject?.NameAr,
          TopicNameEn = s.QuestionTopic?.NameEn,
          TopicNameAr = s.QuestionTopic?.NameAr
        })
        .ToList();

    // Get unique subject IDs from sections
    var selectedSubjectIds = builderSections
        .Select(s => s.QuestionSubjectId)
        .Distinct()
        .ToList();

    // Determine overall source type (Subject or Topic)
    var sourceType = builderSections.FirstOrDefault()?.SourceType ?? Domain.Enums.SectionSourceType.Subject;

    // Get available questions count and estimated total points for each section
    foreach (var section in builderSections)
    {
      var poolQuery = _context.Questions
          .Where(q => q.IsActive && !q.IsDeleted && q.SubjectId == section.QuestionSubjectId);

      if (section.QuestionTopicId.HasValue)
      {
        poolQuery = poolQuery.Where(q => q.TopicId == section.QuestionTopicId);
      }

      var availableCount = await poolQuery.CountAsync();
      section.AvailableQuestionsCount = availableCount;

      // Calculate estimated total points: pickCount × avg points per question
      if (availableCount > 0)
      {
        var pointsSum = await poolQuery.SumAsync(q => q.Points);
        var avgPoints = pointsSum / availableCount;
        section.EstimatedTotalPoints = section.PickCount * avgPoints;
      }
      else
      {
        section.EstimatedTotalPoints = section.PickCount; // fallback: 1 point per question
      }
    }

    var result = new ExamBuilderDto
    {
      ExamId = examId,
      SourceType = sourceType,
      SelectedSubjectIds = selectedSubjectIds,
      Sections = builderSections
    };

    return ApiResponse<ExamBuilderDto>.SuccessResponse(result);
  }

  public async Task<ApiResponse<ExamBuilderDto>> SaveExamBuilderAsync(int examId, SaveExamBuilderRequest dto, string userId)
  {
    var exam = await _context.Exams
        .Include(e => e.Sections.Where(s => !s.IsDeleted))
        .FirstOrDefaultAsync(e => e.Id == examId);

    if (exam == null)
    {
      return ApiResponse<ExamBuilderDto>.FailureResponse("Exam not found");
    }

    // Validate sections
    foreach (var sectionDto in dto.Sections)
    {
      // Validate Source Type rules
      if (sectionDto.SourceType == Domain.Enums.SectionSourceType.Subject)
      {
        if (sectionDto.QuestionSubjectId <= 0)
        {
          return ApiResponse<ExamBuilderDto>.FailureResponse("Subject is required for Subject source type");
        }
        if (sectionDto.QuestionTopicId.HasValue)
        {
          return ApiResponse<ExamBuilderDto>.FailureResponse("Topic must be null for Subject source type");
        }
      }
      else if (sectionDto.SourceType == Domain.Enums.SectionSourceType.Topic)
      {
        if (sectionDto.QuestionSubjectId <= 0)
        {
          return ApiResponse<ExamBuilderDto>.FailureResponse("Subject is required for Topic source type");
        }
        if (!sectionDto.QuestionTopicId.HasValue || sectionDto.QuestionTopicId <= 0)
        {
          return ApiResponse<ExamBuilderDto>.FailureResponse("Topic is required for Topic source type");
        }
      }

      // Validate PickCount
      if (sectionDto.PickCount < 1)
      {
        return ApiResponse<ExamBuilderDto>.FailureResponse("Pick count must be at least 1");
      }

      // Validate PickCount against available questions
      var availableQuery = _context.Questions
          .Where(q => q.IsActive && !q.IsDeleted && q.SubjectId == sectionDto.QuestionSubjectId);

      if (sectionDto.QuestionTopicId.HasValue)
      {
        availableQuery = availableQuery.Where(q => q.TopicId == sectionDto.QuestionTopicId);
      }

      var availableCount = await availableQuery.CountAsync();
      if (sectionDto.PickCount > availableCount)
      {
        return ApiResponse<ExamBuilderDto>.FailureResponse(
            $"Pick count ({sectionDto.PickCount}) exceeds available questions ({availableCount})");
      }
    }

    // Remove existing builder sections (sections with SourceType set) to avoid unique index conflicts
    var existingSections = exam.Sections.Where(s => s.SourceType.HasValue).ToList();
    if (existingSections.Any())
    {
      _context.ExamSections.RemoveRange(existingSections);
      await _context.SaveChangesAsync();
    }

    // Create new sections
    var newSections = new List<ExamSection>();
    foreach (var sectionDto in dto.Sections)
    {
      // Get subject/topic names for auto-fill
      string titleEn = sectionDto.TitleEn ?? "";
      string titleAr = sectionDto.TitleAr ?? "";

      if (string.IsNullOrWhiteSpace(titleEn) || string.IsNullOrWhiteSpace(titleAr))
      {
        if (sectionDto.SourceType == Domain.Enums.SectionSourceType.Topic && sectionDto.QuestionTopicId.HasValue)
        {
          var topic = await _context.QuestionTopics.FindAsync(sectionDto.QuestionTopicId.Value);
          if (topic != null)
          {
            if (string.IsNullOrWhiteSpace(titleEn)) titleEn = topic.NameEn;
            if (string.IsNullOrWhiteSpace(titleAr)) titleAr = topic.NameAr;
          }
        }
        else
        {
          var subject = await _context.QuestionSubjects.FindAsync(sectionDto.QuestionSubjectId);
          if (subject != null)
          {
            if (string.IsNullOrWhiteSpace(titleEn)) titleEn = subject.NameEn;
            if (string.IsNullOrWhiteSpace(titleAr)) titleAr = subject.NameAr;
          }
        }
      }

      // Ensure titles are not empty
      if (string.IsNullOrWhiteSpace(titleEn)) titleEn = $"Section {sectionDto.Order}";
      if (string.IsNullOrWhiteSpace(titleAr)) titleAr = $"قسم {sectionDto.Order}";

      var section = new ExamSection
      {
        ExamId = examId,
        TitleEn = titleEn,
        TitleAr = titleAr,
        Order = sectionDto.Order > 0 ? sectionDto.Order : (newSections.Count + 1),
        DurationMinutes = sectionDto.DurationMinutes,
        SourceType = sectionDto.SourceType,
        QuestionSubjectId = sectionDto.QuestionSubjectId > 0 ? sectionDto.QuestionSubjectId : null,
        QuestionTopicId = sectionDto.QuestionTopicId > 0 ? sectionDto.QuestionTopicId : null,
        PickCount = sectionDto.PickCount,
        CreatedDate = DateTime.UtcNow,
        CreatedBy = userId
      };

      newSections.Add(section);
    }

    _context.ExamSections.AddRange(newSections);
    await _context.SaveChangesAsync();

    // Return updated builder state
    return await GetExamBuilderAsync(examId);
  }

  #endregion

  #region Clone Exam (Create from Template)

  public async Task<ApiResponse<ExamDto>> CloneExamAsync(int sourceExamId, CloneExamDto dto, string createdBy)
  {
    // 1. Load source exam with all related data
    var source = await _context.Exams
        .Include(x => x.Sections.OrderBy(s => s.Order))
            .ThenInclude(s => s.Topics.OrderBy(t => t.Order))
                .ThenInclude(t => t.Questions.OrderBy(q => q.Order))
        .Include(x => x.Sections.OrderBy(s => s.Order))
            .ThenInclude(s => s.Questions.OrderBy(q => q.Order))
        .Include(x => x.Instructions.OrderBy(i => i.Order))
        .Include(x => x.AccessPolicy)
        .AsNoTracking()
        .FirstOrDefaultAsync(x => x.Id == sourceExamId && !x.IsDeleted);

    if (source == null)
    {
      return ApiResponse<ExamDto>.FailureResponse("Source exam not found");
    }

    // 2. Check department access
    var hasAccess = await HasAccessToExamAsync(source.DepartmentId);
    if (!hasAccess)
    {
      return ApiResponse<ExamDto>.FailureResponse("You do not have access to this exam");
    }

    // 3. Validate unique title within department
    var titleExists = await _context.Exams
        .AnyAsync(x => x.DepartmentId == source.DepartmentId &&
            !x.IsDeleted &&
            (x.TitleEn.ToLower() == dto.TitleEn.ToLower() ||
             x.TitleAr.ToLower() == dto.TitleAr.ToLower()));

    if (titleExists)
    {
      return ApiResponse<ExamDto>.FailureResponse("An exam with this title already exists in this department");
    }

    // 4. Create new exam with user-provided fields + copied settings
    var newExam = new Exam
    {
      DepartmentId = source.DepartmentId,
      ExamType = dto.ExamType,
      TitleEn = dto.TitleEn,
      TitleAr = dto.TitleAr,
      DescriptionEn = dto.DescriptionEn,
      DescriptionAr = dto.DescriptionAr,
      StartAt = dto.StartAt,
      EndAt = dto.EndAt,
      DurationMinutes = dto.DurationMinutes,
      // Copied from source
      MaxAttempts = source.MaxAttempts,
      ShuffleQuestions = source.ShuffleQuestions,
      ShuffleOptions = source.ShuffleOptions,
      PassScore = source.PassScore,
      IsPublished = false,
      IsActive = true,
      // Result & Review
      ShowResults = source.ShowResults,
      AllowReview = source.AllowReview,
      ShowCorrectAnswers = source.ShowCorrectAnswers,
      // Proctoring
      RequireProctoring = source.RequireProctoring,
      RequireIdVerification = source.RequireIdVerification,
      RequireWebcam = source.RequireWebcam,
      // Security
      PreventCopyPaste = source.PreventCopyPaste,
      PreventScreenCapture = source.PreventScreenCapture,
      RequireFullscreen = source.RequireFullscreen,
      BrowserLockdown = source.BrowserLockdown,
      CreatedDate = DateTime.UtcNow,
      CreatedBy = createdBy
    };

    _context.Exams.Add(newExam);
    await _context.SaveChangesAsync();

    // 5. Clone Sections → Topics → Questions
    if (source.Sections?.Any() == true)
    {
      foreach (var srcSection in source.Sections)
      {
        var newSection = new ExamSection
        {
          ExamId = newExam.Id,
          TitleEn = srcSection.TitleEn,
          TitleAr = srcSection.TitleAr,
          DescriptionEn = srcSection.DescriptionEn,
          DescriptionAr = srcSection.DescriptionAr,
          Order = srcSection.Order,
          DurationMinutes = srcSection.DurationMinutes,
          TotalPointsOverride = srcSection.TotalPointsOverride,
          SourceType = srcSection.SourceType,
          QuestionSubjectId = srcSection.QuestionSubjectId,
          QuestionTopicId = srcSection.QuestionTopicId,
          PickCount = srcSection.PickCount,
          CreatedDate = DateTime.UtcNow,
          CreatedBy = createdBy
        };

        _context.ExamSections.Add(newSection);
        await _context.SaveChangesAsync();

        // Clone Topics
        if (srcSection.Topics?.Any() == true)
        {
          foreach (var srcTopic in srcSection.Topics)
          {
            var newTopic = new ExamTopic
            {
              ExamSectionId = newSection.Id,
              TitleEn = srcTopic.TitleEn,
              TitleAr = srcTopic.TitleAr,
              DescriptionEn = srcTopic.DescriptionEn,
              DescriptionAr = srcTopic.DescriptionAr,
              Order = srcTopic.Order,
              CreatedDate = DateTime.UtcNow,
              CreatedBy = createdBy
            };

            _context.Set<ExamTopic>().Add(newTopic);
            await _context.SaveChangesAsync();

            // Clone questions under this topic
            if (srcTopic.Questions?.Any() == true)
            {
              foreach (var srcQ in srcTopic.Questions)
              {
                _context.ExamQuestions.Add(new ExamQuestion
                {
                  ExamId = newExam.Id,
                  ExamSectionId = newSection.Id,
                  ExamTopicId = newTopic.Id,
                  QuestionId = srcQ.QuestionId,
                  Order = srcQ.Order,
                  Points = srcQ.Points,
                  IsRequired = srcQ.IsRequired,
                  CreatedDate = DateTime.UtcNow,
                  CreatedBy = createdBy
                });
              }
            }
          }
        }

        // Clone section-level questions (not under any topic)
        var sectionOnlyQuestions = srcSection.Questions?
            .Where(q => q.ExamTopicId == null || q.ExamTopicId == 0)
            .ToList();

        if (sectionOnlyQuestions?.Any() == true)
        {
          foreach (var srcQ in sectionOnlyQuestions)
          {
            _context.ExamQuestions.Add(new ExamQuestion
            {
              ExamId = newExam.Id,
              ExamSectionId = newSection.Id,
              ExamTopicId = null,
              QuestionId = srcQ.QuestionId,
              Order = srcQ.Order,
              Points = srcQ.Points,
              IsRequired = srcQ.IsRequired,
              CreatedDate = DateTime.UtcNow,
              CreatedBy = createdBy
            });
          }
        }

        await _context.SaveChangesAsync();
      }
    }

    // 6. Clone Instructions
    if (source.Instructions?.Any() == true)
    {
      foreach (var srcInst in source.Instructions)
      {
        _context.Set<ExamInstruction>().Add(new ExamInstruction
        {
          ExamId = newExam.Id,
          ContentEn = srcInst.ContentEn,
          ContentAr = srcInst.ContentAr,
          Order = srcInst.Order,
          CreatedDate = DateTime.UtcNow,
          CreatedBy = createdBy
        });
      }
      await _context.SaveChangesAsync();
    }

    // 7. Clone Access Policy
    if (source.AccessPolicy != null)
    {
      _context.Set<ExamAccessPolicy>().Add(new ExamAccessPolicy
      {
        ExamId = newExam.Id,
        IsPublic = source.AccessPolicy.IsPublic,
        AccessCode = source.AccessPolicy.AccessCode,
        RestrictToAssignedCandidates = source.AccessPolicy.RestrictToAssignedCandidates,
        CreatedDate = DateTime.UtcNow,
        CreatedBy = createdBy
      });
      await _context.SaveChangesAsync();
    }

    // 8. Return full new exam
    return await GetExamByIdAsync(newExam.Id);
  }

  #endregion
}
