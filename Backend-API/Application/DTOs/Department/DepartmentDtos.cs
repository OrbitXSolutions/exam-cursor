namespace Smart_Core.Application.DTOs.Department;

// ==================== Request DTOs ====================

public record CreateDepartmentRequest(
    string NameEn,
    string NameAr,
    string? DescriptionEn,
    string? DescriptionAr,
    string? Code,
    bool IsActive = true
);

public record UpdateDepartmentRequest(
    string NameEn,
    string NameAr,
  string? DescriptionEn,
    string? DescriptionAr,
    string? Code,
    bool IsActive
);

public record AssignUserToDepartmentRequest(
    string UserId,
    int DepartmentId
);

// ==================== Response DTOs ====================

public record DepartmentResponse(
    int Id,
    string NameEn,
  string NameAr,
    string? DescriptionEn,
    string? DescriptionAr,
    string? Code,
    bool IsActive,
    int UserCount,
    DateTime CreatedDate,
    string? CreatedBy
);

public record DepartmentListResponse(
    int Id,
    string NameEn,
    string NameAr,
    string? Code,
    bool IsActive,
    int UserCount
);

public record UserDepartmentResponse(
    string UserId,
    string? Email,
    string? FullName,
    int? DepartmentId,
    string? DepartmentNameEn,
    string? DepartmentNameAr
);
