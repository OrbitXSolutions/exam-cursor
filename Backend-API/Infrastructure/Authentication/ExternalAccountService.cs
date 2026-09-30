using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Auth;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Entities;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Authentication;

public sealed class ExternalAccountService(ApplicationDbContext db, UserManager<ApplicationUser> users,
    SignInManager<ApplicationUser> signIn, IAuthService auth)
{
    public Task<ApplicationUser?> FindAsync(ExternalIdentity identity) => identity.Provider == "uaepass"
        ? db.Users.IgnoreQueryFilters().SingleOrDefaultAsync(u => u.UaePassIssuer == identity.Issuer && u.UaePassSubject == identity.Subject)
        : db.Users.IgnoreQueryFilters().SingleOrDefaultAsync(u => u.GovernmentIssuer == identity.Issuer && u.GovernmentSubject == identity.Subject);

    public async Task<ApiResponse<TokenResponseDto>> CompleteAsync(ExternalIdentity identity)
    {
        var user = await FindAsync(identity);
        return user == null ? Fail("Link your existing corporate account to continue.") :
            await auth.SignInExistingUserAsync(user.Id);
    }

    public async Task<ApiResponse<TokenResponseDto>> LinkAsync(ExternalIdentity identity, string account, string password)
    {
        if (await FindAsync(identity) != null) return Fail("This identity is already linked. Please sign in again.");
        // Neither personal email matching nor a JWT from a different account proves ownership.
        var user = await users.FindByEmailAsync(account.Trim()) ?? await users.FindByNameAsync(account.Trim());
        if (user == null) return Fail("No matching corporate account was found. Please contact the support team.");
        if (user.IsDeleted || user.IsBlocked || user.Status != UserStatus.Active || user.TwoFactorEnabled)
            return Fail("Your account is unavailable. Please contact support.");
        var proof = await signIn.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);
        if (!proof.Succeeded) return Fail(proof.IsLockedOut
            ? "Account locked out. Please try again later." : "Invalid corporate account or password.");
        if (identity.Provider == "uaepass" ? user.UaePassSubject != null : user.GovernmentSubject != null)
            return Fail("This corporate account is already linked to another identity. Please contact support.");

        await using var transaction = await db.Database.BeginTransactionAsync();
        try
        {
            if (identity.Provider == "uaepass")
            {
                user.UaePassIssuer = identity.Issuer;
                user.UaePassSubject = identity.Subject;
                user.UaePassLinkedAt = DateTimeOffset.UtcNow;
            }
            else
            {
                user.GovernmentIssuer = identity.Issuer;
                user.GovernmentSubject = identity.Subject;
                user.GovernmentLinkedAt = DateTimeOffset.UtcNow;
            }
            // Identity's concurrency stamp prevents two identities overwriting the same
            // account; the SQL unique index prevents one identity linking two accounts.
            if (!(await users.UpdateAsync(user)).Succeeded)
                return Fail("The account changed during linking. Please sign in again.");
            var result = await auth.SignInExistingUserAsync(user.Id);
            if (!result.Success) return result;
            await transaction.CommitAsync();
            return result;
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException sql && sql.Number is 2601 or 2627)
        {
            return Fail("This identity is already linked. Please sign in again.");
        }
    }

    private static ApiResponse<TokenResponseDto> Fail(string message) => ApiResponse<TokenResponseDto>.FailureResponse(message);
}
