# Lookups Module Documentation

## Overview

The Lookups module provides a centralized way to manage lookup/reference data used throughout the Smart Core application. This module includes **Question Categories** and **Question Types** entities with full CRUD operations, search, pagination, and admin-only access.

---

## ?? Module Structure

```
Smart_Core/
??? Controllers/
?   ??? Lookups/
?       ??? LookupsController.cs
??? Application/
?   ??? DTOs/
?   ?   ??? Lookups/
?   ?       ??? QuestionCategoryDtos.cs
?   ?       ??? QuestionTypeDtos.cs
?   ??? Interfaces/
?   ?   ??? Lookups/
?   ?       ??? ILookupsService.cs
?   ??? Validators/
?       ??? Lookups/
?  ??? QuestionCategoryValidators.cs
?           ??? QuestionTypeValidators.cs
??? Domain/
?   ??? Entities/
?       ??? Lookups/
?    ??? QuestionCategory.cs
?     ??? QuestionType.cs
??? Infrastructure/
    ??? Data/
?   ??? Configurations/
 ?       ??? Lookups/
    ?           ??? QuestionCategoryConfiguration.cs
    ?       ??? QuestionTypeConfiguration.cs
    ??? Services/
        ??? Lookups/
            ??? LookupsService.cs
```

---

## ?? Domain Entities

### QuestionCategory

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key (auto-generated) |
| NameEn | string | English name (max 300 chars, unique) |
| NameAr | string | Arabic name (max 300 chars, unique) |
| CreatedDate | DateTime | Creation timestamp |
| UpdatedDate | DateTime? | Last update timestamp |
| CreatedBy | string? | User ID who created |
| UpdatedBy | string? | User ID who last updated |
| DeletedBy | string? | User ID who deleted |
| IsDeleted | bool | Soft delete flag (default: false) |

### QuestionType

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key (fixed IDs for seeded data) |
| NameEn | string | English name (max 300 chars, unique) |
| NameAr | string | Arabic name (max 300 chars, unique) |
| CreatedDate | DateTime | Creation timestamp |
| UpdatedDate | DateTime? | Last update timestamp |
| CreatedBy | string? | User ID who created |
| UpdatedBy | string? | User ID who last updated |
| DeletedBy | string? | User ID who deleted |
| IsDeleted | bool | Soft delete flag (default: false) |

---

## ?? Seed Data (QuestionType)

The following question types are seeded automatically with fixed IDs:

| ID | NameEn | NameAr |
|----|--------|--------|
| 1 | MCQ_Single | ?????? ?? ????? (????? ?????) |
| 2 | MCQ_Multi | ?????? ?? ????? (???? ?? ?????) |
| 3 | TrueFalse | ??/??? |
| 4 | ShortAnswer | ????? ????? |

---

## ?? Authorization

All endpoints require **Admin** role authentication.

```csharp
[Authorize(Roles = AppRoles.Admin)]
```

---

## ?? API Endpoints

### Question Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lookups/question-categories` | Get all with pagination & search |
| GET | `/api/lookups/question-categories/{id}` | Get by ID |
| POST | `/api/lookups/question-categories` | Create new |
| PUT | `/api/lookups/question-categories/{id}` | Update existing |
| DELETE | `/api/lookups/question-categories/{id}` | Hard delete |

### Question Types

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lookups/question-types` | Get all with pagination & search |
| GET | `/api/lookups/question-types/{id}` | Get by ID |
| POST | `/api/lookups/question-types` | Create new |
| PUT | `/api/lookups/question-types/{id}` | Update existing |
| DELETE | `/api/lookups/question-types/{id}` | Hard delete |

---

## ?? API Examples

### Authentication Header

All requests require a JWT Bearer token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 1. Get All Question Categories

**Request:**
```http
GET /api/lookups/question-categories?PageNumber=1&PageSize=10&Search=math
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| Search | string | null | Search in NameEn and NameAr |
| IncludeDeleted | bool | false | Include soft-deleted records |
| PageNumber | int | 1 | Page number |
| PageSize | int | 10 | Items per page |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "items": [
      {
        "id": 1,
  "nameEn": "Mathematics",
        "nameAr": "?????????",
 "createdDate": "2024-01-15T10:30:00Z",
        "updatedDate": null,
  "isDeleted": false
      },
      {
      "id": 2,
        "nameEn": "Advanced Mathematics",
        "nameAr": "????????? ????????",
        "createdDate": "2024-01-14T09:00:00Z",
     "updatedDate": "2024-01-15T11:00:00Z",
     "isDeleted": false
      }
    ],
    "pageNumber": 1,
    "pageSize": 10,
    "totalCount": 2,
    "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  },
  "errors": []
}
```

---

### 2. Get Question Category by ID

**Request:**
```http
GET /api/lookups/question-categories/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": 1,
    "nameEn": "Mathematics",
    "nameAr": "?????????",
    "createdDate": "2024-01-15T10:30:00Z",
    "updatedDate": null,
  "isDeleted": false
  },
  "errors": []
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Question category not found",
  "data": null,
  "errors": []
}
```

---

### 3. Create Question Category

**Request:**
```http
POST /api/lookups/question-categories
Content-Type: application/json

{
  "nameEn": "Science",
  "nameAr": "??????"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Question category created successfully",
  "data": {
    "id": 3,
    "nameEn": "Science",
    "nameAr": "??????",
    "createdDate": "2024-01-15T12:00:00Z",
    "updatedDate": null,
    "isDeleted": false
  },
  "errors": []
}
```

**Response (400 Bad Request - Validation Error):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "NameEn": ["English name is required"],
    "NameAr": ["Arabic name cannot exceed 300 characters"]
  }
}
```

