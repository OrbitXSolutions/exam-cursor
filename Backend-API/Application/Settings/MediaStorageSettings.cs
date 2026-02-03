namespace Smart_Core.Application.Settings;

public class MediaStorageSettings
{
    /// <summary>
  /// Storage provider: "Local" or "S3"
    /// </summary>
    public string Provider { get; set; } = "Local";
    
    /// <summary>
    /// Maximum file size in MB
    /// </summary>
    public int MaxFileSizeMB { get; set; } = 10;
    
    /// <summary>
    /// Allowed image extensions
    /// </summary>
  public string[] AllowedImageExtensions { get; set; } = { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp" };
    
    /// <summary>
    /// Allowed document extensions
    /// </summary>
    public string[] AllowedPdfExtensions { get; set; } = { ".pdf" };
    
 /// <summary>
    /// Local storage settings
    /// </summary>
    public LocalStorageSettings Local { get; set; } = new();
    
 /// <summary>
    /// S3 storage settings
    /// </summary>
    public S3StorageSettings S3 { get; set; } = new();
}

public class LocalStorageSettings
{
    /// <summary>
    /// Base path for storing files (relative to app root or absolute path)
    /// </summary>
    public string BasePath { get; set; } = "MediaStorage";
    
  /// <summary>
    /// Base URL for serving files (e.g., https://yourdomain.com/media)
    /// </summary>
    public string BaseUrl { get; set; } = "/media";
}

public class S3StorageSettings
{
    /// <summary>
  /// S3 service URL (e.g., https://s3.amazonaws.com, https://nyc3.digitaloceanspaces.com, http://localhost:9000 for MinIO)
    /// </summary>
public string ServiceUrl { get; set; } = string.Empty;
    
  /// <summary>
    /// Access key ID
    /// </summary>
    public string AccessKey { get; set; } = string.Empty;
    
    /// <summary>
    /// Secret access key
    /// </summary>
    public string SecretKey { get; set; } = string.Empty;
    
    /// <summary>
    /// Bucket name
    /// </summary>
    public string BucketName { get; set; } = string.Empty;
    
    /// <summary>
    /// AWS region (e.g., us-east-1). Leave empty for non-AWS S3 providers
    /// </summary>
    public string Region { get; set; } = "us-east-1";
    
    /// <summary>
    /// Use path-style URLs (required for MinIO and some S3-compatible services)
    /// </summary>
    public bool UsePathStyle { get; set; } = false;
    
  /// <summary>
    /// Optional prefix/folder for all uploads
    /// </summary>
    public string? DefaultPrefix { get; set; }
    
    /// <summary>
    /// Public base URL for accessing files (if bucket is public)
    /// </summary>
    public string? PublicUrl { get; set; }
}
