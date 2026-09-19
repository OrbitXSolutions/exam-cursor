using Microsoft.EntityFrameworkCore;
using Smart_Core.Domain.Entities.Proctor;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Authorization;

public static class CandidateIdentityPolicy
{
    public const string DeniedMessage = "Approved identity verification is required before starting this exam";

    public static async Task<bool> CanStartAsync(ApplicationDbContext context, bool required, string candidateId)
    {
        if (!required) return true;
        var status = await context.Set<IdentityVerification>()
            .Where(v => v.CandidateId == candidateId && !v.IsDeleted)
            .OrderByDescending(v => v.SubmittedAt).ThenByDescending(v => v.Id)
            .Select(v => (IdentityVerificationStatus?)v.Status).FirstOrDefaultAsync();
        return status == IdentityVerificationStatus.Approved;
    }
}
