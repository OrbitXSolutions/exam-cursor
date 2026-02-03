namespace Smart_Core.Application.DTOs.Media;

public class MediaUploadDto
{
    /// <summary>
    /// Optional folder/category to organize files (e.g., "profiles", "documents")
    /// </summary>
    public string? Folder { get; set; }
}

public class MediaFileDto
{
    public Guid Id { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string Extension { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeInBytes { get; set; }
    public string SizeFormatted { get; set; } = string.Empty;
    public string MediaType { get; set; } = string.Empty;
    public string StorageProvider { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string? Folder { get; set; }
    public DateTime CreatedDate { get; set; }
}

public class MediaUploadResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public MediaFileDto? File { get; set; }
    public List<string> Errors { get; set; } = new();

    public static MediaUploadResultDto SuccessResult(MediaFileDto file, string message = "File uploaded successfully")
    {
   return new MediaUploadResultDto
        {
            Success = true,
      Message = message,
            File = file
    };
    }

    public static MediaUploadResultDto FailureResult(string message, List<string>? errors = null)
    {
     return new MediaUploadResultDto
    {
  Success = false,
         Message = message,
     Errors = errors ?? new List<string>()
     };
    }
}

public class MediaDeleteResultDto
{
    public bool Success { get; set; }
public string Message { get; set; } = string.Empty;
}