**Response (400 Bad Request - Duplicate):**
```json
{
  "success": false,
  "message": "A question category with this English name already exists",
  "data": null,
  "errors": []
}
```

---

### 4. Update Question Category

**Request:**
```http
PUT /api/lookups/question-categories/3
Content-Type: application/json

{
  "nameEn": "Natural Science",
  "nameAr": "?????? ????????"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Question category updated successfully",
  "data": {
    "id": 3,
    "nameEn": "Natural Science",
    "nameAr": "?????? ????????",
    "createdDate": "2024-01-15T12:00:00Z",
    "updatedDate": "2024-01-15T14:30:00Z",
    "isDeleted": false
  },
  "errors": []
}
```

---

### 5. Delete Question Category (Hard Delete)

**Request:**
```http
DELETE /api/lookups/question-categories/3
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Question category deleted successfully",
  "data": true,
  "errors": []
}
```

---

### 6. Get All Question Types

**Request:**
```http
GET /api/lookups/question-types?PageNumber=1&PageSize=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "items": [
      {
        "id": 4,
        "nameEn": "ShortAnswer",
  "nameAr": "????? ?????",
        "createdDate": "2024-01-01T00:00:00Z",
      "updatedDate": null,
     "isDeleted": false
      },
      {
 "id": 3,
        "nameEn": "TrueFalse",
        "nameAr": "??/???",
        "createdDate": "2024-01-01T00:00:00Z",
        "updatedDate": null,
        "isDeleted": false
      },
    {
        "id": 2,
    "nameEn": "MCQ_Multi",
      "nameAr": "?????? ?? ????? (???? ?? ?????)",
        "createdDate": "2024-01-01T00:00:00Z",
  "updatedDate": null,
        "isDeleted": false
      },
      {
        "id": 1,
        "nameEn": "MCQ_Single",
        "nameAr": "?????? ?? ????? (????? ?????)",
        "createdDate": "2024-01-01T00:00:00Z",
        "updatedDate": null,
        "isDeleted": false
    }
    ],
    "pageNumber": 1,
    "pageSize": 10,
    "totalCount": 4,
    "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  },
  "errors": []
}
```

---

### 7. Create Question Type

**Request:**
```http
POST /api/lookups/question-types
Content-Type: application/json

{
  "nameEn": "Essay",
  "nameAr": "?????"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Question type created successfully",
  "data": {
    "id": 5,
    "nameEn": "Essay",
    "nameAr": "?????",
    "createdDate": "2024-01-15T15:00:00Z",
    "updatedDate": null,
    "isDeleted": false
  },
  "errors": []
}
```

---

## ? Validation Rules

### QuestionCategory & QuestionType

| Field | Rule |
|-------|------|
| NameEn | Required, Max 300 characters |
| NameAr | Required, Max 300 characters |

---

## ??? Database Configuration

### Indexes

Both entities have unique indexes on `NameEn` and `NameAr`:

```csharp
builder.HasIndex(x => x.NameEn)
    .IsUnique()
    .HasDatabaseName("IX_QuestionCategories_NameEn");

builder.HasIndex(x => x.NameAr)
    .IsUnique()
    .HasDatabaseName("IX_QuestionCategories_NameAr");
```

### Query Filter (Soft Delete)

A global query filter is applied to exclude soft-deleted records by default:

```csharp
builder.HasQueryFilter(x => !x.IsDeleted);
```

To include deleted records, use `IncludeDeleted = true` in the search DTO.

---

## ?? Setup & Migration

### 1. Apply Database Migration

```bash
dotnet ef migrations add AddLookupsModule
dotnet ef database update
```

### 2. Verify Seed Data

After migration, the `QuestionTypes` table will contain the 4 seeded records.

---

## ?? Service Registration

The `LookupsService` is registered in `Program.cs`:

```csharp
builder.Services.AddScoped<ILookupsService, LookupsService>();
```

---

## ?? Usage Examples in Code

### Injecting the Service

```csharp
public class MyController : ControllerBase
{
    private readonly ILookupsService _lookupsService;

    public MyController(ILookupsService lookupsService)
    {
        _lookupsService = lookupsService;
    }

    public async Task<IActionResult> GetQuestionTypes()
    {
        var result = await _lookupsService.GetAllQuestionTypesAsync(new QuestionTypeSearchDto());
        return Ok(result);
}
}
```

### Creating a Question Category

```csharp
var dto = new CreateQuestionCategoryDto
{
    NameEn = "Programming",
    NameAr = "???????"
};

var result = await _lookupsService.CreateQuestionCategoryAsync(dto, currentUserId);

if (result.Success)
{
    Console.WriteLine($"Created category with ID: {result.Data.Id}");
}
else
{
    Console.WriteLine($"Error: {result.Message}");
}
```

### Searching with Pagination

```csharp
var searchDto = new QuestionCategorySearchDto
{
    Search = "math",
    PageNumber = 1,
    PageSize = 20,
    IncludeDeleted = false
};

var result = await _lookupsService.GetAllQuestionCategoriesAsync(searchDto);

Console.WriteLine($"Found {result.Data.TotalCount} categories");
Console.WriteLine($"Page {result.Data.PageNumber} of {result.Data.TotalPages}");
```

---

## ?? Notes

1. **Hard Delete**: The DELETE endpoints perform hard delete (permanent removal from database).
2. **Soft Delete Query Filter**: By default, GET operations exclude soft-deleted records.
3. **Fixed Seed IDs**: QuestionType seed data uses fixed IDs (1-4) for stable references.
4. **Unique Constraints**: Both NameEn and NameAr must be unique across all records (including soft-deleted).
5. **Sorting**: All GET operations return results sorted by `CreatedDate` descending (newest first).
