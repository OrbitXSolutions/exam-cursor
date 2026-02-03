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
}
