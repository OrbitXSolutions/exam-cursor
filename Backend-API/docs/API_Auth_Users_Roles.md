# API Documentation: Authentication, Users & Roles Module

## Base URL
`/api`

---
Department
├── Users (ApplicationUser.DepartmentId)
└── Exams (Exam.DepartmentId)
    └── Sections (ExamSection)
        └── Topics (ExamTopic) ← NEW
            └── Questions (ExamQuestion.ExamTopicId)

Exam
├── ExamType (Fixed/Flex) ← NEW
├── DepartmentId ← NEW (for access control)
├── StartAt / EndAt
└── DurationMinutes
## Authentication Module (`/api/Auth`)

### 1. Register User
**Endpoint:** `POST /api/Auth/register`

**Method:** POST

**Authorization:** None (Public)

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)",
  "confirmPassword": "string (required)",
  "displayName": "string (optional)",
  "fullName": "string (optional)"
}
```

**Validation Requirements:**
| Field | Rules |
|-------|-------|
| email | Required, Valid email format |
| password | Required, Min 8 characters, Must contain: uppercase, lowercase, number, special character |
| confirmPassword | Must match password |
| displayName | Max 100 characters |
| fullName | Max 200 characters |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "expiration": "2024-01-01T00:00:00Z",
    "user": {
      "id": "string",
    "email": "string",
   "displayName": "string",
      "fullName": "string",
      "isBlocked": false,
      "status": "string",
      "emailConfirmed": false,
      "roles": ["string"],
      "createdDate": "2024-01-01T00:00:00Z"
    }
  },
  "errors": []
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Registration failed",
  "data": null,
  "errors": ["Email already exists", "Password does not meet requirements"]
}
```

---

### 2. Login
**Endpoint:** `POST /api/Auth/login`

**Method:** POST

**Authorization:** None (Public)

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Validation Requirements:**
| Field | Rules |
|-------|-------|
| email | Required, Valid email format |
| password | Required |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "expiration": "2024-01-01T00:00:00Z",
    "user": {
      "id": "string",
      "email": "string",
    "displayName": "string",
    "fullName": "string",
      "isBlocked": false,
      "status": "string",
      "emailConfirmed": true,
      "roles": ["Admin", "User"],
   "createdDate": "2024-01-01T00:00:00Z"
    }
  },
  "errors": []
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "data": null,
  "errors": ["Email or password is incorrect"]
}
```

---

### 3. Confirm Email
**Endpoint:** `GET /api/Auth/confirm-email`

**Method:** GET

**Authorization:** None (Public)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | User's email address |
| token | string | Yes | Email confirmation token |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Email confirmed successfully",
  "data": true,
  "errors": []
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Email confirmation failed",
  "data": false,
  "errors": ["Invalid or expired token"]
}
```

---

### 4. Forgot Password
**Endpoint:** `POST /api/Auth/forgot-password`

**Method:** POST

**Authorization:** None (Public)

**Request Body:**
```json
{
  "email": "string (required)"
}
```

**Validation Requirements:**
| Field | Rules |
|-------|-------|
| email | Required, Valid email format |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset email sent",
  "data": true,
  "errors": []
}
```

**Notes:** Always returns success even if email doesn't exist (security measure)

---

### 5. Reset Password
**Endpoint:** `POST /api/Auth/reset-password`

**Method:** POST

**Authorization:** None (Public)

**Request Body:**
```json
{
  "email": "string (required)",
  "token": "string (required)",
  "newPassword": "string (required)",
  "confirmPassword": "string (required)"
}
```

**Validation Requirements:**
| Field | Rules |
|-------|-------|
| email | Required, Valid email format |
| token | Required |
| newPassword | Required, Min 8 characters, Must contain: uppercase, lowercase, number, special character |
| confirmPassword | Must match newPassword |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": true,
  "errors": []
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Password reset failed",
  "data": false,
  "errors": ["Invalid or expired token"]
}
```

---

### 6. Change Password
**Endpoint:** `POST /api/Auth/change-password`

