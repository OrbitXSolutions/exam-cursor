# API Documentation: Question Bank & Lookups Module

## Base URL
`/api`

---

## Question Bank Module (`/api/QuestionBank`)

**Authorization:** All endpoints require `Admin` role

---

## Questions

### 1. Get All Questions
**Endpoint:** `GET /api/QuestionBank/questions`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| search | string | No | null | Search in question body |
| questionTypeId | int | No | null | Filter by question type |
| questionCategoryId | int | No | null | Filter by category |
| difficultyLevel | enum | No | null | Easy=0, Medium=1, Hard=2 |
| isActive | bool | No | null | Filter by active status |
| includeDeleted | bool | No | false | Include deleted questions |
| pageNumber | int | No | 1 | Page number |
| pageSize | int | No | 10 | Items per page |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "items": [
 {
        "id": 1,
    "body": "What is the capital of France?",
    "questionTypeName": "Multiple Choice",
   "questionCategoryName": "Geography",
  "points": 2.0,
        "difficultyLevelName": "Easy",
   "isActive": true,
    "createdDate": "2024-01-01T00:00:00Z",
        "optionsCount": 4,
        "attachmentsCount": 0
      }
    ],
  "pageNumber": 1,
    "pageSize": 10,
    "totalCount": 150,
    "totalPages": 15,
  "hasPreviousPage": false,
    "hasNextPage": true
  },
  "errors": []
}
```

---

### 2. Get Question by ID
**Endpoint:** `GET /api/QuestionBank/questions/{id}`

**Method:** GET

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | int | Yes | Question ID |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
  "id": 1,
    "body": "What is the capital of France?",
    "questionTypeId": 1,
    "questionTypeName": "Multiple Choice",
    "questionCategoryId": 1,
    "questionCategoryName": "Geography",
    "points": 2.0,
    "difficultyLevel": 0,
    "difficultyLevelName": "Easy",
    "isActive": true,
    "createdDate": "2024-01-01T00:00:00Z",
    "updatedDate": null,
    "isDeleted": false,
    "options": [
      {
    "id": 1,
    "questionId": 1,
     "text": "Paris",
 "isCorrect": true,
        "order": 0,
        "attachmentPath": null,
        "createdDate": "2024-01-01T00:00:00Z"
  },
      {
        "id": 2,
        "questionId": 1,
        "text": "London",
      "isCorrect": false,
        "order": 1,
     "attachmentPath": null,
    "createdDate": "2024-01-01T00:00:00Z"
      }
    ],
    "attachments": [
      {
        "id": 1,
        "questionId": 1,
        "fileName": "map.png",
        "filePath": "/uploads/questions/map.png",
        "fileType": "image/png",
    "fileSize": 102400,
        "isPrimary": true,
        "createdDate": "2024-01-01T00:00:00Z"
      }
    ]
  },
  "errors": []
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Question not found",
  "data": null,
  "errors": []
}
```

---

### 3. Create Question
**Endpoint:** `POST /api/QuestionBank/questions`

**Method:** POST

**Request Body:**
```json
{
  "body": "string (required)",
  "questionTypeId": 1,
  "questionCategoryId": 1,
  "points": 2.0,
  "difficultyLevel": 0,
  "isActive": true,
  "options": [
    {
      "text": "Option A",
      "isCorrect": true,
      "order": 0,
      "attachmentPath": null
    },
    {
      "text": "Option B",
      "isCorrect": false,
   "order": 1,
      "attachmentPath": null
    }
  ]
}
```

**Difficulty Level Enum:**
| Value | Name |
|-------|------|
| 0 | Easy |
| 1 | Medium |
| 2 | Hard |

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Question created successfully",
  "data": { /* QuestionDto */ },
  "errors": []
}
```

---

### 4. Update Question
**Endpoint:** `PUT /api/QuestionBank/questions/{id}`

**Method:** PUT

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | int | Yes | Question ID |

**Request Body:**
```json
{
  "body": "string (required)",
  "questionTypeId": 1,
  "questionCategoryId": 1,
  "points": 2.0,
  "difficultyLevel": 0,
  "isActive": true
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Question updated successfully",
  "data": { /* QuestionDto */ },
  "errors": []
}
```

---

### 5. Delete Question (Hard Delete)
**Endpoint:** `DELETE /api/QuestionBank/questions/{id}`

**Method:** DELETE

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Question deleted successfully",
  "data": true,
  "errors": []
}
```

---

### 6. Toggle Question Status
**Endpoint:** `PATCH /api/QuestionBank/questions/{id}/toggle-status`

