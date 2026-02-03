using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Settings;

namespace Smart_Core.Infrastructure.Storage;

/// <summary>
/// S3-compatible storage provider (AWS S3, MinIO, DigitalOcean Spaces, etc.)
/// </summary>
public class S3StorageProvider : IStorageProvider
{
    private readonly S3StorageSettings _settings;
    private readonly ILogger<S3StorageProvider> _logger;
    private readonly IAmazonS3 _s3Client;

    public S3StorageProvider(
        IOptions<MediaStorageSettings> settings,
    ILogger<S3StorageProvider> logger)
    {
    _settings = settings.Value.S3;
        _logger = logger;
        _s3Client = CreateS3Client();
    }

    public async Task<(string Path, string? Url)> UploadAsync(
        Stream stream, 
        string fileName, 
   string contentType, 
        string? folder = null)
    {
  try
     {
 // Build the S3 object key
            var objectKey = BuildObjectKey(fileName, folder);

      var putRequest = new PutObjectRequest
       {
       BucketName = _settings.BucketName,
  Key = objectKey,
       InputStream = stream,
   ContentType = contentType,
    // Set to public-read if you want files publicly accessible
       // CannedACL = S3CannedACL.PublicRead
     };

         await _s3Client.PutObjectAsync(putRequest);

// Build the public URL if available
         var url = BuildPublicUrl(objectKey);

            _logger.LogInformation("File uploaded to S3: {Bucket}/{Key}", _settings.BucketName, objectKey);

            return (objectKey, url);
       }
        catch (Exception ex)
   {
    _logger.LogError(ex, "Failed to upload file to S3: {FileName}", fileName);
            throw;
      }
    }

    public async Task<Stream?> GetAsync(string path)
    {
        try
{
   var getRequest = new GetObjectRequest
            {
     BucketName = _settings.BucketName,
    Key = path
       };

            var response = await _s3Client.GetObjectAsync(getRequest);
            
         // Copy to memory stream to allow seeking
   var memoryStream = new MemoryStream();
      await response.ResponseStream.CopyToAsync(memoryStream);
memoryStream.Position = 0;
     
       return memoryStream;
}
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
       _logger.LogWarning("File not found in S3: {Path}", path);
         return null;
 }
    catch (Exception ex)
      {
     _logger.LogError(ex, "Failed to read file from S3: {Path}", path);
    return null;
        }
    }

    public async Task<bool> DeleteAsync(string path)
    {
  try
        {
  var deleteRequest = new DeleteObjectRequest
    {
    BucketName = _settings.BucketName,
   Key = path
         };

 await _s3Client.DeleteObjectAsync(deleteRequest);
        _logger.LogInformation("File deleted from S3: {Bucket}/{Key}", _settings.BucketName, path);
            
            return true;
  }
        catch (Exception ex)
        {
         _logger.LogError(ex, "Failed to delete file from S3: {Path}", path);
  return false;
        }
    }

    public async Task<bool> ExistsAsync(string path)
    {
        try
   {
   var metadataRequest = new GetObjectMetadataRequest
  {
  BucketName = _settings.BucketName,
   Key = path
            };

            await _s3Client.GetObjectMetadataAsync(metadataRequest);
       return true;
   }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
  return false;
    }
    }

    private IAmazonS3 CreateS3Client()
    {
        var config = new AmazonS3Config
        {
      ServiceURL = _settings.ServiceUrl,
            ForcePathStyle = _settings.UsePathStyle
   };

  // Set region if specified (required for AWS S3)
   if (!string.IsNullOrEmpty(_settings.Region))
     {
       config.AuthenticationRegion = _settings.Region;
        }

        return new AmazonS3Client(_settings.AccessKey, _settings.SecretKey, config);
    }

    private string BuildObjectKey(string fileName, string? folder)
    {
  var parts = new List<string>();

        // Add default prefix if configured
        if (!string.IsNullOrWhiteSpace(_settings.DefaultPrefix))
        {
     parts.Add(_settings.DefaultPrefix.Trim('/'));
        }

        // Add folder if specified
        if (!string.IsNullOrWhiteSpace(folder))
{
       parts.Add(folder.Trim('/'));
   }

// Add year/month for organization
        parts.Add(DateTime.UtcNow.ToString("yyyy/MM"));

        // Add filename
        parts.Add(fileName);

        return string.Join("/", parts);
    }

    private string? BuildPublicUrl(string objectKey)
    {
        if (!string.IsNullOrWhiteSpace(_settings.PublicUrl))
   {
            return $"{_settings.PublicUrl.TrimEnd('/')}/{objectKey}";
        }

        // Build URL from service URL and bucket
        if (_settings.UsePathStyle)
    {
     return $"{_settings.ServiceUrl.TrimEnd('/')}/{_settings.BucketName}/{objectKey}";
        }

        // Virtual-hosted style URL
   var uri = new Uri(_settings.ServiceUrl);
  return $"{uri.Scheme}://{_settings.BucketName}.{uri.Host}/{objectKey}";
    }
}
