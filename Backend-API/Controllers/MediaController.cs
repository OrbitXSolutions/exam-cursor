using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Media;
using Smart_Core.Application.Interfaces;

namespace Smart_Core.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MediaController : ControllerBase
{
    private readonly IMediaStorageService _mediaStorageService;
    private readonly ICurrentUserService _currentUserService;

    public MediaController(
        IMediaStorageService mediaStorageService,
     ICurrentUserService currentUserService)
    {
        _mediaStorageService = mediaStorageService;
        _currentUserService = currentUserService;
    }

    /// <summary>
 /// Upload a single file (image or PDF)
    /// </summary>
    /// <param name="file">The file to upload</param>
    /// <param name="folder">Optional folder/category (e.g., "profiles", "documents")</param>
    [HttpPost("upload")]
    [ProducesResponseType(typeof(MediaUploadResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(MediaUploadResultDto), StatusCodes.Status400BadRequest)]
    [RequestSizeLimit(50 * 1024 * 1024)] // 50 MB max
    public async Task<IActionResult> Upload(IFormFile file, [FromQuery] string? folder = null)
    {
        var result = await _mediaStorageService.UploadAsync(file, folder, _currentUserService.UserId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Upload multiple files
    /// </summary>
    /// <param name="files">The files to upload</param>
    /// <param name="folder">Optional folder/category</param>
    [HttpPost("upload-multiple")]
    [ProducesResponseType(typeof(List<MediaUploadResultDto>), StatusCodes.Status200OK)]
    [RequestSizeLimit(100 * 1024 * 1024)] // 100 MB max for multiple files
    public async Task<IActionResult> UploadMultiple(List<IFormFile> files, [FromQuery] string? folder = null)
    {
        var results = await _mediaStorageService.UploadManyAsync(files, folder, _currentUserService.UserId);
     return Ok(results);
    }

    /// <summary>
    /// Get file metadata by ID
    /// </summary>
    [HttpGet("{id:guid}")]
 [ProducesResponseType(typeof(ApiResponse<MediaFileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<MediaFileDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediaStorageService.GetByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Download/stream file by ID
    /// </summary>
    [HttpGet("{id:guid}/download")]
    [AllowAnonymous] // Allow anonymous download if you want public file access
  [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Download(Guid id)
    {
        var (stream, contentType, fileName) = await _mediaStorageService.GetFileStreamAsync(id);
        
        if (stream == null)
        {
  return NotFound(new { message = "File not found." });
        }

        return File(stream, contentType ?? "application/octet-stream", fileName);
    }

    /// <summary>
    /// View file inline (for images/PDFs in browser)
    /// </summary>
    [HttpGet("{id:guid}/view")]
    [AllowAnonymous]
[ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> View(Guid id)
    {
        var (stream, contentType, _) = await _mediaStorageService.GetFileStreamAsync(id);
    
        if (stream == null)
        {
            return NotFound(new { message = "File not found." });
        }

        return File(stream, contentType ?? "application/octet-stream");
    }

    /// <summary>
    /// Delete file by ID
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(MediaDeleteResultDto), StatusCodes.Status200OK)]
 [ProducesResponseType(typeof(MediaDeleteResultDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _mediaStorageService.DeleteAsync(id, _currentUserService.UserId);
    return result.Success ? Ok(result) : BadRequest(result);
    }

/// <summary>
    /// Get all files with optional filtering and pagination
    /// </summary>
    /// <param name="folder">Filter by folder</param>
    /// <param name="mediaType">Filter by type: "Image" or "Pdf"</param>
    /// <param name="pageNumber">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 20)</param>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<MediaFileDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFiles(
      [FromQuery] string? folder = null,
        [FromQuery] string? mediaType = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _mediaStorageService.GetFilesAsync(folder, mediaType, pageNumber, pageSize);
        return Ok(result);
    }
}