**Method:** PATCH

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Question status toggled successfully",
  "data": true,
  "errors": []
}
```

---

## Question Options

### 1. Get Question Options
**Endpoint:** `GET /api/QuestionBank/questions/{questionId}/options`

**Method:** GET

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "questionId": 1,
      "text": "Paris",
      "isCorrect": true,
      "order": 0,
      "attachmentPath": null,
      "createdDate": "2024-01-01T00:00:00Z"
    }
  ],
  "errors": []
}
```

---

### 2. Add Option to Question
**Endpoint:** `POST /api/QuestionBank/questions/{questionId}/options`

**Method:** POST

**Request Body:**
```json
{
  "text": "string (required)",
  "isCorrect": false,
  "order": 0,
  "attachmentPath": null
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Option added successfully",
  "data": { /* QuestionOptionDto */ },
  "errors": []
}
```

---

### 3. Update Option
**Endpoint:** `PUT /api/QuestionBank/options/{optionId}`

**Method:** PUT

**Request Body:**
```json
{
  "id": 1,
  "text": "Updated option text",
  "isCorrect": true,
  "order": 0,
  "attachmentPath": null
}
```

---

### 4. Delete Option
**Endpoint:** `DELETE /api/QuestionBank/options/{optionId}`

**Method:** DELETE

---

### 5. Bulk Update Options
**Endpoint:** `PUT /api/QuestionBank/questions/{questionId}/options/bulk`

**Method:** PUT

**Request Body:**
```json
[
  {
    "id": 1,
    "text": "Option A",
    "isCorrect": true,
    "order": 0
  },
  {
    "id": 2,
    "text": "Option B",
    "isCorrect": false,
    "order": 1
  }
]
```

**Notes:** Updates multiple options at once. Options not in the list are not affected.

---

## Question Attachments

### 1. Get Question Attachments
**Endpoint:** `GET /api/QuestionBank/questions/{questionId}/attachments`

**Method:** GET

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "questionId": 1,
      "fileName": "diagram.png",
      "filePath": "/uploads/questions/diagram.png",
      "fileType": "image/png",
      "fileSize": 51200,
      "isPrimary": true,
      "createdDate": "2024-01-01T00:00:00Z"
    }
  ],
  "errors": []
}
```

---

### 2. Add Attachment to Question
**Endpoint:** `POST /api/QuestionBank/questions/{questionId}/attachments`

**Method:** POST

**Request Body:**
```json
{
  "fileName": "diagram.png",
  "filePath": "/uploads/questions/diagram.png",
  "fileType": "image/png",
  "fileSize": 51200,
  "isPrimary": false
}
```

**Notes:** Upload file first using Media API, then link it here.

---

### 3. Update Attachment
**Endpoint:** `PUT /api/QuestionBank/attachments/{attachmentId}`

**Method:** PUT

**Request Body:**
```json
{
  "fileName": "updated-diagram.png",
  "filePath": "/uploads/questions/updated-diagram.png",
  "fileType": "image/png",
  "fileSize": 61440,
  "isPrimary": true
}
```

---

### 4. Delete Attachment
**Endpoint:** `DELETE /api/QuestionBank/attachments/{attachmentId}`

**Method:** DELETE

---

### 5. Set Primary Attachment
**Endpoint:** `PATCH /api/QuestionBank/attachments/{attachmentId}/set-primary`

**Method:** PATCH

**Notes:** Sets the specified attachment as primary and removes primary flag from others.

---

## Lookups Module (`/api/Lookups`)

**Authorization:** All endpoints require `Admin` role

---

## Question Categories

### 1. Get All Question Categories
**Endpoint:** `GET /api/Lookups/question-categories`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| search | string | No | null | Search in name (EN/AR) |
| includeDeleted | bool | No | false | Include deleted categories |
| pageNumber | int | No | 1 | Page number |
| pageSize | int | No | 10 | Items per page |

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
      "nameEn": "Mathematics",
        "nameAr": "?????????",
        "createdDate": "2024-01-01T00:00:00Z",
        "updatedDate": null,
        "isDeleted": false
      }
    ],
    "pageNumber": 1,
    "pageSize": 10,
    "totalCount": 5,
    "totalPages": 1
},
  "errors": []
}
```

---

### 2. Get Question Category by ID
**Endpoint:** `GET /api/Lookups/question-categories/{id}`

**Method:** GET

---

### 3. Create Question Category
**Endpoint:** `POST /api/Lookups/question-categories`

**Method:** POST

**Request Body:**
```json
{
  "nameEn": "string (required)",
  "nameAr": "string (required)"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": { /* QuestionCategoryDto */ },
  "errors": []
}
```

---

### 4. Update Question Category
**Endpoint:** `PUT /api/Lookups/question-categories/{id}`

**Method:** PUT

