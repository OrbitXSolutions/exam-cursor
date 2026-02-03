using Mapster;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Media;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Settings;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services;

public class MediaStorageService : IMediaStorageService
{
    private readonly IStorageProvider _storageProvider;
  private readonly ApplicationDbContext _dbContext;
  private readonly MediaStorageSettings _settings;
    private readonly ILogger<MediaStorageService> _logger;

    public MediaStorageService(
        IStorageProvider storageProvider,
  ApplicationDbContext dbContext,
   IOptions<MediaStorageSettings> settings,
        ILogger<MediaStorageService> logger)
    {
        _storageProvider = storageProvider;
   _dbContext = dbContext;
        _settings = settings.Value;
    _logger = logger;
    }

    public async Task<MediaUploadResultDto> UploadAsync(
        IFormFile file, 
     string? folder = null, 
  string? uploadedBy = null)
    {
        try
     {
      // Validate file
            var validationResult = ValidateFile(file);
     if (!validationResult.IsValid)
     {
        return MediaUploadResultDto.FailureResult(validationResult.ErrorMessage, validationResult.Errors);
}

          // Determine media type
    var mediaType = GetMediaType(file);
            
      // Generate unique file name
  var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var storedFileName = $"{Guid.NewGuid()}{extension}";

   // Upload to storage provider
         await using var stream = file.OpenReadStream();
      var (path, url) = await _storageProvider.UploadAsync(stream, storedFileName, file.ContentType, folder);

            // Create database record
    var mediaFile = new MediaFile
 {
     OriginalFileName = file.FileName,
       StoredFileName = storedFileName,
      Extension = extension,
    ContentType = file.ContentType,
     SizeInBytes = file.Length,
    MediaType = mediaType,
StorageProvider = GetCurrentStorageProvider(),
      Path = path,
        Url = url,
    BucketName = _settings.Provider.Equals("S3", StringComparison.OrdinalIgnoreCase) 
         ? _settings.S3.BucketName 
   : null,
            Folder = folder,
      CreatedBy = uploadedBy
         };

            _dbContext.Set<MediaFile>().Add(mediaFile);
    await _dbContext.SaveChangesAsync();

_logger.LogInformation("File uploaded successfully: {Id} - {OriginalName}", mediaFile.Id, file.FileName);

     return MediaUploadResultDto.SuccessResult(MapToDto(mediaFile));
        }
        catch (Exception ex)
  {
 _logger.LogError(ex, "Failed to upload file: {FileName}", file.FileName);
          return MediaUploadResultDto.FailureResult("An error occurred while uploading the file.", 
   new List<string> { ex.Message });
   }
    }

    public async Task<List<MediaUploadResultDto>> UploadManyAsync(
        IEnumerable<IFormFile> files, 
        string? folder = null, 
        string? uploadedBy = null)
    {
        var results = new List<MediaUploadResultDto>();
        
    foreach (var file in files)
        {
  var result = await UploadAsync(file, folder, uploadedBy);
            results.Add(result);
   }
     
     return results;
    }

    public async Task<ApiResponse<MediaFileDto>> GetByIdAsync(Guid id)
    {
       var mediaFile = await _dbContext.Set<MediaFile>()
  .FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);

        if (mediaFile == null)
     {
          return ApiResponse<MediaFileDto>.FailureResponse("File not found.");
        }