**Method:** POST

**Authorization:** Required (Bearer Token)

**Request Body:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required)",
  "confirmPassword": "string (required)"
}
```

**Validation Requirements:**
| Field | Rules |
|-------|-------|
| currentPassword | Required |
| newPassword | Required, Min 8 characters, Must contain: uppercase, lowercase, number, special character |
| confirmPassword | Must match newPassword |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": true,
  "errors": []
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Password change failed",
  "data": false,
  "errors": ["Current password is incorrect"]
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "User not authenticated.",
  "data": false,
  "errors": []
}
```

---

### 7. Refresh Token
**Endpoint:** `POST /api/Auth/refresh-token`

**Method:** POST

**Authorization:** None (Public)

**Request Body:**
```json
{
  "accessToken": "string (required)",
  "refreshToken": "string (required)"
}
```

**Validation Requirements:**
| Field | Rules |
|-------|-------|
| accessToken | Required |
| refreshToken | Required |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "expiration": "2024-01-01T00:00:00Z",
    "user": { /* UserDto */ }
  },
  "errors": []
}
```

**Error Response (400 Bad Request):**
```json
{
"success": false,
  "message": "Invalid token",
  "data": null,
  "errors": ["Refresh token is invalid or expired"]
}
```

---

### 8. Logout
**Endpoint:** `POST /api/Auth/logout`

**Method:** POST

**Authorization:** Required (Bearer Token)

**Request Body:** None

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": true,
  "errors": []
}
```

---

## Users Module (`/api/Users`)

**Authorization:** All endpoints require `SuperDev` or `Admin` role

### 1. Get All Users
**Endpoint:** `GET /api/Users`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| search | string | No | null | Search by email, name |
| role | string | No | null | Filter by role name |
| status | enum | No | null | Filter by status (Active, Inactive, Pending) |
| isBlocked | bool | No | null | Filter by blocked status |
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
        "id": "string",
   "email": "string",
        "displayName": "string",
        "fullName": "string",
        "isBlocked": false,
        "status": "Active",
        "emailConfirmed": true,
        "roles": ["Admin"],
        "createdDate": "2024-01-01T00:00:00Z"
      }
    ],
    "pageNumber": 1,
    "pageSize": 10,
    "totalCount": 100,
    "totalPages": 10,
    "hasPreviousPage": false,
    "hasNextPage": true
  },
  "errors": []
}
```

---

### 2. Get User by ID
**Endpoint:** `GET /api/Users/{id}`

**Method:** GET

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | User ID |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
"id": "string",
    "email": "string",
    "displayName": "string",
 "fullName": "string",
    "isBlocked": false,
    "status": "Active",
    "emailConfirmed": true,
    "roles": ["Admin"],
    "createdDate": "2024-01-01T00:00:00Z",
    "phoneNumber": "string",
    "phoneNumberConfirmed": false,
    "updatedDate": "2024-01-01T00:00:00Z",
    "createdBy": "string",
    "updatedBy": "string"
  },
  "errors": []
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "User not found",
  "data": null,
  "errors": []
}
```

---

### 3. Get User by Email
**Endpoint:** `GET /api/Users/by-email/{email}`

**Method:** GET

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | User email address |

**Success Response (200 OK):** Same as Get User by ID

---

### 4. Get Users by Role
**Endpoint:** `GET /api/Users/by-role/{roleName}`

**Method:** GET

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| roleName | string | Yes | Role name (e.g., "Admin") |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": [
    {
    "id": "string",
      "email": "string",
      "displayName": "string",
      "fullName": "string",
      "isBlocked": false,
      "status": "Active",
      "emailConfirmed": true,
      "roles": ["Admin"],
      "createdDate": "2024-01-01T00:00:00Z"
    }
  ],
  "errors": []
}
```

---

### 5. Update User
**Endpoint:** `PUT /api/Users/{id}`

**Method:** PUT

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | User ID |

**Request Body:**
```json
{
  "displayName": "string (optional)",
  "fullName": "string (optional)",
"phoneNumber": "string (optional)"
}
```

**Validation Requirements:**
| Field | Rules |
|-------|-------|
| displayName | Max 100 characters |
| fullName | Max 200 characters |
| phoneNumber | Valid phone format (E.164): `+[country code][number]` |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": { /* UserDetailDto */ },
  "errors": []
}
```

