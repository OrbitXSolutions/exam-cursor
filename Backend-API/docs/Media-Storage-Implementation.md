# Media Storage Feature - Implementation Guide

## ? Overview

The Media Storage feature provides a flexible, production-ready file storage solution that supports both **Local** and **S3-compatible** storage backends. You can switch between storage providers using configuration only—no code changes required.

---

## ?? File Structure

```
Smart_Core/
??? Domain/
?   ??? Entities/
?   ?   ??? MediaFile.cs     # Media file entity
?   ??? Enums/
?       ??? StorageEnums.cs      # StorageProvider, MediaType enums
??? Application/
?   ??? DTOs/Media/
?   ?   ??? MediaDtos.cs       # Upload/Response DTOs
?   ??? Interfaces/
?   ?   ??? IMediaStorageService.cs   # Main service interface
?   ?   ??? IStorageProvider.cs       # Storage provider interface
?   ??? Settings/
?       ??? MediaStorageSettings.cs   # Configuration classes
??? Infrastructure/
?   ??? Storage/
?   ?   ??? LocalStorageProvider.cs   # Local file system implementation
?   ?   ??? S3StorageProvider.cs      # S3-compatible implementation
?   ??? Services/
?   ?   ??? MediaStorageService.cs    # Main service implementation
?   ??? Data/Configurations/
? ??? MediaFileConfiguration.cs # EF Core configuration
??? Controllers/
    ??? MediaController.cs  # API endpoints
```

---

## ?? How It Works

### Architecture

```
???????????????????????????????????????????????????????????????
?              MediaController           ?
?        (API Endpoints)       ?
???????????????????????????????????????????????????????????????
       ?
                 ?
???????????????????????????????????????????????????????????????
?               IMediaStorageService          ?
?        (MediaStorageService.cs)        ?
?                 ?
?  • Validates files (type, size)            ?
?  • Generates unique filenames            ?
?  • Stores metadata in database              ?
?  • Delegates storage to IStorageProvider            ?
???????????????????????????????????????????????????????????????
      ?
      ?
???????????????????????????????????????????????????????????????
?       IStorageProvider     ?
?      (Configured via appsettings.json)         ?
???????????????????????????????????????????????????????????????
?   LocalStorageProvider ?  S3StorageProvider    ?
?    ?       ?
?  • Saves to disk       ?  • Uploads to S3/MinIO/Spaces    ?
?  • Organized by date     ?  • Supports any S3-compatible    ?
?  • Returns local URL     ?  • Returns object key + URL      ?
???????????????????????????????????????????????????????????????
```

### Storage Flow

1. **Upload Request** ? Controller receives file
2. **Validation** ? Check file type (image/PDF) and size
3. **Generate Name** ? Create unique filename (GUID + extension)
4. **Store File** ? Upload via configured storage provider
5. **Save Metadata** ? Store file info in database
6. **Return Response** ? Return file ID, URL, and metadata

---

## ?? Configuration

### appsettings.json

```json
{
  "MediaStorage": {
    "Provider": "Local",           // "Local" or "S3"
    "MaxFileSizeMB": 10,           // Maximum file size in MB
    "AllowedImageExtensions": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"],
    "AllowedPdfExtensions": [".pdf"],
    
    "Local": {
      "BasePath": "MediaStorage",  // Folder path (relative or absolute)
      "BaseUrl": "/media"       // URL path for serving files
    },
    
    "S3": {
      "ServiceUrl": "https://s3.amazonaws.com",
      "AccessKey": "your-access-key",
      "SecretKey": "your-secret-key",
 "BucketName": "your-bucket-name",
      "Region": "us-east-1",
      "UsePathStyle": false,       // true for MinIO
      "DefaultPrefix": "uploads",  // Optional folder prefix
      "PublicUrl": ""    // Optional CDN/public URL
    }
  }
}
```

---

## ??? Local Storage Configuration

### Basic Setup

```json
{
  "MediaStorage": {
    "Provider": "Local",
    "MaxFileSizeMB": 10,
    "Local": {
      "BasePath": "MediaStorage",
      "BaseUrl": "/media"
    }
  }
}
```

### File Organization

Files are automatically organized by:
- **Folder** (optional, user-specified)
- **Year/Month** (automatic)

