using Mapster;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Lookups;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Lookups;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Lookups;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Lookups;

public class LookupsService : ILookupsService
{
    private readonly ApplicationDbContext _context;
    private readonly IDepartmentService _departmentService;
    private readonly ICurrentUserService _currentUserService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICacheService _cache;

    public LookupsService(
        ApplicationDbContext context,
        IDepartmentService departmentService,
        ICurrentUserService currentUserService,
        UserManager<ApplicationUser> userManager,
        ICacheService cache)
    {
        _context = context;
        _departmentService = departmentService;
        _currentUserService = currentUserService;
        _userManager = userManager;
        _cache = cache;
    }

    private async Task<bool> IsCurrentUserSuperDevAsync()
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId)) return false;
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return false;
        return await _userManager.IsInRoleAsync(user, AppRoles.SuperDev);
    }

    private void InvalidateLookupCache(string prefix)
    {
        _cache.RemoveByPrefix(prefix);
        // Lookups changes may affect question/exam list displays
        _cache.RemoveByPrefix(CacheKeys.QuestionsPrefix);
        _cache.RemoveByPrefix(CacheKeys.ExamsPrefix);
    }

    #region Question Category

    public async Task<ApiResponse<PaginatedResponse<QuestionCategoryDto>>> GetAllQuestionCategoriesAsync(QuestionCategorySearchDto searchDto)
    {
        var query = _context.QuestionCategories.AsQueryable();

        // Include deleted if requested
        if (searchDto.IncludeDeleted)
        {
            query = query.IgnoreQueryFilters();
        }

        // Search filter
        if (!string.IsNullOrWhiteSpace(searchDto.Search))
        {
            var search = searchDto.Search.ToLower();
            query = query.Where(x => x.NameEn.ToLower().Contains(search) ||
             x.NameAr.Contains(search));
        }

        // Sort by newest to oldest
        query = query.OrderByDescending(x => x.CreatedDate);

        // Pagination
        var totalCount = await query.CountAsync();
        var items = await query
         .Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
      .Take(searchDto.PageSize)
   .ToListAsync();

        var response = new PaginatedResponse<QuestionCategoryDto>
        {
            Items = items.Adapt<List<QuestionCategoryDto>>(),
            PageNumber = searchDto.PageNumber,
            PageSize = searchDto.PageSize,
            TotalCount = totalCount
        };

        return ApiResponse<PaginatedResponse<QuestionCategoryDto>>.SuccessResponse(response);
    }

    public async Task<ApiResponse<QuestionCategoryDto>> GetQuestionCategoryByIdAsync(int id)
    {
        var entity = await _context.QuestionCategories.FindAsync(id);

        if (entity == null)
        {
            return ApiResponse<QuestionCategoryDto>.FailureResponse("Question category not found");
        }

        return ApiResponse<QuestionCategoryDto>.SuccessResponse(entity.Adapt<QuestionCategoryDto>());
    }

    public async Task<ApiResponse<QuestionCategoryDto>> CreateQuestionCategoryAsync(CreateQuestionCategoryDto dto, string createdBy)
    {
        // Check for duplicate NameEn
        var existingEn = await _context.QuestionCategories
            .IgnoreQueryFilters()
          .AnyAsync(x => x.NameEn == dto.NameEn);

        if (existingEn)
        {
            return ApiResponse<QuestionCategoryDto>.FailureResponse("A question category with this English name already exists");
        }

        // Check for duplicate NameAr
        var existingAr = await _context.QuestionCategories
        .IgnoreQueryFilters()
             .AnyAsync(x => x.NameAr == dto.NameAr);

        if (existingAr)
        {
            return ApiResponse<QuestionCategoryDto>.FailureResponse("A question category with this Arabic name already exists");
        }

        var entity = new QuestionCategory
        {
            NameEn = dto.NameEn,
            NameAr = dto.NameAr,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.QuestionCategories.Add(entity);
        await _context.SaveChangesAsync();
        InvalidateLookupCache(CacheKeys.CategoriesPrefix);

        return ApiResponse<QuestionCategoryDto>.SuccessResponse(
          entity.Adapt<QuestionCategoryDto>(),
     "Question category created successfully");
    }

    public async Task<ApiResponse<QuestionCategoryDto>> UpdateQuestionCategoryAsync(int id, UpdateQuestionCategoryDto dto, string updatedBy)
    {
        var entity = await _context.QuestionCategories.FindAsync(id);

        if (entity == null)
        {
            return ApiResponse<QuestionCategoryDto>.FailureResponse("Question category not found");
        }

        // Check for duplicate NameEn (excluding current entity)
        var existingEn = await _context.QuestionCategories
            .IgnoreQueryFilters()
  .AnyAsync(x => x.NameEn == dto.NameEn && x.Id != id);

        if (existingEn)
        {
            return ApiResponse<QuestionCategoryDto>.FailureResponse("A question category with this English name already exists");
        }

        // Check for duplicate NameAr (excluding current entity)
        var existingAr = await _context.QuestionCategories
            .IgnoreQueryFilters()
            .AnyAsync(x => x.NameAr == dto.NameAr && x.Id != id);

        if (existingAr)
        {
            return ApiResponse<QuestionCategoryDto>.FailureResponse("A question category with this Arabic name already exists");
        }

        entity.NameEn = dto.NameEn;
        entity.NameAr = dto.NameAr;
        entity.UpdatedDate = DateTime.UtcNow;
        entity.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();
        InvalidateLookupCache(CacheKeys.CategoriesPrefix);

        return ApiResponse<QuestionCategoryDto>.SuccessResponse(
 entity.Adapt<QuestionCategoryDto>(),
 "Question category updated successfully");
    }

    public async Task<ApiResponse<bool>> DeleteQuestionCategoryAsync(int id)
    {
        var entity = await _context.QuestionCategories
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
        {
            return ApiResponse<bool>.FailureResponse("Question category not found");
        }

        // Hard delete
        _context.QuestionCategories.Remove(entity);
        await _context.SaveChangesAsync();
        InvalidateLookupCache(CacheKeys.CategoriesPrefix);

        return ApiResponse<bool>.SuccessResponse(true, "Question category deleted successfully");
    }

    #endregion

    #region Question Type

    public async Task<ApiResponse<PaginatedResponse<QuestionTypeDto>>> GetAllQuestionTypesAsync(QuestionTypeSearchDto searchDto)
    {
        var query = _context.QuestionTypes.AsQueryable();

        // Include deleted if requested
        if (searchDto.IncludeDeleted)
        {
            query = query.IgnoreQueryFilters();
        }

        // Search filter
        if (!string.IsNullOrWhiteSpace(searchDto.Search))
        {
            var search = searchDto.Search.ToLower();
            query = query.Where(x => x.NameEn.ToLower().Contains(search) ||
                x.NameAr.Contains(search));
        }

        // Sort by newest to oldest
        query = query.OrderByDescending(x => x.CreatedDate);

        // Pagination
        var totalCount = await query.CountAsync();
        var items = await query
                  .Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
            .Take(searchDto.PageSize)
               .ToListAsync();

        var response = new PaginatedResponse<QuestionTypeDto>
        {
            Items = items.Adapt<List<QuestionTypeDto>>(),
            PageNumber = searchDto.PageNumber,
            PageSize = searchDto.PageSize,
            TotalCount = totalCount
        };

        return ApiResponse<PaginatedResponse<QuestionTypeDto>>.SuccessResponse(response);
    }

    public async Task<ApiResponse<QuestionTypeDto>> GetQuestionTypeByIdAsync(int id)
    {
        var entity = await _context.QuestionTypes.FindAsync(id);

        if (entity == null)
        {
            return ApiResponse<QuestionTypeDto>.FailureResponse("Question type not found");
        }

        return ApiResponse<QuestionTypeDto>.SuccessResponse(entity.Adapt<QuestionTypeDto>());
    }

    public async Task<ApiResponse<QuestionTypeDto>> CreateQuestionTypeAsync(CreateQuestionTypeDto dto, string createdBy)
    {
        // Check for duplicate NameEn
        var existingEn = await _context.QuestionTypes
    .IgnoreQueryFilters()
          .AnyAsync(x => x.NameEn == dto.NameEn);

        if (existingEn)
        {
            return ApiResponse<QuestionTypeDto>.FailureResponse("A question type with this English name already exists");
        }

        // Check for duplicate NameAr
        var existingAr = await _context.QuestionTypes
                 .IgnoreQueryFilters()
        .AnyAsync(x => x.NameAr == dto.NameAr);

        if (existingAr)
        {
            return ApiResponse<QuestionTypeDto>.FailureResponse("A question type with this Arabic name already exists");
        }

        var entity = new QuestionType
        {
            NameEn = dto.NameEn,
            NameAr = dto.NameAr,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.QuestionTypes.Add(entity);
        await _context.SaveChangesAsync();
        InvalidateLookupCache(CacheKeys.QuestionTypesPrefix);

        return ApiResponse<QuestionTypeDto>.SuccessResponse(
              entity.Adapt<QuestionTypeDto>(),
              "Question type created successfully");
    }

    public async Task<ApiResponse<QuestionTypeDto>> UpdateQuestionTypeAsync(int id, UpdateQuestionTypeDto dto, string updatedBy)
    {
        var entity = await _context.QuestionTypes.FindAsync(id);

        if (entity == null)
        {
            return ApiResponse<QuestionTypeDto>.FailureResponse("Question type not found");
        }

        // Check for duplicate NameEn (excluding current entity)
        var existingEn = await _context.QuestionTypes
               .IgnoreQueryFilters()
          .AnyAsync(x => x.NameEn == dto.NameEn && x.Id != id);

        if (existingEn)
        {
            return ApiResponse<QuestionTypeDto>.FailureResponse("A question type with this English name already exists");
        }

        // Check for duplicate NameAr (excluding current entity)
        var existingAr = await _context.QuestionTypes
        .IgnoreQueryFilters()
    .AnyAsync(x => x.NameAr == dto.NameAr && x.Id != id);

        if (existingAr)
        {
            return ApiResponse<QuestionTypeDto>.FailureResponse("A question type with this Arabic name already exists");
        }

        entity.NameEn = dto.NameEn;
        entity.NameAr = dto.NameAr;
        entity.UpdatedDate = DateTime.UtcNow;
        entity.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();
        InvalidateLookupCache(CacheKeys.QuestionTypesPrefix);

        return ApiResponse<QuestionTypeDto>.SuccessResponse(
 entity.Adapt<QuestionTypeDto>(),
            "Question type updated successfully");
    }

    public async Task<ApiResponse<bool>> DeleteQuestionTypeAsync(int id)
    {
        var entity = await _context.QuestionTypes
       .IgnoreQueryFilters()
             .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
        {
            return ApiResponse<bool>.FailureResponse("Question type not found");
        }

        // Hard delete
        _context.QuestionTypes.Remove(entity);
        await _context.SaveChangesAsync();
        InvalidateLookupCache(CacheKeys.QuestionTypesPrefix);

        return ApiResponse<bool>.SuccessResponse(true, "Question type deleted successfully");
    }

    #endregion

    #region Question Subject

    public async Task<ApiResponse<PaginatedResponse<QuestionSubjectDto>>> GetAllQuestionSubjectsAsync(QuestionSubjectSearchDto searchDto)
    {
        var query = _context.QuestionSubjects
            .Include(x => x.Topics)
            .Include(x => x.Department)
            .AsQueryable();

        // Include deleted if requested
        if (searchDto.IncludeDeleted)
        {
            query = query.IgnoreQueryFilters();
        }

        // Department isolation: filter by user's department (SuperDev sees all)
        if (!await IsCurrentUserSuperDevAsync())
        {
            var userDepartmentId = await _departmentService.GetCurrentUserDepartmentIdAsync();
            if (userDepartmentId.HasValue)
            {
                query = query.Where(x => x.DepartmentId == userDepartmentId.Value);
            }
        }

        // Search filter
        if (!string.IsNullOrWhiteSpace(searchDto.Search))
        {
            var search = searchDto.Search.ToLower();
            query = query.Where(x => x.NameEn.ToLower().Contains(search) ||
                x.NameAr.Contains(search));
        }

        // Sort by newest to oldest
        query = query.OrderByDescending(x => x.CreatedDate);

        // Pagination
        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
            .Take(searchDto.PageSize)
            .ToListAsync();

        var dtos = items.Select(x => new QuestionSubjectDto
        {
            Id = x.Id,
            NameEn = x.NameEn,
            NameAr = x.NameAr,
            DepartmentId = x.DepartmentId,
            DepartmentNameEn = x.Department?.NameEn ?? string.Empty,
            DepartmentNameAr = x.Department?.NameAr ?? string.Empty,
            TopicsCount = x.Topics.Count(t => !t.IsDeleted),
            CreatedDate = x.CreatedDate,
            UpdatedDate = x.UpdatedDate,
            IsDeleted = x.IsDeleted
        }).ToList();

        var response = new PaginatedResponse<QuestionSubjectDto>
        {
            Items = dtos,
            PageNumber = searchDto.PageNumber,
            PageSize = searchDto.PageSize,
            TotalCount = totalCount
        };

        return ApiResponse<PaginatedResponse<QuestionSubjectDto>>.SuccessResponse(response);
    }

    public async Task<ApiResponse<QuestionSubjectDto>> GetQuestionSubjectByIdAsync(int id)
    {
        var entity = await _context.QuestionSubjects
            .Include(x => x.Topics)
            .Include(x => x.Department)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
        {
            return ApiResponse<QuestionSubjectDto>.FailureResponse("Question subject not found");
        }

        // Department isolation check
        if (!await IsCurrentUserSuperDevAsync())
        {
            var userDepartmentId = await _departmentService.GetCurrentUserDepartmentIdAsync();
            if (userDepartmentId.HasValue && entity.DepartmentId != userDepartmentId.Value)
            {
                return ApiResponse<QuestionSubjectDto>.FailureResponse("You do not have access to this subject");
            }
        }

        var dto = new QuestionSubjectDto
        {
            Id = entity.Id,
            NameEn = entity.NameEn,
            NameAr = entity.NameAr,
            DepartmentId = entity.DepartmentId,
            DepartmentNameEn = entity.Department?.NameEn ?? string.Empty,
            DepartmentNameAr = entity.Department?.NameAr ?? string.Empty,
            TopicsCount = entity.Topics.Count(t => !t.IsDeleted),
            CreatedDate = entity.CreatedDate,
            UpdatedDate = entity.UpdatedDate,
            IsDeleted = entity.IsDeleted
        };

        return ApiResponse<QuestionSubjectDto>.SuccessResponse(dto);
    }

    public async Task<ApiResponse<QuestionSubjectDto>> CreateQuestionSubjectAsync(CreateQuestionSubjectDto dto, string createdBy)
    {
        // Auto-set DepartmentId from current user's department
        var userDepartmentId = await _departmentService.GetCurrentUserDepartmentIdAsync();
        if (!userDepartmentId.HasValue)
        {
            return ApiResponse<QuestionSubjectDto>.FailureResponse("You must be assigned to a department to create a subject");
        }

        var departmentId = userDepartmentId.Value;

        // Check for duplicate NameEn within the same department
        var existingEn = await _context.QuestionSubjects
            .IgnoreQueryFilters()
            .AnyAsync(x => x.DepartmentId == departmentId && x.NameEn == dto.NameEn);

        if (existingEn)
        {
            return ApiResponse<QuestionSubjectDto>.FailureResponse("A question subject with this English name already exists in your department");
        }

        // Check for duplicate NameAr within the same department
        var existingAr = await _context.QuestionSubjects
            .IgnoreQueryFilters()
            .AnyAsync(x => x.DepartmentId == departmentId && x.NameAr == dto.NameAr);

        if (existingAr)
        {
            return ApiResponse<QuestionSubjectDto>.FailureResponse("A question subject with this Arabic name already exists in your department");
        }

        // Get department for response
        var department = await _context.Departments.FindAsync(departmentId);

        var entity = new QuestionSubject
        {
            NameEn = dto.NameEn,
            NameAr = dto.NameAr,
            DepartmentId = departmentId,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.QuestionSubjects.Add(entity);
        await _context.SaveChangesAsync();
        InvalidateLookupCache(CacheKeys.SubjectsPrefix);

        var resultDto = new QuestionSubjectDto
        {
            Id = entity.Id,
            NameEn = entity.NameEn,
            NameAr = entity.NameAr,
            DepartmentId = entity.DepartmentId,
            DepartmentNameEn = department?.NameEn ?? string.Empty,
            DepartmentNameAr = department?.NameAr ?? string.Empty,
            TopicsCount = 0,
            CreatedDate = entity.CreatedDate,
            UpdatedDate = entity.UpdatedDate,
            IsDeleted = entity.IsDeleted
        };

        return ApiResponse<QuestionSubjectDto>.SuccessResponse(resultDto, "Question subject created successfully");
    }

    public async Task<ApiResponse<QuestionSubjectDto>> UpdateQuestionSubjectAsync(int id, UpdateQuestionSubjectDto dto, string updatedBy)
    {
        var entity = await _context.QuestionSubjects
            .Include(x => x.Topics)
            .Include(x => x.Department)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
        {
            return ApiResponse<QuestionSubjectDto>.FailureResponse("Question subject not found");
        }

        // Department isolation check
        if (!await IsCurrentUserSuperDevAsync())
        {
            var userDepartmentId = await _departmentService.GetCurrentUserDepartmentIdAsync();
            if (userDepartmentId.HasValue && entity.DepartmentId != userDepartmentId.Value)
            {
                return ApiResponse<QuestionSubjectDto>.FailureResponse("You do not have access to this subject");
            }
        }

        // Check for duplicate NameEn within the same department (excluding current entity)
        var existingEn = await _context.QuestionSubjects
            .IgnoreQueryFilters()
            .AnyAsync(x => x.DepartmentId == entity.DepartmentId && x.NameEn == dto.NameEn && x.Id != id);

        if (existingEn)
        {
            return ApiResponse<QuestionSubjectDto>.FailureResponse("A question subject with this English name already exists in your department");
        }

        // Check for duplicate NameAr within the same department (excluding current entity)
        var existingAr = await _context.QuestionSubjects
            .IgnoreQueryFilters()
            .AnyAsync(x => x.DepartmentId == entity.DepartmentId && x.NameAr == dto.NameAr && x.Id != id);

        if (existingAr)
        {
            return ApiResponse<QuestionSubjectDto>.FailureResponse("A question subject with this Arabic name already exists in your department");
        }

        entity.NameEn = dto.NameEn;
        entity.NameAr = dto.NameAr;
        entity.UpdatedDate = DateTime.UtcNow;
        entity.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();
        InvalidateLookupCache(CacheKeys.SubjectsPrefix);

        var resultDto = new QuestionSubjectDto
        {
            Id = entity.Id,
            NameEn = entity.NameEn,
            NameAr = entity.NameAr,
            DepartmentId = entity.DepartmentId,
            DepartmentNameEn = entity.Department?.NameEn ?? string.Empty,
            DepartmentNameAr = entity.Department?.NameAr ?? string.Empty,
            TopicsCount = entity.Topics.Count(t => !t.IsDeleted),
            CreatedDate = entity.CreatedDate,
            UpdatedDate = entity.UpdatedDate,
            IsDeleted = entity.IsDeleted
        };

        return ApiResponse<QuestionSubjectDto>.SuccessResponse(resultDto, "Question subject updated successfully");
    }

    public async Task<ApiResponse<bool>> DeleteQuestionSubjectAsync(int id)
    {
        var entity = await _context.QuestionSubjects
            .IgnoreQueryFilters()
            .Include(x => x.Topics)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
        {
            return ApiResponse<bool>.FailureResponse("Question subject not found");
        }

        // Check if subject has topics
        if (entity.Topics.Any(t => !t.IsDeleted))
        {
            return ApiResponse<bool>.FailureResponse("Cannot delete subject with existing topics. Please delete topics first.");
        }

        // Check if subject is used by questions
        var hasQuestions = await _context.Questions.AnyAsync(q => q.SubjectId == id);
        if (hasQuestions)
        {
            return ApiResponse<bool>.FailureResponse("Cannot delete subject that is used by questions.");
        }

        // Hard delete
        _context.QuestionSubjects.Remove(entity);
        await _context.SaveChangesAsync();
        InvalidateLookupCache(CacheKeys.SubjectsPrefix);

        return ApiResponse<bool>.SuccessResponse(true, "Question subject deleted successfully");
    }

    #endregion

    #region Question Topic

    public async Task<ApiResponse<PaginatedResponse<QuestionTopicDto>>> GetAllQuestionTopicsAsync(QuestionTopicSearchDto searchDto)
    {
        var query = _context.QuestionTopics
            .Include(x => x.Subject)
            .AsQueryable();

        // Include deleted if requested
        if (searchDto.IncludeDeleted)
        {
            query = query.IgnoreQueryFilters();
        }

        // Department isolation: filter topics via Subject.DepartmentId (SuperDev sees all)
        if (!await IsCurrentUserSuperDevAsync())
        {
            var userDepartmentId = await _departmentService.GetCurrentUserDepartmentIdAsync();
            if (userDepartmentId.HasValue)
            {
                query = query.Where(x => x.Subject.DepartmentId == userDepartmentId.Value);
            }
        }

        // Filter by subject
        if (searchDto.SubjectId.HasValue)
        {
            query = query.Where(x => x.SubjectId == searchDto.SubjectId.Value);
        }

        // Search filter
        if (!string.IsNullOrWhiteSpace(searchDto.Search))
        {
            var search = searchDto.Search.ToLower();
            query = query.Where(x => x.NameEn.ToLower().Contains(search) ||
                x.NameAr.Contains(search));
        }

        // Sort by newest to oldest
        query = query.OrderByDescending(x => x.CreatedDate);

        // Pagination
        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
            .Take(searchDto.PageSize)
            .ToListAsync();

        var dtos = items.Select(x => new QuestionTopicDto
        {
            Id = x.Id,
            NameEn = x.NameEn,
            NameAr = x.NameAr,
            SubjectId = x.SubjectId,
            SubjectNameEn = x.Subject.NameEn,
            SubjectNameAr = x.Subject.NameAr,
            CreatedDate = x.CreatedDate,
            UpdatedDate = x.UpdatedDate,
            IsDeleted = x.IsDeleted
        }).ToList();

        var response = new PaginatedResponse<QuestionTopicDto>
        {
            Items = dtos,
            PageNumber = searchDto.PageNumber,
            PageSize = searchDto.PageSize,
            TotalCount = totalCount
        };

        return ApiResponse<PaginatedResponse<QuestionTopicDto>>.SuccessResponse(response);
    }

    public async Task<ApiResponse<QuestionTopicDto>> GetQuestionTopicByIdAsync(int id)
    {
        var entity = await _context.QuestionTopics
            .Include(x => x.Subject)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
        {
            return ApiResponse<QuestionTopicDto>.FailureResponse("Question topic not found");
        }

        // Department isolation check via Subject
        if (!await IsCurrentUserSuperDevAsync())
        {
            var userDepartmentId = await _departmentService.GetCurrentUserDepartmentIdAsync();
            if (userDepartmentId.HasValue && entity.Subject.DepartmentId != userDepartmentId.Value)
            {
                return ApiResponse<QuestionTopicDto>.FailureResponse("You do not have access to this topic");
            }
        }

        var dto = new QuestionTopicDto
        {
            Id = entity.Id,
            NameEn = entity.NameEn,
            NameAr = entity.NameAr,
            SubjectId = entity.SubjectId,
            SubjectNameEn = entity.Subject.NameEn,
            SubjectNameAr = entity.Subject.NameAr,
            CreatedDate = entity.CreatedDate,
            UpdatedDate = entity.UpdatedDate,
            IsDeleted = entity.IsDeleted
        };

        return ApiResponse<QuestionTopicDto>.SuccessResponse(dto);
    }

    public async Task<ApiResponse<QuestionTopicDto>> CreateQuestionTopicAsync(CreateQuestionTopicDto dto, string createdBy)
    {
        // Check if subject exists
        var subject = await _context.QuestionSubjects.FindAsync(dto.SubjectId);
        if (subject == null)
        {
            return ApiResponse<QuestionTopicDto>.FailureResponse("Subject not found");
        }

        // Department isolation: ensure subject belongs to user's department
        if (!await IsCurrentUserSuperDevAsync())
        {
            var userDepartmentId = await _departmentService.GetCurrentUserDepartmentIdAsync();
            if (userDepartmentId.HasValue && subject.DepartmentId != userDepartmentId.Value)
            {
                return ApiResponse<QuestionTopicDto>.FailureResponse("You do not have access to this subject");
            }
        }

        // Check for duplicate NameEn within same subject
        var existingEn = await _context.QuestionTopics
            .IgnoreQueryFilters()
            .AnyAsync(x => x.SubjectId == dto.SubjectId && x.NameEn == dto.NameEn);

        if (existingEn)
        {
            return ApiResponse<QuestionTopicDto>.FailureResponse("A topic with this English name already exists in this subject");
        }

        // Check for duplicate NameAr within same subject
        var existingAr = await _context.QuestionTopics
            .IgnoreQueryFilters()
            .AnyAsync(x => x.SubjectId == dto.SubjectId && x.NameAr == dto.NameAr);

        if (existingAr)
        {
            return ApiResponse<QuestionTopicDto>.FailureResponse("A topic with this Arabic name already exists in this subject");
        }

        var entity = new QuestionTopic
        {
            NameEn = dto.NameEn,
            NameAr = dto.NameAr,
            SubjectId = dto.SubjectId,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.QuestionTopics.Add(entity);
        await _context.SaveChangesAsync();
        InvalidateLookupCache(CacheKeys.TopicsPrefix);

        var resultDto = new QuestionTopicDto
        {
            Id = entity.Id,
            NameEn = entity.NameEn,
            NameAr = entity.NameAr,
            SubjectId = entity.SubjectId,
            SubjectNameEn = subject.NameEn,
            SubjectNameAr = subject.NameAr,
            CreatedDate = entity.CreatedDate,
            UpdatedDate = entity.UpdatedDate,
            IsDeleted = entity.IsDeleted
        };

        return ApiResponse<QuestionTopicDto>.SuccessResponse(resultDto, "Question topic created successfully");
    }

    public async Task<ApiResponse<QuestionTopicDto>> UpdateQuestionTopicAsync(int id, UpdateQuestionTopicDto dto, string updatedBy)
    {
        var entity = await _context.QuestionTopics
            .Include(x => x.Subject)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
        {
            return ApiResponse<QuestionTopicDto>.FailureResponse("Question topic not found");
        }

        // Department isolation check via Subject
        if (!await IsCurrentUserSuperDevAsync())
        {
            var userDepartmentId = await _departmentService.GetCurrentUserDepartmentIdAsync();
            if (userDepartmentId.HasValue && entity.Subject.DepartmentId != userDepartmentId.Value)
            {
                return ApiResponse<QuestionTopicDto>.FailureResponse("You do not have access to this topic");
            }
        }

        // Check if new subject exists (if changed)
        QuestionSubject? subject = entity.Subject;
        if (dto.SubjectId != entity.SubjectId)
        {
            subject = await _context.QuestionSubjects.FindAsync(dto.SubjectId);
            if (subject == null)
            {
                return ApiResponse<QuestionTopicDto>.FailureResponse("Subject not found");
            }

            // Ensure new subject also belongs to user's department
            if (!await IsCurrentUserSuperDevAsync())
            {
                var userDeptId = await _departmentService.GetCurrentUserDepartmentIdAsync();
                if (userDeptId.HasValue && subject.DepartmentId != userDeptId.Value)
                {
                    return ApiResponse<QuestionTopicDto>.FailureResponse("You do not have access to the target subject");
                }
            }
        }

        // Check for duplicate NameEn within same subject (excluding current entity)
        var existingEn = await _context.QuestionTopics
            .IgnoreQueryFilters()
            .AnyAsync(x => x.SubjectId == dto.SubjectId && x.NameEn == dto.NameEn && x.Id != id);

        if (existingEn)
        {
            return ApiResponse<QuestionTopicDto>.FailureResponse("A topic with this English name already exists in this subject");
        }

        // Check for duplicate NameAr within same subject (excluding current entity)
        var existingAr = await _context.QuestionTopics
            .IgnoreQueryFilters()
            .AnyAsync(x => x.SubjectId == dto.SubjectId && x.NameAr == dto.NameAr && x.Id != id);

        if (existingAr)
        {
            return ApiResponse<QuestionTopicDto>.FailureResponse("A topic with this Arabic name already exists in this subject");
        }

        entity.NameEn = dto.NameEn;
        entity.NameAr = dto.NameAr;
        entity.SubjectId = dto.SubjectId;
        entity.UpdatedDate = DateTime.UtcNow;
        entity.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();
        InvalidateLookupCache(CacheKeys.TopicsPrefix);

        var resultDto = new QuestionTopicDto
        {
            Id = entity.Id,
            NameEn = entity.NameEn,
            NameAr = entity.NameAr,
            SubjectId = entity.SubjectId,
            SubjectNameEn = subject!.NameEn,
            SubjectNameAr = subject.NameAr,
            CreatedDate = entity.CreatedDate,
            UpdatedDate = entity.UpdatedDate,
            IsDeleted = entity.IsDeleted
        };

        return ApiResponse<QuestionTopicDto>.SuccessResponse(resultDto, "Question topic updated successfully");
    }

    public async Task<ApiResponse<bool>> DeleteQuestionTopicAsync(int id)
    {
        var entity = await _context.QuestionTopics
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
        {
            return ApiResponse<bool>.FailureResponse("Question topic not found");
        }

        // Check if topic is used by questions
        var hasQuestions = await _context.Questions.AnyAsync(q => q.TopicId == id);
        if (hasQuestions)
        {
            return ApiResponse<bool>.FailureResponse("Cannot delete topic that is used by questions.");
        }

        // Hard delete
        _context.QuestionTopics.Remove(entity);
        await _context.SaveChangesAsync();
        InvalidateLookupCache(CacheKeys.TopicsPrefix);

        return ApiResponse<bool>.SuccessResponse(true, "Question topic deleted successfully");
    }

    #endregion
}
