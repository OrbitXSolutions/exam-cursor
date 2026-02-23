# Backend Notes - Issues to Fix

This document tracks backend issues that need to be addressed.

## High Priority

### 1. Auto-fill Department ID from Current User

- **Location**: `POST /api/Assessment/exams`
- **Issue**: Backend returns "Department not found" error when departmentId is not provided
- **Expected Behavior**: Backend should automatically fill `departmentId` based on the currently authenticated user's department
- **Current Workaround**: Frontend hardcodes `departmentId: 1` in the request body
- **Files Affected**:
  - `app/(dashboard)/exams/create/page.tsx` - Line ~73

---

Hi

## Medium Priority

### 2. Create Section Returns 500 Error

- **Location**: `POST /api/Assessment/exams/{examId}/sections`
- **Issue**: Backend returns 500 Internal Server Error when creating a new section
- **Request Body**: `{"titleEn":"Database Management","titleAr":"...","descriptionEn":null,"descriptionAr":null,"order":2}`
- **Note**: Might be related to sending `null` values - backend may expect fields to be omitted if empty
- **Status**: Needs investigation on backend

### 3. Add Questions to Section - Duplicate Handling (Pending Backend Update)

- **Location**: `POST /api/Assessment/sections/{sectionId}/questions`
- **Issue**: Currently throws error when adding a duplicate question
- **Expected Behavior**: Skip duplicates silently and return success message like:
  ```json
  {
    "success": true,
    "message": "Added 8 questions. Skipped 2 duplicate(s).",
    "data": [...]
  }
  ```
- **Status**: Backend update planned, frontend will work automatically once deployed

---

## Low Priority

(Add future issues here)

---

## Completed

(Move resolved issues here with completion date)