        return ApiResponse<MediaFileDto>.SuccessResponse(MapToDto(mediaFile));
 }

    public async Task<(Stream? Stream, string? ContentType, string? FileName)> GetFileStreamAsync(Guid id)
    {
        var mediaFile = await _dbContext.Set<MediaFile>()
            .FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);

        if (mediaFile == null)
        {
     return (null, null, null);
      }

   var stream = await _storageProvider.GetAsync(mediaFile.Path);
        return (stream, mediaFile.ContentType, mediaFile.OriginalFileName);
    }

    public async Task<MediaDeleteResultDto> DeleteAsync(Guid id, string? deletedBy = null)
    {
  try
        {
 var mediaFile = await _dbContext.Set<MediaFile>()
        .FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);

  if (mediaFile == null)
        {
        return new MediaDeleteResultDto
          {
      Success = false,
     Message = "File not found."
            };
         }

         // Delete from storage
  var deleted = await _storageProvider.DeleteAsync(mediaFile.Path);
      
   if (!deleted)
      {
 _logger.LogWarning("File not found in storage during deletion: {Path}", mediaFile.Path);
           }

// Soft delete in database
  mediaFile.IsDeleted = true;
          mediaFile.DeletedBy = deletedBy;
            mediaFile.UpdatedDate = DateTime.UtcNow;
    
   await _dbContext.SaveChangesAsync();

    _logger.LogInformation("File deleted: {Id} - {OriginalName}", id, mediaFile.OriginalFileName);

  return new MediaDeleteResultDto
            {
 Success = true,
 Message = "File deleted successfully."
  };
  }
        catch (Exception ex)
   {
         _logger.LogError(ex, "Failed to delete file: {Id}", id);
            return new MediaDeleteResultDto
            {
     Success = false,
          Message = "An error occurred while deleting the file."
      };
    }
    }

    public async Task<ApiResponse<PaginatedResponse<MediaFileDto>>> GetFilesAsync(
        string? folder = null, 
string? mediaType = null, 
        int pageNumber = 1, 
        int pageSize = 20)
    {
   var query = _dbContext.Set<MediaFile>()
            .Where(m => !m.IsDeleted)
  .AsQueryable();

 if (!string.IsNullOrWhiteSpace(folder))
   {
    query = query.Where(m => m.Folder == folder);
        }

     if (!string.IsNullOrWhiteSpace(mediaType) && Enum.TryParse<MediaType>(mediaType, true, out var type))
      {
  query = query.Where(m => m.MediaType == type);
  }

 var totalCount = await query.CountAsync();

  var files = await query
     .OrderByDescending(m => m.CreatedDate)
     .Skip((pageNumber - 1) * pageSize)
        .Take(pageSize)
     .ToListAsync();

  var fileDtos = files.Select(MapToDto).ToList();

return ApiResponse<PaginatedResponse<MediaFileDto>>.SuccessResponse(new PaginatedResponse<MediaFileDto>
        {
   Items = fileDtos,
  PageNumber = pageNumber,
       PageSize = pageSize,
      TotalCount = totalCount
        });
    }

    #region Private Methods

    private (bool IsValid, string ErrorMessage, List<string> Errors) ValidateFile(IFormFile file)
    {
     var errors = new List<string>();

        if (file == null || file.Length == 0)
   {
          return (false, "No file provided.", new List<string> { "File is empty or null." });
   }

 // Validate file size
   var maxSizeBytes = _settings.MaxFileSizeMB * 1024 * 1024;
      if (file.Length > maxSizeBytes)
     {
    errors.Add($"File size exceeds the maximum allowed size of {_settings.MaxFileSizeMB} MB.");
        }

        // Validate extension
    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
     var allAllowedExtensions = _settings.AllowedImageExtensions
         .Concat(_settings.AllowedPdfExtensions)
      .ToArray();

  if (!allAllowedExtensions.Contains(extension))
        {
     errors.Add($"File type '{extension}' is not allowed. Allowed types: {string.Join(", ", allAllowedExtensions)}");
        }

 // Validate content type
  var allowedContentTypes = new[]
        {
       "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/bmp",
     "application/pdf"
 };

     if (!allowedContentTypes.Contains(file.ContentType.ToLowerInvariant()))
        {
    errors.Add($"Content type '{file.ContentType}' is not allowed.");
        }

        if (errors.Any())
        {
 return (false, "File validation failed.", errors);
        }

 return (true, string.Empty, errors);
    }

    private MediaType GetMediaType(IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
  
        if (_settings.AllowedPdfExtensions.Contains(extension))
 {
      return MediaType.Pdf;
        }
        
      return MediaType.Image;
  }

    private StorageProvider GetCurrentStorageProvider()
    {
     return _settings.Provider.Equals("S3", StringComparison.OrdinalIgnoreCase)
          ? StorageProvider.S3
            : StorageProvider.Local;
    }

    private MediaFileDto MapToDto(MediaFile mediaFile)
{
        return new MediaFileDto
   {
            Id = mediaFile.Id,
    OriginalFileName = mediaFile.OriginalFileName,
StoredFileName = mediaFile.StoredFileName,
      Extension = mediaFile.Extension,
     ContentType = mediaFile.ContentType,
      SizeInBytes = mediaFile.SizeInBytes,
     SizeFormatted = FormatFileSize(mediaFile.SizeInBytes),
   MediaType = mediaFile.MediaType.ToString(),
  StorageProvider = mediaFile.StorageProvider.ToString(),
    Path = mediaFile.Path,
   Url = mediaFile.Url,
  Folder = mediaFile.Folder,
  CreatedDate = mediaFile.CreatedDate
      };
    }

    private string FormatFileSize(long bytes)
    {
   string[] sizes = { "B", "KB", "MB", "GB" };
      double len = bytes;
        int order = 0;
        
     while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
      len /= 1024;
        }
        
   return $"{len:0.##} {sizes[order]}";
    }

    #endregion
}
