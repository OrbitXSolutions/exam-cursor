namespace Smart_Core.Application.Interfaces;

/// <summary>
/// Interface for storage provider implementations (Local, S3)
/// </summary>
public interface IStorageProvider
{
    /// <summary>
    /// Upload file to storage
    /// </summary>
    /// <param name="stream">File stream</param>
    /// <param name="fileName">File name to save</param>
    /// <param name="contentType">MIME type</param>
    /// <param name="folder">Optional folder/prefix</param>
    /// <returns>Tuple of (path/key, url)</returns>
    Task<(string Path, string? Url)> UploadAsync(Stream stream, string fileName, string contentType, string? folder = null);
    
    /// <summary>
    /// Get file stream from storage
    /// </summary>
    /// <param name="path">File path or S3 key</param>
  /// <returns>File stream or null if not found</returns>
    Task<Stream?> GetAsync(string path);
    
/// <summary>
    /// Delete file from storage
    /// </summary>
    /// <param name="path">File path or S3 key</param>
    /// <returns>True if deleted successfully</returns>
    Task<bool> DeleteAsync(string path);
  
    /// <summary>
    /// Check if file exists
    /// </summary>
    Task<bool> ExistsAsync(string path);
}
