namespace Smart_Core.Application.DTOs.Roles;

public class RoleDto
{
  public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedDate { get; set; }
    public int UserCount { get; set; }
}

public class CreateRoleDto
{
  public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class UpdateRoleDto
{
    public string Name { get; set; } = string.Empty;
  public string? Description { get; set; }
}

public class UserRoleDto
{
    public string UserId { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
}

public class UsersInRoleDto
{
    public string RoleId { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public List<RoleUserDto> Users { get; set; } = new();
}

public class RoleUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? FullName { get; set; }
}
