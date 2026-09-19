using Microsoft.EntityFrameworkCore;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Authorization;

public static class CandidateAssignmentPolicy
{
    public const string DeniedMessage = "You are not assigned to this exam";

    public static Task<bool> CanStartAsync(ApplicationDbContext context, int examId,
        bool restrictToAssignedCandidates, string candidateId)
    {
        if (!restrictToAssignedCandidates)
            return Task.FromResult(true);

        return context.ExamAssignments.AnyAsync(a => a.ExamId == examId &&
            a.CandidateId == candidateId && a.IsActive && !a.IsDeleted);
    }
}
