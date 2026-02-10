using Mapster;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.QuestionBank;
using Smart_Core.Application.Interfaces.QuestionBank;
using Smart_Core.Domain.Entities.QuestionBank;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.QuestionBank;

public class QuestionBankService : IQuestionBankService
{
    private readonly ApplicationDbContext _context;

    public QuestionBankService(ApplicationDbContext context)
    {
        _context = context;
    }

    #region Questions

    public async Task<ApiResponse<PaginatedResponse<QuestionListDto>>> GetAllQuestionsAsync(QuestionSearchDto searchDto)
    {
        var query = _context.Questions
                   .Include(x => x.QuestionType)
              .Include(x => x.QuestionCategory)
                   .Include(x => x.Subject)
                   .Include(x => x.Topic)
                 .Include(x => x.Options)
                   .Include(x => x.Attachments)
          .AsQueryable();

        // Include deleted if requested
        if (searchDto.IncludeDeleted)
        {
            query = query.IgnoreQueryFilters();
        }

        // Search filter (searches both English and Arabic)
        if (!string.IsNullOrWhiteSpace(searchDto.Search))
        {
            var search = searchDto.Search.ToLower();
            query = query.Where(x =>
       x.BodyEn.ToLower().Contains(search) ||
                x.BodyAr.ToLower().Contains(search));
        }

        // Filter by QuestionTypeId
        if (searchDto.QuestionTypeId.HasValue)
        {
            query = query.Where(x => x.QuestionTypeId == searchDto.QuestionTypeId.Value);
        }

        // Filter by QuestionCategoryId
        if (searchDto.QuestionCategoryId.HasValue)
        {
            query = query.Where(x => x.QuestionCategoryId == searchDto.QuestionCategoryId.Value);
        }

        // Filter by SubjectId
        if (searchDto.SubjectId.HasValue)
        {
            query = query.Where(x => x.SubjectId == searchDto.SubjectId.Value);
        }

        // Filter by TopicId
        if (searchDto.TopicId.HasValue)
        {
            query = query.Where(x => x.TopicId == searchDto.TopicId.Value);
        }

        // Filter by DifficultyLevel
        if (searchDto.DifficultyLevel.HasValue)
        {
            query = query.Where(x => x.DifficultyLevel == searchDto.DifficultyLevel.Value);
        }

        // Filter by IsActive
        if (searchDto.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == searchDto.IsActive.Value);
        }

        // Sort by newest to oldest
        query = query.OrderByDescending(x => x.CreatedDate);

        // Pagination
        var totalCount = await query.CountAsync();
        var items = await query
         .Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
                 .Take(searchDto.PageSize)
                 .ToListAsync();

        var itemDtos = items.Select(x => new QuestionListDto
        {
            Id = x.Id,
            BodyEn = x.BodyEn,
            BodyAr = x.BodyAr,
            QuestionTypeNameEn = x.QuestionType?.NameEn ?? string.Empty,
            QuestionTypeNameAr = x.QuestionType?.NameAr ?? string.Empty,
            QuestionCategoryNameEn = x.QuestionCategory?.NameEn ?? string.Empty,
            QuestionCategoryNameAr = x.QuestionCategory?.NameAr ?? string.Empty,
            SubjectId = x.SubjectId,
            SubjectNameEn = x.Subject?.NameEn ?? string.Empty,
            SubjectNameAr = x.Subject?.NameAr ?? string.Empty,
            TopicId = x.TopicId,
            TopicNameEn = x.Topic?.NameEn,
            TopicNameAr = x.Topic?.NameAr,
            Points = x.Points,
            DifficultyLevel = x.DifficultyLevel,
            IsActive = x.IsActive,
            CreatedDate = x.CreatedDate,
            OptionsCount = x.Options.Count,
            AttachmentsCount = x.Attachments.Count
        }).ToList();

        var response = new PaginatedResponse<QuestionListDto>
        {
            Items = itemDtos,
            PageNumber = searchDto.PageNumber,
            PageSize = searchDto.PageSize,
            TotalCount = totalCount
        };

