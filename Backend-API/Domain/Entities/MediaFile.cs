using Smart_Core.Domain.Common;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities;

public class MediaFile : BaseEntity
{
public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>
    /// Original file name uploaded by user
    /// </summary>
    public string OriginalFileName { get; set; } = string.Empty;
    
    /// <summary>
    /// Stored file name (usually a GUID + extension)
    /// </summary>
    public string StoredFileName { get; set; } = string.Empty;
    
    /// <summary>
    /// File extension (e.g., .jpg, .pdf)
    /// </summary>
    public string Extension { get; set; } = string.Empty;
    
  /// <summary>
    /// MIME type (e.g., image/jpeg, application/pdf)
  /// </summary>
    public string ContentType { get; set; } = string.Empty;
    
    /// <summary>
    /// File size in bytes
    /// </summary>
    public long SizeInBytes { get; set; }
    
    /// <summary>
 /// Type of media (Image or PDF)
    /// </summary>
    public MediaType MediaType { get; set; }
    
    /// <summary>
    /// Storage provider used (Local or S3)
    /// </summary>
 public StorageProvider StorageProvider { get; set; }
    
    /// <summary>
    /// Relative path for local storage or S3 object key
    /// </summary>
    public string Path { get; set; } = string.Empty;
    
    /// <summary>
    /// Full URL to access the file (for S3 or served local files)
    /// </summary>
    public string? Url { get; set; }
    
    /// <summary>
    /// S3 bucket name (null for local storage)
    /// </summary>
    public string? BucketName { get; set; }
    
    /// <summary>
    /// Optional folder/category for organizing files
    /// </summary>
    public string? Folder { get; set; }
}
