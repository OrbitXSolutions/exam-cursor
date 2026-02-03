using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities;

public class Department : BaseEntity
{
    public int Id { get; set; }
  public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
 public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public string? Code { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>();
}
