using Smart_Core.Domain.Entities;

namespace Smart_Core.Application.DTOs.Users;

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? FullName { get; set; }
    public bool IsBlocked { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool EmailConfirmed { get; set; }
    public List<string> Roles { get; set; } = new();
    public DateTime CreatedDate { get; set; }
}

public class UserDetailDto : UserDto
{
    public string? PhoneNumber { get; set; }
    public bool PhoneNumberConfirmed { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}

public class UpdateUserDto
{
    public string? DisplayName { get; set; }
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
}

public class UserFilterDto
{
    public string? Search { get; set; }
    public string? Role { get; set; }
    public UserStatus? Status { get; set; }
    public bool? IsBlocked { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