        return ApiResponse<PaginatedResponse<QuestionListDto>>.SuccessResponse(response);
    }

    public async Task<ApiResponse<QuestionDto>> GetQuestionByIdAsync(int id)
    {
        var entity = await _context.Questions
       .Include(x => x.QuestionType)
            .Include(x => x.QuestionCategory)
            .Include(x => x.Subject)
            .Include(x => x.Topic)
   .Include(x => x.Options.OrderBy(o => o.Order))
 .Include(x => x.Attachments)
     .Include(x => x.AnswerKey)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
        {
            return ApiResponse<QuestionDto>.FailureResponse("Question not found");
        }

        var dto = new QuestionDto
        {
            Id = entity.Id,
            BodyEn = entity.BodyEn,
            BodyAr = entity.BodyAr,
            ExplanationEn = entity.ExplanationEn,
            ExplanationAr = entity.ExplanationAr,
            QuestionTypeId = entity.QuestionTypeId,
            QuestionTypeNameEn = entity.QuestionType?.NameEn ?? string.Empty,
            QuestionTypeNameAr = entity.QuestionType?.NameAr ?? string.Empty,
            QuestionCategoryId = entity.QuestionCategoryId,
            QuestionCategoryNameEn = entity.QuestionCategory?.NameEn ?? string.Empty,
            QuestionCategoryNameAr = entity.QuestionCategory?.NameAr ?? string.Empty,
            SubjectId = entity.SubjectId,
            SubjectNameEn = entity.Subject?.NameEn ?? string.Empty,
            SubjectNameAr = entity.Subject?.NameAr ?? string.Empty,
            TopicId = entity.TopicId,
            TopicNameEn = entity.Topic?.NameEn,
            TopicNameAr = entity.Topic?.NameAr,
            Points = entity.Points,
            DifficultyLevel = entity.DifficultyLevel,
            IsActive = entity.IsActive,
            CreatedDate = entity.CreatedDate,
            UpdatedDate = entity.UpdatedDate,
            IsDeleted = entity.IsDeleted,
            Options = entity.Options.Select(o => new QuestionOptionDto
            {
                Id = o.Id,
                QuestionId = o.QuestionId,
                TextEn = o.TextEn,
                TextAr = o.TextAr,
                IsCorrect = o.IsCorrect,
                Order = o.Order,
                AttachmentPath = o.AttachmentPath,
                CreatedDate = o.CreatedDate
            }).ToList(),
            Attachments = entity.Attachments.Adapt<List<QuestionAttachmentDto>>(),
            AnswerKey = entity.AnswerKey != null ? new QuestionAnswerKeyDto
            {
                Id = entity.AnswerKey.Id,
                QuestionId = entity.AnswerKey.QuestionId,
                AcceptedAnswersJsonEn = entity.AnswerKey.AcceptedAnswersJsonEn,
                AcceptedAnswersJsonAr = entity.AnswerKey.AcceptedAnswersJsonAr,
                CaseSensitive = entity.AnswerKey.CaseSensitive,
                TrimSpaces = entity.AnswerKey.TrimSpaces,
                NormalizeWhitespace = entity.AnswerKey.NormalizeWhitespace,
                RubricTextEn = entity.AnswerKey.RubricTextEn,
                RubricTextAr = entity.AnswerKey.RubricTextAr,
                NumericAnswer = entity.AnswerKey.NumericAnswer,
                Tolerance = entity.AnswerKey.Tolerance
            } : null
        };

        return ApiResponse<QuestionDto>.SuccessResponse(dto);
    }

    public async Task<ApiResponse<QuestionDto>> CreateQuestionAsync(CreateQuestionDto dto, string createdBy)
    {
        // Validate QuestionType exists
        var questionTypeExists = await _context.QuestionTypes.AnyAsync(x => x.Id == dto.QuestionTypeId);
        if (!questionTypeExists)
        {
            return ApiResponse<QuestionDto>.FailureResponse("Question type not found");
        }

        // Validate QuestionCategory exists
        var questionCategoryExists = await _context.QuestionCategories.AnyAsync(x => x.Id == dto.QuestionCategoryId);
        if (!questionCategoryExists)
        {
            return ApiResponse<QuestionDto>.FailureResponse("Question category not found");
        }

        // Validate Subject exists
        var subjectExists = await _context.QuestionSubjects.AnyAsync(x => x.Id == dto.SubjectId);
        if (!subjectExists)
        {
            return ApiResponse<QuestionDto>.FailureResponse("Subject not found");
        }

        // Validate TopicId belongs to SubjectId (if provided)
        if (dto.TopicId.HasValue)
        {
            var topicBelongsToSubject = await _context.QuestionTopics
                .AnyAsync(x => x.Id == dto.TopicId.Value && x.SubjectId == dto.SubjectId);
            if (!topicBelongsToSubject)
            {
                return ApiResponse<QuestionDto>.FailureResponse("Topic does not belong to the selected subject");
            }
        }

        var entity = new Question
        {
            BodyEn = dto.BodyEn,
            BodyAr = dto.BodyAr,
            ExplanationEn = dto.ExplanationEn,
            ExplanationAr = dto.ExplanationAr,
            QuestionTypeId = dto.QuestionTypeId,
            QuestionCategoryId = dto.QuestionCategoryId,
            SubjectId = dto.SubjectId,
            TopicId = dto.TopicId,
            Points = dto.Points,
            DifficultyLevel = dto.DifficultyLevel,
            IsActive = dto.IsActive,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        // Add options if provided
        if (dto.Options.Any())
        {
            foreach (var optionDto in dto.Options)
            {
                entity.Options.Add(new QuestionOption
                {
                    TextEn = optionDto.TextEn,
                    TextAr = optionDto.TextAr,
                    IsCorrect = optionDto.IsCorrect,
                    Order = optionDto.Order,
                    AttachmentPath = optionDto.AttachmentPath,
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = createdBy
                });
            }
        }

        // Add answer key if provided
        if (dto.AnswerKey != null)
        {
            entity.AnswerKey = new QuestionAnswerKey
            {
                AcceptedAnswersJsonEn = dto.AnswerKey.AcceptedAnswersJsonEn,
                AcceptedAnswersJsonAr = dto.AnswerKey.AcceptedAnswersJsonAr,
                CaseSensitive = dto.AnswerKey.CaseSensitive,
                TrimSpaces = dto.AnswerKey.TrimSpaces,
                NormalizeWhitespace = dto.AnswerKey.NormalizeWhitespace,
                RubricTextEn = dto.AnswerKey.RubricTextEn,
                RubricTextAr = dto.AnswerKey.RubricTextAr,
                NumericAnswer = dto.AnswerKey.NumericAnswer,
                Tolerance = dto.AnswerKey.Tolerance,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = createdBy
            };
        }

        _context.Questions.Add(entity);
        await _context.SaveChangesAsync();

        return await GetQuestionByIdAsync(entity.Id);
    }

    public async Task<ApiResponse<QuestionDto>> UpdateQuestionAsync(int id, UpdateQuestionDto dto, string updatedBy)
    {
        var entity = await _context.Questions.FindAsync(id);

        if (entity == null)
        {
            return ApiResponse<QuestionDto>.FailureResponse("Question not found");
        }

        // Validate QuestionType exists
        var questionTypeExists = await _context.QuestionTypes.AnyAsync(x => x.Id == dto.QuestionTypeId);
        if (!questionTypeExists)
        {
            return ApiResponse<QuestionDto>.FailureResponse("Question type not found");
        }

        // Validate QuestionCategory exists
        var questionCategoryExists = await _context.QuestionCategories.AnyAsync(x => x.Id == dto.QuestionCategoryId);
        if (!questionCategoryExists)
        {
            return ApiResponse<QuestionDto>.FailureResponse("Question category not found");
        }

        // Validate Subject exists
        var subjectExists = await _context.QuestionSubjects.AnyAsync(x => x.Id == dto.SubjectId);
        if (!subjectExists)
        {
            return ApiResponse<QuestionDto>.FailureResponse("Subject not found");
        }

        // Validate TopicId belongs to SubjectId (if provided)
        if (dto.TopicId.HasValue)
        {
            var topicBelongsToSubject = await _context.QuestionTopics
                .AnyAsync(x => x.Id == dto.TopicId.Value && x.SubjectId == dto.SubjectId);
            if (!topicBelongsToSubject)
            {
                return ApiResponse<QuestionDto>.FailureResponse("Topic does not belong to the selected subject");
            }
        }

        entity.BodyEn = dto.BodyEn;
        entity.BodyAr = dto.BodyAr;
        entity.ExplanationEn = dto.ExplanationEn;
        entity.ExplanationAr = dto.ExplanationAr;
        entity.QuestionTypeId = dto.QuestionTypeId;
        entity.QuestionCategoryId = dto.QuestionCategoryId;
        entity.SubjectId = dto.SubjectId;
        entity.TopicId = dto.TopicId;
        entity.Points = dto.Points;
        entity.DifficultyLevel = dto.DifficultyLevel;
        entity.IsActive = dto.IsActive;
        entity.UpdatedDate = DateTime.UtcNow;
        entity.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();

        return await GetQuestionByIdAsync(entity.Id);
    }

    public async Task<ApiResponse<bool>> DeleteQuestionAsync(int id)
    {
        var entity = await _context.Questions
    .IgnoreQueryFilters()
            .Include(x => x.Options)
    .Include(x => x.Attachments)
 .Include(x => x.AnswerKey)
     .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
        {
            return ApiResponse<bool>.FailureResponse("Question not found");
        }

        // Hard delete - cascade will handle options, attachments, and answer key
        _context.Questions.Remove(entity);
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Question deleted successfully");
    }

    public async Task<ApiResponse<bool>> ToggleQuestionStatusAsync(int id, string updatedBy)
    {
        var entity = await _context.Questions.FindAsync(id);

        if (entity == null)
        {
            return ApiResponse<bool>.FailureResponse("Question not found");
        }

        entity.IsActive = !entity.IsActive;
        entity.UpdatedDate = DateTime.UtcNow;
        entity.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();

        var status = entity.IsActive ? "activated" : "deactivated";
        return ApiResponse<bool>.SuccessResponse(true, $"Question {status} successfully");
    }

    public async Task<ApiResponse<int>> GetQuestionsCountAsync(int? subjectId, int? topicId)
    {
        var query = _context.Questions.Where(q => q.IsActive && !q.IsDeleted);

        if (subjectId.HasValue)
        {
            query = query.Where(q => q.SubjectId == subjectId.Value);
        }

        if (topicId.HasValue)
        {
            query = query.Where(q => q.TopicId == topicId.Value);
        }

        var count = await query.CountAsync();
        return ApiResponse<int>.SuccessResponse(count);
    }

    #endregion

    #region Question Options

    public async Task<ApiResponse<List<QuestionOptionDto>>> GetQuestionOptionsAsync(int questionId)
    {
        var questionExists = await _context.Questions.AnyAsync(x => x.Id == questionId);
        if (!questionExists)
        {
            return ApiResponse<List<QuestionOptionDto>>.FailureResponse("Question not found");
        }

        var options = await _context.QuestionOptions
     .Where(x => x.QuestionId == questionId)
            .OrderBy(x => x.Order)
            .ToListAsync();

        var dtos = options.Select(o => new QuestionOptionDto
        {
            Id = o.Id,
            QuestionId = o.QuestionId,
            TextEn = o.TextEn,
            TextAr = o.TextAr,
            IsCorrect = o.IsCorrect,
            Order = o.Order,
            AttachmentPath = o.AttachmentPath,
            CreatedDate = o.CreatedDate
        }).ToList();

        return ApiResponse<List<QuestionOptionDto>>.SuccessResponse(dtos);
    }

    public async Task<ApiResponse<QuestionOptionDto>> AddQuestionOptionAsync(int questionId, CreateQuestionOptionDto dto, string createdBy)
    {
        var questionExists = await _context.Questions.AnyAsync(x => x.Id == questionId);
        if (!questionExists)
        {
            return ApiResponse<QuestionOptionDto>.FailureResponse("Question not found");
        }

        var entity = new QuestionOption
        {
            QuestionId = questionId,
            TextEn = dto.TextEn,
            TextAr = dto.TextAr,
            IsCorrect = dto.IsCorrect,
            Order = dto.Order,
            AttachmentPath = dto.AttachmentPath,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.QuestionOptions.Add(entity);
        await _context.SaveChangesAsync();

        var resultDto = new QuestionOptionDto
        {
            Id = entity.Id,
            QuestionId = entity.QuestionId,
            TextEn = entity.TextEn,
            TextAr = entity.TextAr,
            IsCorrect = entity.IsCorrect,
            Order = entity.Order,
            AttachmentPath = entity.AttachmentPath,
            CreatedDate = entity.CreatedDate
        };

        return ApiResponse<QuestionOptionDto>.SuccessResponse(resultDto, "Option added successfully");
    }

    public async Task<ApiResponse<QuestionOptionDto>> UpdateQuestionOptionAsync(int optionId, UpdateQuestionOptionDto dto, string updatedBy)
    {
        var entity = await _context.QuestionOptions.FindAsync(optionId);

        if (entity == null)
        {
            return ApiResponse<QuestionOptionDto>.FailureResponse("Option not found");
        }

        entity.TextEn = dto.TextEn;
        entity.TextAr = dto.TextAr;
        entity.IsCorrect = dto.IsCorrect;
        entity.Order = dto.Order;
        entity.AttachmentPath = dto.AttachmentPath;
        entity.UpdatedDate = DateTime.UtcNow;
        entity.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();

        var resultDto = new QuestionOptionDto
        {
            Id = entity.Id,
            QuestionId = entity.QuestionId,
            TextEn = entity.TextEn,
            TextAr = entity.TextAr,
            IsCorrect = entity.IsCorrect,
            Order = entity.Order,
            AttachmentPath = entity.AttachmentPath,
            CreatedDate = entity.CreatedDate
        };

        return ApiResponse<QuestionOptionDto>.SuccessResponse(resultDto, "Option updated successfully");
    }

    public async Task<ApiResponse<bool>> DeleteQuestionOptionAsync(int optionId)
    {
        var entity = await _context.QuestionOptions
       .IgnoreQueryFilters()
  .FirstOrDefaultAsync(x => x.Id == optionId);

        if (entity == null)
        {
            return ApiResponse<bool>.FailureResponse("Option not found");
        }

        _context.QuestionOptions.Remove(entity);
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Option deleted successfully");
    }

    public async Task<ApiResponse<List<QuestionOptionDto>>> BulkUpdateQuestionOptionsAsync(BulkUpdateQuestionOptionsDto dto, string updatedBy)
    {
        var questionExists = await _context.Questions.AnyAsync(x => x.Id == dto.QuestionId);
        if (!questionExists)
        {
            return ApiResponse<List<QuestionOptionDto>>.FailureResponse("Question not found");
        }

        // Get existing options
        var existingOptions = await _context.QuestionOptions
         .Where(x => x.QuestionId == dto.QuestionId)
 .ToListAsync();

        foreach (var optionDto in dto.Options)
        {
            var existingOption = existingOptions.FirstOrDefault(x => x.Id == optionDto.Id);

            if (existingOption != null)
            {
                // Update existing
                existingOption.TextEn = optionDto.TextEn;
                existingOption.TextAr = optionDto.TextAr;
                existingOption.IsCorrect = optionDto.IsCorrect;
                existingOption.Order = optionDto.Order;
                existingOption.AttachmentPath = optionDto.AttachmentPath;
                existingOption.UpdatedDate = DateTime.UtcNow;
                existingOption.UpdatedBy = updatedBy;
            }
            else if (optionDto.Id == 0)
            {
                // Add new option
                _context.QuestionOptions.Add(new QuestionOption
                {
                    QuestionId = dto.QuestionId,
                    TextEn = optionDto.TextEn,
                    TextAr = optionDto.TextAr,
                    IsCorrect = optionDto.IsCorrect,
                    Order = optionDto.Order,
                    AttachmentPath = optionDto.AttachmentPath,
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = updatedBy
                });
            }
        }

        await _context.SaveChangesAsync();

        return await GetQuestionOptionsAsync(dto.QuestionId);
    }

    #endregion

    #region Question Attachments

    public async Task<ApiResponse<List<QuestionAttachmentDto>>> GetQuestionAttachmentsAsync(int questionId)
    {
        var questionExists = await _context.Questions.AnyAsync(x => x.Id == questionId);
        if (!questionExists)
        {
            return ApiResponse<List<QuestionAttachmentDto>>.FailureResponse("Question not found");
        }

        var attachments = await _context.QuestionAttachments
                   .Where(x => x.QuestionId == questionId)
           .OrderByDescending(x => x.IsPrimary)
                 .ThenByDescending(x => x.CreatedDate)
             .ToListAsync();

        return ApiResponse<List<QuestionAttachmentDto>>.SuccessResponse(attachments.Adapt<List<QuestionAttachmentDto>>());
    }

    public async Task<ApiResponse<QuestionAttachmentDto>> AddQuestionAttachmentAsync(CreateQuestionAttachmentDto dto, string createdBy)
    {
        var questionExists = await _context.Questions.AnyAsync(x => x.Id == dto.QuestionId);
        if (!questionExists)
        {
            return ApiResponse<QuestionAttachmentDto>.FailureResponse("Question not found");
        }

        // If this is marked as primary, unset other primary attachments
        if (dto.IsPrimary)
        {
            var existingPrimary = await _context.QuestionAttachments
                       .Where(x => x.QuestionId == dto.QuestionId && x.IsPrimary)
                 .ToListAsync();

            foreach (var attachment in existingPrimary)
            {
                attachment.IsPrimary = false;
            }
        }

        var entity = new QuestionAttachment
        {
            QuestionId = dto.QuestionId,
            FileName = dto.FileName,
            FilePath = dto.FilePath,
            FileType = dto.FileType,
            FileSize = dto.FileSize,
            IsPrimary = dto.IsPrimary,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.QuestionAttachments.Add(entity);
        await _context.SaveChangesAsync();

        return ApiResponse<QuestionAttachmentDto>.SuccessResponse(
   entity.Adapt<QuestionAttachmentDto>(),
         "Attachment added successfully");
    }

    public async Task<ApiResponse<QuestionAttachmentDto>> UpdateQuestionAttachmentAsync(int attachmentId, UpdateQuestionAttachmentDto dto, string updatedBy)
    {
        var entity = await _context.QuestionAttachments.FindAsync(attachmentId);

        if (entity == null)
        {
            return ApiResponse<QuestionAttachmentDto>.FailureResponse("Attachment not found");
        }

        // If this is marked as primary, unset other primary attachments
        if (dto.IsPrimary && !entity.IsPrimary)
        {
            var existingPrimary = await _context.QuestionAttachments
                .Where(x => x.QuestionId == entity.QuestionId && x.IsPrimary && x.Id != attachmentId)
     .ToListAsync();

            foreach (var attachment in existingPrimary)
            {
                attachment.IsPrimary = false;
            }
        }

        entity.FileName = dto.FileName;
        entity.FilePath = dto.FilePath;
        entity.FileType = dto.FileType;
        entity.FileSize = dto.FileSize;
        entity.IsPrimary = dto.IsPrimary;
        entity.UpdatedDate = DateTime.UtcNow;
        entity.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();

        return ApiResponse<QuestionAttachmentDto>.SuccessResponse(
            entity.Adapt<QuestionAttachmentDto>(),
         "Attachment updated successfully");
    }

    public async Task<ApiResponse<bool>> DeleteQuestionAttachmentAsync(int attachmentId)
    {
        var entity = await _context.QuestionAttachments
        .IgnoreQueryFilters()
 .FirstOrDefaultAsync(x => x.Id == attachmentId);

        if (entity == null)
        {
            return ApiResponse<bool>.FailureResponse("Attachment not found");
        }

        _context.QuestionAttachments.Remove(entity);
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Attachment deleted successfully");
    }

    public async Task<ApiResponse<bool>> SetPrimaryAttachmentAsync(int attachmentId, string updatedBy)
    {
        var entity = await _context.QuestionAttachments.FindAsync(attachmentId);

        if (entity == null)
        {
            return ApiResponse<bool>.FailureResponse("Attachment not found");
        }

        // Unset other primary attachments for this question
        var existingPrimary = await _context.QuestionAttachments
       .Where(x => x.QuestionId == entity.QuestionId && x.IsPrimary && x.Id != attachmentId)
            .ToListAsync();

        foreach (var attachment in existingPrimary)
        {
            attachment.IsPrimary = false;
            attachment.UpdatedDate = DateTime.UtcNow;
            attachment.UpdatedBy = updatedBy;
        }

        entity.IsPrimary = true;
        entity.UpdatedDate = DateTime.UtcNow;
        entity.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Primary attachment set successfully");
    }

    #endregion
}
