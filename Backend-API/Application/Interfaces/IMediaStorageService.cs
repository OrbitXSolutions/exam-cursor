using Microsoft.AspNetCore.Http;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Media;

namespace Smart_Core.Application.Interfaces;

public interface IMediaStorageService
{
    /// <summary>
    /// Upload a file to storage
    /// </summary>
    /// <param name="file">The file to upload</param>
    /// <param name="folder">Optional folder/category</param>
    /// <param name="uploadedBy">User ID who uploaded the file</param>
    /// <returns>Upload result with file details</returns>
    Task<MediaUploadResultDto> UploadAsync(IFormFile file, string? folder = null, string? uploadedBy = null);
    
    /// <summary>
    /// Upload multiple files to storage
    /// </summary>
 Task<List<MediaUploadResultDto>> UploadManyAsync(IEnumerable<IFormFile> files, string? folder = null, string? uploadedBy = null);
    
    /// <summary>
    /// Get file by ID
    /// </summary>
    Task<ApiResponse<MediaFileDto>> GetByIdAsync(Guid id);
    
    /// <summary>
  /// Get file content/stream by ID
    /// </summary>
    Task<(Stream? Stream, string? ContentType, string? FileName)> GetFileStreamAsync(Guid id);
    
    /// <summary>
    /// Delete a file by ID
    /// </summary>
    Task<MediaDeleteResultDto> DeleteAsync(Guid id, string? deletedBy = null);
    
    /// <summary>
    /// Get all files with optional filtering
    /// </summary>
    Task<ApiResponse<PaginatedResponse<MediaFileDto>>> GetFilesAsync(
        string? folder = null, 
        string? mediaType = null, 
        int pageNumber = 1, 
        int pageSize = 20);
}
