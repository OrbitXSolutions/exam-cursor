using Mapster;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Lookups;
using Smart_Core.Application.Interfaces.Lookups;
using Smart_Core.Domain.Entities.Lookups;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Lookups;

public class LookupsService : ILookupsService
{
    private readonly ApplicationDbContext _context;

    public LookupsService(ApplicationDbContext context)
    {
        _context = context;
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

        return ApiResponse<bool>.SuccessResponse(true, "Question type deleted successfully");
    }

    #endregion

    #region Question Subject

    public async Task<ApiResponse<PaginatedResponse<QuestionSubjectDto>>> GetAllQuestionSubjectsAsync(QuestionSubjectSearchDto searchDto)
    {
        var query = _context.QuestionSubjects
            .Include(x => x.Topics)
            .AsQueryable();

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

        var dtos = items.Select(x => new QuestionSubjectDto
        {
            Id = x.Id,
            NameEn = x.NameEn,
            NameAr = x.NameAr,
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
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
        {
            return ApiResponse<QuestionSubjectDto>.FailureResponse("Question subject not found");
        }

        var dto = new QuestionSubjectDto
        {
            Id = entity.Id,
            NameEn = entity.NameEn,
            NameAr = entity.NameAr,
            TopicsCount = entity.Topics.Count(t => !t.IsDeleted),
            CreatedDate = entity.CreatedDate,
            UpdatedDate = entity.UpdatedDate,
            IsDeleted = entity.IsDeleted
        };

        return ApiResponse<QuestionSubjectDto>.SuccessResponse(dto);
    }

    public async Task<ApiResponse<QuestionSubjectDto>> CreateQuestionSubjectAsync(CreateQuestionSubjectDto dto, string createdBy)
    {
        // Check for duplicate NameEn
        var existingEn = await _context.QuestionSubjects
            .IgnoreQueryFilters()
            .AnyAsync(x => x.NameEn == dto.NameEn);

        if (existingEn)
        {
            return ApiResponse<QuestionSubjectDto>.FailureResponse("A question subject with this English name already exists");
        }

        // Check for duplicate NameAr
        var existingAr = await _context.QuestionSubjects
            .IgnoreQueryFilters()
            .AnyAsync(x => x.NameAr == dto.NameAr);

        if (existingAr)
        {
            return ApiResponse<QuestionSubjectDto>.FailureResponse("A question subject with this Arabic name already exists");
        }

        var entity = new QuestionSubject
        {
            NameEn = dto.NameEn,
            NameAr = dto.NameAr,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.QuestionSubjects.Add(entity);
        await _context.SaveChangesAsync();

        var resultDto = new QuestionSubjectDto
        {
            Id = entity.Id,
            NameEn = entity.NameEn,
            NameAr = entity.NameAr,
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
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
        {
            return ApiResponse<QuestionSubjectDto>.FailureResponse("Question subject not found");
        }

        // Check for duplicate NameEn (excluding current entity)
        var existingEn = await _context.QuestionSubjects
            .IgnoreQueryFilters()
            .AnyAsync(x => x.NameEn == dto.NameEn && x.Id != id);

        if (existingEn)
        {
            return ApiResponse<QuestionSubjectDto>.FailureResponse("A question subject with this English name already exists");
        }

        // Check for duplicate NameAr (excluding current entity)
        var existingAr = await _context.QuestionSubjects
            .IgnoreQueryFilters()
            .AnyAsync(x => x.NameAr == dto.NameAr && x.Id != id);

        if (existingAr)
        {
            return ApiResponse<QuestionSubjectDto>.FailureResponse("A question subject with this Arabic name already exists");
        }

        entity.NameEn = dto.NameEn;
        entity.NameAr = dto.NameAr;
        entity.UpdatedDate = DateTime.UtcNow;
        entity.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();

        var resultDto = new QuestionSubjectDto
        {
            Id = entity.Id,
            NameEn = entity.NameEn,
            NameAr = entity.NameAr,
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

        // Check if new subject exists (if changed)
        QuestionSubject? subject = entity.Subject;
        if (dto.SubjectId != entity.SubjectId)
        {
            subject = await _context.QuestionSubjects.FindAsync(dto.SubjectId);
            if (subject == null)
            {
                return ApiResponse<QuestionTopicDto>.FailureResponse("Subject not found");
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

        return ApiResponse<bool>.SuccessResponse(true, "Question topic deleted successfully");
    }

    #endregion
}
