using Microsoft.AspNetCore.Identity;
using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.Notification;

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
  public DateTimeOffset CreatedDate { get; set; } = UaeTimeHelper.NowUae;
  public DateTimeOffset? UpdatedDate { get; set; }
  public string? CreatedBy { get; set; }
  public string? UpdatedBy { get; set; }
  public string? DeletedBy { get; set; }
  public bool IsDeleted { get; set; } = false;

  // Walk-in candidate flag (self-registered via share link)
  public bool IsWalkIn { get; set; } = false;

  // Encrypted password (AES-256) for notification emails
  public string? EncryptedPassword { get; set; }

  // Refresh Token
  public string? RefreshToken { get; set; }
  public DateTimeOffset? RefreshTokenExpiryTime { get; set; }

  // Tracking
  public DateTimeOffset? LastLoginDate { get; set; }

  // In-app notifications
  public virtual ICollection<UserNotification> UserNotifications { get; set; } = new List<UserNotification>();
}

public enum UserStatus
{
  Active = 1,
  Inactive = 2,
  Pending = 3,
  Suspended = 4
}
