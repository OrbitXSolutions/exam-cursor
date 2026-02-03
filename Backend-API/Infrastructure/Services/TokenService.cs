using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Entities;

namespace Smart_Core.Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

 public TokenService(IConfiguration configuration)
 {
        _configuration = configuration;
    }

  public string GenerateAccessToken(ApplicationUser user, IList<string> roles)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!));
     var credentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256);

  var claims = new List<Claim>
    {
            new(ClaimTypes.NameIdentifier, user.Id),
          new(ClaimTypes.Email, user.Email!),
    new(ClaimTypes.Name, user.DisplayName ?? user.Email!),
    new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Sub, user.Id)
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

 var expirationHours = double.Parse(jwtSettings["AccessTokenExpirationHours"] ?? "1");
        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
          audience: jwtSettings["Audience"],
            claims: claims,
          expires: DateTime.UtcNow.AddHours(expirationHours),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
  var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public Task<(string? userId, string? email)> ValidateAccessTokenAsync(string token)
    {
     var jwtSettings = _configuration.GetSection("JwtSettings");
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!);

        try
     {
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
         {
             ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
           ValidateIssuer = true,
   ValidIssuer = jwtSettings["Issuer"],
    ValidateAudience = true,
          ValidAudience = jwtSettings["Audience"],
       ValidateLifetime = false // We validate expired tokens for refresh
          }, out _);

     var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
   var email = principal.FindFirst(ClaimTypes.Email)?.Value;

       return Task.FromResult((userId, email))!;
  }
        catch
        {
        return Task.FromResult<(string?, string?)>((null, null));
        }
    }
}