**Request Body:**
```json
{
  "nameEn": "string (required)",
  "nameAr": "string (required)"
}
```

---

### 5. Delete Question Category (Hard Delete)
**Endpoint:** `DELETE /api/Lookups/question-categories/{id}`

**Method:** DELETE

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Cannot delete category",
  "data": false,
  "errors": ["Category is in use by existing questions"]
}
```

---

## Question Types

### 1. Get All Question Types
**Endpoint:** `GET /api/Lookups/question-types`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| search | string | No | null | Search in name (EN/AR) |
| includeDeleted | bool | No | false | Include deleted types |
| pageNumber | int | No | 1 | Page number |
| pageSize | int | No | 10 | Items per page |

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "nameEn": "Multiple Choice",
     "nameAr": "?????? ?? ?????",
     "createdDate": "2024-01-01T00:00:00Z",
        "updatedDate": null,
     "isDeleted": false
      },
    {
     "id": 2,
      "nameEn": "True/False",
        "nameAr": "??/???",
    "createdDate": "2024-01-01T00:00:00Z",
        "updatedDate": null,
    "isDeleted": false
      },
      {
        "id": 3,
        "nameEn": "Essay",
    "nameAr": "?????",
        "createdDate": "2024-01-01T00:00:00Z",
        "updatedDate": null,
        "isDeleted": false
      }
    ],
    "pageNumber": 1,
    "pageSize": 10,
    "totalCount": 3,
    "totalPages": 1
  },
  "errors": []
}
```

---

### 2. Get Question Type by ID
**Endpoint:** `GET /api/Lookups/question-types/{id}`

**Method:** GET

---

### 3. Create Question Type
**Endpoint:** `POST /api/Lookups/question-types`

**Method:** POST

**Request Body:**
```json
{
  "nameEn": "string (required)",
  "nameAr": "string (required)"
}
```

---

### 4. Update Question Type
**Endpoint:** `PUT /api/Lookups/question-types/{id}`

**Method:** PUT

**Request Body:**
```json
{
  "nameEn": "string (required)",
  "nameAr": "string (required)"
}
```

---

### 5. Delete Question Type (Hard Delete)
**Endpoint:** `DELETE /api/Lookups/question-types/{id}`

**Method:** DELETE

---

## Media Module (`/api/Media`)

**Authorization:** All endpoints require authentication (except download/view)

---

### 1. Upload File
**Endpoint:** `POST /api/Media/upload`

**Method:** POST

**Content-Type:** `multipart/form-data`

**Request:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | The file to upload |
| folder | string (query) | No | Optional folder/category |

**Max File Size:** 50 MB

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "originalFileName": "image.png",
  "storedFileName": "abc123-image.png",
    "extension": ".png",
    "contentType": "image/png",
    "sizeInBytes": 102400,
    "sizeFormatted": "100 KB",
    "mediaType": "Image",
    "storageProvider": "Local",
    "path": "/uploads/images/abc123-image.png",
    "url": "https://api.example.com/uploads/images/abc123-image.png",
  "folder": "images",
    "createdDate": "2024-01-01T00:00:00Z"
  },
  "errors": []
}
```

---

### 2. Upload Multiple Files
**Endpoint:** `POST /api/Media/upload-multiple`

**Method:** POST

**Content-Type:** `multipart/form-data`

**Max Total Size:** 100 MB

**Success Response (200 OK):**
```json
[
  { /* MediaUploadResultDto */ },
  { /* MediaUploadResultDto */ }
]
```

---

### 3. Get File Metadata
**Endpoint:** `GET /api/Media/{id}`

**Method:** GET

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | GUID | Yes | File ID |

---

### 4. Download File
**Endpoint:** `GET /api/Media/{id}/download`

**Method:** GET

**Authorization:** Public (AllowAnonymous)

**Response:** File stream with appropriate content-type header

---

### 5. View File (Inline)
**Endpoint:** `GET /api/Media/{id}/view`

**Method:** GET

**Authorization:** Public (AllowAnonymous)

**Notes:** Returns file for inline viewing (images, PDFs in browser)

---

### 6. Delete File
**Endpoint:** `DELETE /api/Media/{id}`

**Method:** DELETE

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

### 7. Get All Files
**Endpoint:** `GET /api/Media`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| folder | string | No | null | Filter by folder |
| mediaType | string | No | null | Filter by type: "Image" or "Pdf" |
| pageNumber | int | No | 1 | Page number |
| pageSize | int | No | 20 | Items per page |

---

## Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": ["Error details"]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "User not authenticated",
  "data": null,
  "errors": []
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Admin role required.",
  "data": null,
  "errors": []
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "data": null,
  "errors": []
}
```