---

### 6. Block User
**Endpoint:** `POST /api/Users/{id}/block`

**Method:** POST

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | User ID |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User blocked successfully",
  "data": true,
  "errors": []
}
```

---

### 7. Unblock User
**Endpoint:** `POST /api/Users/{id}/unblock`

**Method:** POST

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | User ID |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User unblocked successfully",
  "data": true,
  "errors": []
}
```

---

### 8. Activate User
**Endpoint:** `POST /api/Users/{id}/activate`

**Method:** POST

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User activated successfully",
  "data": true,
  "errors": []
}
```

---

### 9. Deactivate User
**Endpoint:** `POST /api/Users/{id}/deactivate`

**Method:** POST

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User deactivated successfully",
  "data": true,
  "errors": []
}
```

---

### 10. Delete User (Soft Delete)
**Endpoint:** `DELETE /api/Users/{id}`

**Method:** DELETE

**Authorization:** `SuperDev` role only

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | User ID |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": true,
  "errors": []
}
```

---

## Roles Module (`/api/Roles`)

**Authorization:** All endpoints require `SuperDev` or `Admin` role (except where noted)

### 1. Get All Roles
**Endpoint:** `GET /api/Roles`

**Method:** GET

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": [
 {
      "id": "string",
      "name": "Admin",
      "description": "Administrator role",
      "createdDate": "2024-01-01T00:00:00Z",
    "userCount": 5
    }
  ],
  "errors": []
}
```

---

### 2. Get Role by ID
**Endpoint:** `GET /api/Roles/{id}`

**Method:** GET

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Role ID |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": "string",
    "name": "Admin",
    "description": "Administrator role",
    "createdDate": "2024-01-01T00:00:00Z",
    "userCount": 5
  },
  "errors": []
}
```

---

### 3. Create Role
**Endpoint:** `POST /api/Roles`

**Method:** POST

**Authorization:** `SuperDev` role only

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Role created successfully",
  "data": { /* RoleDto */ },
  "errors": []
}
```

---

### 4. Update Role
**Endpoint:** `PUT /api/Roles/{id}`

**Method:** PUT

**Authorization:** `SuperDev` role only

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Role updated successfully",
  "data": { /* RoleDto */ },
  "errors": []
}
```

---

### 5. Delete Role
**Endpoint:** `DELETE /api/Roles/{id}`

**Method:** DELETE

**Authorization:** `SuperDev` role only

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Role deleted successfully",
  "data": true,
  "errors": []
}
```

---

### 6. Add User to Role
**Endpoint:** `POST /api/Roles/add-user`

**Method:** POST

**Request Body:**
```json
{
  "userId": "string (required)",
  "roleName": "string (required)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User added to role successfully",
  "data": true,
  "errors": []
}
```

---

### 7. Remove User from Role
**Endpoint:** `POST /api/Roles/remove-user`

**Method:** POST

**Request Body:**
```json
{
  "userId": "string (required)",
  "roleName": "string (required)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User removed from role successfully",
  "data": true,
  "errors": []
}
```

---

### 8. Get Users in Role
**Endpoint:** `GET /api/Roles/{roleName}/users`

**Method:** GET

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| roleName | string | Yes | Role name |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "roleId": "string",
    "roleName": "Admin",
    "users": [
      {
        "id": "string",
        "email": "user@example.com",
        "displayName": "John Doe",
        "fullName": "John Michael Doe"
      }
    ]
  },
  "errors": []
}
```

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "User not authenticated.",
  "data": null,
  "errors": []
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions.",
  "data": null,
  "errors": []
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "An unexpected error occurred",
  "data": null,
  "errors": ["Error details"]
}
```