Example structure:
```
MediaStorage/
??? profiles/
?   ??? 2024/
?       ??? 01/
?           ??? a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
?           ??? b2c3d4e5-f6a7-8901-bcde-f12345678901.png
??? documents/
?   ??? 2024/
?       ??? 01/
?   ??? c3d4e5f6-a7b8-9012-cdef-123456789012.pdf
??? 2024/
    ??? 01/
        ??? d4e5f6a7-b8c9-0123-defa-234567890123.jpg
```

### Accessing Files

Local files can be accessed via:
- **Direct URL**: `/media/profiles/2024/01/filename.jpg`
- **API Download**: `GET /api/media/{id}/download`
- **API View**: `GET /api/media/{id}/view`

---

## ?? S3 Storage Configuration

### AWS S3

```json
{
  "MediaStorage": {
    "Provider": "S3",
    "S3": {
      "ServiceUrl": "https://s3.amazonaws.com",
      "AccessKey": "AKIAIOSFODNN7EXAMPLE",
      "SecretKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      "BucketName": "my-media-bucket",
      "Region": "us-east-1",
      "UsePathStyle": false,
      "DefaultPrefix": "uploads",
      "PublicUrl": "https://my-media-bucket.s3.amazonaws.com"
    }
  }
}
```

### MinIO (Self-hosted S3)

```json
{
  "MediaStorage": {
    "Provider": "S3",
    "S3": {
      "ServiceUrl": "http://localhost:9000",
      "AccessKey": "minioadmin",
      "SecretKey": "minioadmin",
      "BucketName": "media",
   "Region": "",
      "UsePathStyle": true,
      "DefaultPrefix": "",
      "PublicUrl": "http://localhost:9000/media"
    }
  }
}
```

### DigitalOcean Spaces

```json
{
  "MediaStorage": {
    "Provider": "S3",
    "S3": {
      "ServiceUrl": "https://nyc3.digitaloceanspaces.com",
      "AccessKey": "your-spaces-access-key",
      "SecretKey": "your-spaces-secret-key",
      "BucketName": "my-space-name",
      "Region": "nyc3",
      "UsePathStyle": false,
      "DefaultPrefix": "uploads",
      "PublicUrl": "https://my-space-name.nyc3.digitaloceanspaces.com"
    }
  }
}
```

### Cloudflare R2

```json
{
  "MediaStorage": {
    "Provider": "S3",
    "S3": {
      "ServiceUrl": "https://your-account-id.r2.cloudflarestorage.com",
      "AccessKey": "your-r2-access-key",
      "SecretKey": "your-r2-secret-key",
      "BucketName": "my-bucket",
      "Region": "auto",
      "UsePathStyle": true,
      "DefaultPrefix": "",
      "PublicUrl": "https://pub-xxx.r2.dev"
  }
  }
}
```

---

## ?? API Endpoints

### MediaController (`/api/media`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/upload` | Upload single file | Yes |
| POST | `/upload-multiple` | Upload multiple files | Yes |
| GET | `/{id}` | Get file metadata | Yes |
| GET | `/{id}/download` | Download file | No* |
| GET | `/{id}/view` | View file inline | No* |
| DELETE | `/{id}` | Delete file | Yes |
| GET | `/` | List files (paginated) | Yes |

*Can be configured to require auth

---

## ?? API Usage Examples

### Upload a File

```http
POST /api/media/upload?folder=profiles
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary file data]
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "originalFileName": "profile-photo.jpg",
    "storedFileName": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
    "extension": ".jpg",
    "contentType": "image/jpeg",
    "sizeInBytes": 245678,
    "sizeFormatted": "239.92 KB",
    "mediaType": "Image",
    "storageProvider": "Local",
    "path": "profiles/2024/01/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
    "url": "/media/profiles/2024/01/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
    "folder": "profiles",
    "createdDate": "2024-01-15T10:30:00Z"
  }
}
```

### Upload Multiple Files

```http
POST /api/media/upload-multiple?folder=documents
Authorization: Bearer {token}
Content-Type: multipart/form-data

files: [file1.pdf, file2.pdf, file3.jpg]
```

### Get File Metadata

```http
GET /api/media/3fa85f64-5717-4562-b3fc-2c963f66afa6
Authorization: Bearer {token}
```

### Download File

```http
GET /api/media/3fa85f64-5717-4562-b3fc-2c963f66afa6/download
```

Returns file with `Content-Disposition: attachment`

### View File Inline

```http
GET /api/media/3fa85f64-5717-4562-b3fc-2c963f66afa6/view
```

Returns file for inline viewing (images display in browser, PDFs open in viewer)

### Delete File

