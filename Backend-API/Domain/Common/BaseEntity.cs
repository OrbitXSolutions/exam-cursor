namespace Smart_Core.Domain.Common;

public abstract class BaseEntity
{
    public DateTimeOffset CreatedDate { get; set; } = UaeTimeHelper.NowUae;
    public DateTimeOffset? UpdatedDate { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public string? DeletedBy { get; set; }
    public bool IsDeleted { get; set; } = false;
}
