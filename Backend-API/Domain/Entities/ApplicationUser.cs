using Microsoft.AspNetCore.Identity;
using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities;

public class ApplicationUser : IdentityUser
{
  public string? DisplayName { get; set; }
  public string? FullName { get; set; }
  public string? FullNameAr { get; set; }
  public string? RollNo { get; set; }
  public bool IsBlocked { get; set; } = false;
  public UserStatus Status { get; set; } = UserStatus.Active;

  // Department association
  public int? DepartmentId { get; set; }
  public virtual Department? Department { get; set; }

  // BaseEntity properties
  public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
  public DateTime? UpdatedDate { get; set; }
  public string? CreatedBy { get; set; }
  public string? UpdatedBy { get; set; }
  public string? DeletedBy { get; set; }
  public bool IsDeleted { get; set; } = false;

  // Refresh Token
  public string? RefreshToken { get; set; }
  public DateTime? RefreshTokenExpiryTime { get; set; }
}

public enum UserStatus
{
  Active = 1,
  Inactive = 2,
  Pending = 3,
  Suspended = 4
}
