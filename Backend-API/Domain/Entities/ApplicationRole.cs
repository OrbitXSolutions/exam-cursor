using Microsoft.AspNetCore.Identity;
using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities;

public class ApplicationRole : IdentityRole
{
    public string? Description { get; set; }
    public DateTimeOffset CreatedDate { get; set; } = UaeTimeHelper.NowUae;
    public DateTimeOffset? UpdatedDate { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; } = false;
}
