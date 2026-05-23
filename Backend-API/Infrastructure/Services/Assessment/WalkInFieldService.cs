using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Assessment;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.Interfaces.Assessment;
using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Assessment;

public class WalkInFieldService : IWalkInFieldService
{
    private readonly ApplicationDbContext _context;

    public WalkInFieldService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<WalkInFieldDto>>> GetFieldsAsync(int examId)
    {
        var fields = await _context.WalkInRegistrationFields
            .Where(f => f.ExamId == examId)
            .OrderBy(f => f.DisplayOrder)
            .Select(f => new WalkInFieldDto
            {
                Id = f.Id,
                ExamId = f.ExamId,
                LabelEn = f.LabelEn,
                LabelAr = f.LabelAr,
                FieldType = (WalkInFieldTypeDto)f.FieldType,
                IsRequired = f.IsRequired,
                DisplayOrder = f.DisplayOrder
            })
            .ToListAsync();

        return ApiResponse<List<WalkInFieldDto>>.SuccessResponse(fields);
    }

    public async Task<ApiResponse<WalkInFieldDto>> SaveFieldAsync(int examId, int? fieldId, SaveWalkInFieldDto dto, string userId)
    {
        WalkInRegistrationField entity;

        if (fieldId.HasValue)
        {
            var existing = await _context.WalkInRegistrationFields
                .FirstOrDefaultAsync(f => f.Id == fieldId.Value && f.ExamId == examId);

            if (existing == null)
                return ApiResponse<WalkInFieldDto>.FailureResponse($"Field {fieldId} not found for exam {examId}");

            existing.LabelEn = dto.LabelEn.Trim();
            existing.LabelAr = dto.LabelAr.Trim();
            existing.FieldType = (WalkInFieldType)dto.FieldType;
            existing.IsRequired = dto.IsRequired;
            existing.DisplayOrder = dto.DisplayOrder;
            existing.UpdatedDate = UaeTimeHelper.NowUae;
            existing.UpdatedBy = userId;
            entity = existing;
        }
        else
        {
            var fieldCount = await _context.WalkInRegistrationFields.CountAsync(f => f.ExamId == examId);
            if (fieldCount >= 5)
                return ApiResponse<WalkInFieldDto>.FailureResponse("You can add up to 5 registration fields per exam.");

            entity = new WalkInRegistrationField
            {
                ExamId = examId,
                LabelEn = dto.LabelEn.Trim(),
                LabelAr = dto.LabelAr.Trim(),
                FieldType = (WalkInFieldType)dto.FieldType,
                IsRequired = dto.IsRequired,
                DisplayOrder = dto.DisplayOrder,
                CreatedDate = UaeTimeHelper.NowUae,
                CreatedBy = userId
            };
            _context.WalkInRegistrationFields.Add(entity);
        }

        await _context.SaveChangesAsync();

        return ApiResponse<WalkInFieldDto>.SuccessResponse(new WalkInFieldDto
        {
            Id = entity.Id,
            ExamId = entity.ExamId,
            LabelEn = entity.LabelEn,
            LabelAr = entity.LabelAr,
            FieldType = (WalkInFieldTypeDto)entity.FieldType,
            IsRequired = entity.IsRequired,
            DisplayOrder = entity.DisplayOrder
        }, fieldId.HasValue ? "Field updated successfully" : "Field created successfully");
    }

    public async Task<ApiResponse<bool>> DeleteFieldAsync(int examId, int fieldId, string userId)
    {
        var entity = await _context.WalkInRegistrationFields
            .FirstOrDefaultAsync(f => f.Id == fieldId && f.ExamId == examId);

        if (entity == null)
            return ApiResponse<bool>.FailureResponse("Field not found");

        entity.IsDeleted = true;
        entity.DeletedBy = userId;
        entity.UpdatedDate = UaeTimeHelper.NowUae;

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Field deleted successfully");
    }

    public async Task<ApiResponse<bool>> ReorderFieldsAsync(int examId, List<ReorderWalkInFieldDto> orders, string userId)
    {
        var fieldIds = orders.Select(o => o.FieldId).ToList();

        var fields = await _context.WalkInRegistrationFields
            .Where(f => f.ExamId == examId && fieldIds.Contains(f.Id))
            .ToListAsync();

        foreach (var field in fields)
        {
            var order = orders.FirstOrDefault(o => o.FieldId == field.Id);
            if (order != null)
            {
                field.DisplayOrder = order.DisplayOrder;
                field.UpdatedDate = UaeTimeHelper.NowUae;
                field.UpdatedBy = userId;
            }
        }

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Fields reordered successfully");
    }

    public async Task<ApiResponse<List<WalkInAnswerDto>>> GetAnswersByExamAsync(int examId)
    {
        // Load field definitions including soft-deleted (answers outlive fields)
        var fields = await _context.WalkInRegistrationFields
            .IgnoreQueryFilters()
            .Where(f => f.ExamId == examId)
            .ToListAsync();

        // Build a dictionary for O(1) label lookup during projection
        var fieldMap = fields.ToDictionary(f => f.Id);

        // Load answers joined with user info
        var rawAnswers = await _context.WalkInRegistrationAnswers
            .Where(a => a.ExamId == examId)
            .Join(
                _context.Users,
                a => a.CandidateId,
                u => u.Id,
                (a, u) => new
                {
                    a.CandidateId,
                    CandidateName = u.FullName ?? u.DisplayName,
                    CandidateEmail = u.Email,
                    a.FieldId,
                    a.Value
                })
            .ToListAsync();

        var result = rawAnswers
            .GroupBy(x => x.CandidateId)
            .Select(g => new WalkInAnswerDto
            {
                CandidateId = g.Key,
                CandidateName = g.First().CandidateName,
                CandidateEmail = g.First().CandidateEmail,
                Answers = g.Select(x => new WalkInAnswerValueDto
                {
                    FieldId = x.FieldId,
                    LabelEn = fieldMap.TryGetValue(x.FieldId, out var f) ? f.LabelEn : "(deleted field)",
                    LabelAr = fieldMap.TryGetValue(x.FieldId, out var fa) ? fa.LabelAr : "(حقل محذوف)",
                    Value = x.Value
                }).ToList()
            })
            .ToList();

        return ApiResponse<List<WalkInAnswerDto>>.SuccessResponse(result);
    }
}