```http
DELETE /api/media/3fa85f64-5717-4562-b3fc-2c963f66afa6
Authorization: Bearer {token}
```

### List Files

```http
GET /api/media?folder=profiles&mediaType=Image&pageNumber=1&pageSize=20
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "items": [...],
    "pageNumber": 1,
    "pageSize": 20,
    "totalCount": 45,
    "totalPages": 3,
    "hasPreviousPage": false,
    "hasNextPage": true
  }
}
```

---

## ? Validation Rules

### File Types

| Type | Allowed Extensions | MIME Types |
|------|-------------------|------------|
| **Images** | .jpg, .jpeg, .png, .gif, .webp, .bmp | image/jpeg, image/png, image/gif, image/webp, image/bmp |
| **PDFs** | .pdf | application/pdf |

### File Size

- Default maximum: **10 MB**
- Configurable via `MaxFileSizeMB`
- Controller limits: 50 MB (single), 100 MB (multiple)

### Validation Errors

```json
{
  "success": false,
  "message": "File validation failed.",
  "errors": [
    "File size exceeds the maximum allowed size of 10 MB.",
    "File type '.exe' is not allowed. Allowed types: .jpg, .jpeg, .png, .gif, .webp, .bmp, .pdf"
  ]
}
```

---

## ??? Database Schema

### MediaFiles Table

| Column | Type | Description |
|--------|------|-------------|
| Id | uniqueidentifier | Primary key (GUID) |
| OriginalFileName | nvarchar(500) | Original uploaded filename |
| StoredFileName | nvarchar(500) | Generated filename (GUID) |
| Extension | nvarchar(20) | File extension |
| ContentType | nvarchar(100) | MIME type |
| SizeInBytes | bigint | File size |
| MediaType | int | 1=Image, 2=PDF |
| StorageProvider | int | 1=Local, 2=S3 |
| Path | nvarchar(1000) | Storage path/key |
| Url | nvarchar(2000) | Public URL |
| BucketName | nvarchar(100) | S3 bucket (nullable) |
| Folder | nvarchar(200) | Logical folder |
| CreatedDate | datetime2 | Created timestamp |
| UpdatedDate | datetime2 | Updated timestamp |
| CreatedBy | nvarchar(450) | User ID |
| UpdatedBy | nvarchar(450) | User ID |
| DeletedBy | nvarchar(450) | User ID |
| IsDeleted | bit | Soft delete flag |

---

## ?? Security Considerations

1. **File Type Validation**: Only allowed extensions and MIME types accepted
2. **Size Limits**: Configurable maximum file size
3. **Unique Filenames**: GUIDs prevent filename collisions and path traversal
4. **Soft Delete**: Files marked as deleted, not immediately removed
5. **Authentication**: Upload/delete require authentication
6. **Authorization**: Can add role-based access if needed

---

## ?? Quick Start

### 1. Run Migration

```bash
dotnet ef migrations add AddMediaFiles
dotnet ef database update
```

### 2. Create MediaStorage Folder

For local storage, create the folder:
```bash
mkdir MediaStorage
```

### 3. Configure Storage

Edit `appsettings.json`:
```json
{
  "MediaStorage": {
    "Provider": "Local"
  }
}
```

### 4. Test Upload

```bash
# Login first to get token
curl -X POST https://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"Rowyda15@gmail.com","password":"13579@Rowyda"}'

# Upload file
curl -X POST https://localhost:5001/api/media/upload \
  -H "Authorization: Bearer {token}" \
  -F "file=@test-image.jpg" \
  -F "folder=test"
```

---

## ?? Switching Storage Providers

To switch from Local to S3 (or vice versa):

1. Update `appsettings.json`:
   ```json
   {
     "MediaStorage": {
       "Provider": "S3"  // Change from "Local" to "S3"
     }
   }
   ```

2. Restart the application

**Note**: Existing files remain in the original storage. New uploads go to the new provider.

---

## ?? NuGet Package

The S3 integration uses:
```xml
<PackageReference Include="AWSSDK.S3" Version="3.7.400.2" />
```

This package works with all S3-compatible services.

---

## ?? Best Practices

1. **Use folders** to organize files logically (profiles, documents, etc.)
2. **Store file IDs** in related entities, not paths
3. **Use the API** for downloads instead of direct URLs when auth is needed
4. **Configure CDN** for S3 in production (set `PublicUrl`)
5. **Set appropriate size limits** based on your use case
6. **Monitor storage usage** and implement cleanup if needed
