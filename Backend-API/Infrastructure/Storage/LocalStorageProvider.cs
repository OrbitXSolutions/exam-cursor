using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Settings;

namespace Smart_Core.Infrastructure.Storage;

/// <summary>
/// Local file system storage provider
/// </summary>
public class LocalStorageProvider : IStorageProvider
{
    private readonly LocalStorageSettings _settings;
    private readonly ILogger<LocalStorageProvider> _logger;
    private readonly string _basePath;

    public LocalStorageProvider(
        IOptions<MediaStorageSettings> settings,
    ILogger<LocalStorageProvider> logger,
        IWebHostEnvironment environment)
    {
        _settings = settings.Value.Local;
        _logger = logger;
        
        // Resolve base path - if relative, combine with content root
        _basePath = Path.IsPathRooted(_settings.BasePath) 
            ? _settings.BasePath 
            : Path.Combine(environment.ContentRootPath, _settings.BasePath);
   
        // Ensure base directory exists
      EnsureDirectoryExists(_basePath);
    }

    public async Task<(string Path, string? Url)> UploadAsync(
Stream stream, 
        string fileName, 
        string contentType, 
 string? folder = null)
    {
    try
        {
     // Build the directory path
         var directoryPath = BuildDirectoryPath(folder);
            EnsureDirectoryExists(directoryPath);

   // Full file path
 var filePath = Path.Combine(directoryPath, fileName);
     
            // Write file to disk
     await using var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write);
         await stream.CopyToAsync(fileStream);

         // Calculate relative path for storage
      var relativePath = Path.GetRelativePath(_basePath, filePath).Replace("\\", "/");
            
    // Build URL
 var url = BuildUrl(relativePath);

            _logger.LogInformation("File uploaded to local storage: {Path}", relativePath);
   
      return (relativePath, url);
        }
catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload file to local storage: {FileName}", fileName);
       throw;
  }
    }

    public async Task<Stream?> GetAsync(string path)
    {
        try
   {
         var fullPath = Path.Combine(_basePath, path.Replace("/", Path.DirectorySeparatorChar.ToString()));
     
      if (!File.Exists(fullPath))
            {
        _logger.LogWarning("File not found in local storage: {Path}", path);
     return null;
        }

            // Return a memory stream with the file content
    var memoryStream = new MemoryStream();
       await using var fileStream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);
 await fileStream.CopyToAsync(memoryStream);
          memoryStream.Position = 0;
            
     return memoryStream;
        }
        catch (Exception ex)
        {
   _logger.LogError(ex, "Failed to read file from local storage: {Path}", path);
    return null;
        }
    }

    public Task<bool> DeleteAsync(string path)
    {
     try
        {
      var fullPath = Path.Combine(_basePath, path.Replace("/", Path.DirectorySeparatorChar.ToString()));
            
            if (File.Exists(fullPath))
    {
  File.Delete(fullPath);
    _logger.LogInformation("File deleted from local storage: {Path}", path);
     return Task.FromResult(true);
   }

 _logger.LogWarning("File not found for deletion: {Path}", path);
            return Task.FromResult(false);
        }
        catch (Exception ex)
   {
          _logger.LogError(ex, "Failed to delete file from local storage: {Path}", path);
         return Task.FromResult(false);
        }
    }

    public Task<bool> ExistsAsync(string path)
    {
  var fullPath = Path.Combine(_basePath, path.Replace("/", Path.DirectorySeparatorChar.ToString()));
        return Task.FromResult(File.Exists(fullPath));
 }

    private string BuildDirectoryPath(string? folder)
    {
    // Organize by year/month for better file management
  var yearMonth = DateTime.UtcNow.ToString("yyyy/MM");
  
        if (!string.IsNullOrWhiteSpace(folder))
        {
return Path.Combine(_basePath, folder, yearMonth);
      }
   
        return Path.Combine(_basePath, yearMonth);
    }

    private string BuildUrl(string relativePath)
    {
    var baseUrl = _settings.BaseUrl.TrimEnd('/');
        return $"{baseUrl}/{relativePath}";
    }

    private void EnsureDirectoryExists(string path)
    {
        if (!Directory.Exists(path))
        {
            Directory.CreateDirectory(path);
        }
    }
}
