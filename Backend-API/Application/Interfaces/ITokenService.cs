using Smart_Core.Domain.Entities;

namespace Smart_Core.Application.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(ApplicationUser user, IList<string> roles);
    string GenerateRefreshToken();
    Task<(string? userId, string? email)> ValidateAccessTokenAsync(string token);
}
