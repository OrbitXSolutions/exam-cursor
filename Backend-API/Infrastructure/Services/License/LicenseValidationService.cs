using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Smart_Core.Application.DTOs.License;
using Smart_Core.Application.Interfaces.License;
using Smart_Core.Domain.Enums;
using Smart_Core.Domain.Models;

namespace Smart_Core.Infrastructure.Services.License;

public class LicenseValidationService : ILicenseValidationService
{
    private readonly string _licenseFilePath;
    private readonly string _publicKeyPath;
    private readonly ILogger<LicenseValidationService> _logger;
    private readonly object _lock = new();

    private LicenseStatusResult _cachedStatus;
    private DateTime _lastChecked = DateTime.MinValue;

    private const int WarningDaysBeforeExpiry = 40;

    public LicenseValidationService(IWebHostEnvironment env, ILogger<LicenseValidationService> logger)
    {
        var licenseDir = Path.Combine(env.ContentRootPath, "License");
        _licenseFilePath = Path.Combine(licenseDir, "license.json");
        _publicKeyPath = Path.Combine(licenseDir, "public.pem");
        _logger = logger;

        // Initial validation on startup
        _cachedStatus = Validate();
        _lastChecked = DateTime.UtcNow;
        _logger.LogInformation("License validation on startup: State={State}, Message={Message}",
            _cachedStatus.State, _cachedStatus.Message);
    }

    public LicenseStatusResult GetLicenseStatus()
    {
        RefreshIfStale();
        lock (_lock)
        {
            return _cachedStatus;
        }
    }

    public LicenseState GetCurrentState()
    {
        RefreshIfStale();
        lock (_lock)
        {
            return _cachedStatus.State;
        }
    }

    public void ReloadLicense()
    {
        var previousState = _cachedStatus.State;
        var newStatus = Validate();

        lock (_lock)
        {
            _cachedStatus = newStatus;
            _lastChecked = DateTime.UtcNow;
        }

        if (previousState != newStatus.State)
        {
            _logger.LogWarning("License state changed: {OldState} → {NewState}. {Message}",
                previousState, newStatus.State, newStatus.Message);
        }

        _logger.LogInformation("License reloaded: State={State}, Message={Message}",
            newStatus.State, newStatus.Message);
    }

    /// <summary>
    /// Check domain binding against the current request host.
    /// Returns true if domain matches or no license is loaded.
    /// </summary>
    public bool IsDomainValid(string requestHost)
    {
        lock (_lock)
        {
            if (_cachedStatus.State == LicenseState.Missing || _cachedStatus.State == LicenseState.Invalid)
                return true; // No blocking for missing/invalid

            if (string.IsNullOrEmpty(_cachedStatus.LicensedDomain))
                return true;

            var host = requestHost.Split(':')[0].Trim().ToLowerInvariant();
            var licensedDomain = _cachedStatus.LicensedDomain.Trim().ToLowerInvariant();

            return string.Equals(host, licensedDomain, StringComparison.OrdinalIgnoreCase);
        }
    }

    private void RefreshIfStale()
    {
        // Auto-refresh cache if older than 24 hours
        if ((DateTime.UtcNow - _lastChecked).TotalHours >= 24)
        {
            ReloadLicense();
        }
    }

    private LicenseStatusResult Validate()
    {
        try
        {
            // 1. Check file exists
            if (!File.Exists(_licenseFilePath))
            {
                _logger.LogWarning("License file not found at {Path}", _licenseFilePath);
                return new LicenseStatusResult
                {
                    State = LicenseState.Missing,
                    Message = "No license file found."
                };
            }

            // 2. Check public key exists
            if (!File.Exists(_publicKeyPath))
            {
                _logger.LogWarning("Public key file not found at {Path}", _publicKeyPath);
                return new LicenseStatusResult
                {
                    State = LicenseState.Invalid,
                    Message = "License public key not found."
                };
            }

            // 3. Deserialize license
            var json = File.ReadAllText(_licenseFilePath);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var license = JsonSerializer.Deserialize<LicenseData>(json, options);

            if (license == null)
            {
                return new LicenseStatusResult
                {
                    State = LicenseState.Invalid,
                    Message = "License file is empty or malformed."
                };
            }

            // 4. Verify RSA signature
            if (!VerifySignature(license))
            {
                _logger.LogWarning("License signature verification failed — possible tampering");
                return new LicenseStatusResult
                {
                    State = LicenseState.Invalid,
                    Message = "License signature is invalid. The license file may have been tampered with."
                };
            }

            // 5. Clock rollback check
            if (DateTime.UtcNow < license.IssuedAt.ToUniversalTime().AddHours(-1))
            {
                _logger.LogWarning("Clock rollback detected. Current UTC={Now}, IssuedAt={IssuedAt}",
                    DateTime.UtcNow, license.IssuedAt);
                return new LicenseStatusResult
                {
                    State = LicenseState.Invalid,
                    Message = "System clock appears to be set incorrectly."
                };
            }

            // 6. Calculate expiry state
            var now = DateTime.UtcNow;
            var expiresAt = license.ExpiresAt.ToUniversalTime();
            var daysUntilExpiry = (expiresAt - now).TotalDays;
            var gracePeriodDays = license.GracePeriodDays > 0 ? license.GracePeriodDays : 30;

            var baseResult = new LicenseStatusResult
            {
                CustomerName = license.CustomerName,
                LicenseType = license.LicenseType,
                IssuedAt = license.IssuedAt,
                ExpiresAt = license.ExpiresAt,
                MaxUsers = license.MaxUsers,
                LicensedDomain = license.LicensedDomain,
                GracePeriodDays = gracePeriodDays,
                DaysRemaining = (int)Math.Ceiling(daysUntilExpiry)
            };

            if (daysUntilExpiry < -gracePeriodDays)
            {
                // Past grace period — Expired (read-only)
                baseResult.State = LicenseState.Expired;
                baseResult.GraceDaysRemaining = 0;
                baseResult.Message = "License expired and grace period has ended. System is in read-only mode.";
            }
            else if (daysUntilExpiry < 0)
            {
                // Within grace period
                var graceDaysRemaining = gracePeriodDays + (int)Math.Ceiling(daysUntilExpiry);
                baseResult.State = LicenseState.GracePeriod;
                baseResult.GraceDaysRemaining = graceDaysRemaining;
                baseResult.Message = $"License expired. Grace period: {graceDaysRemaining} days remaining.";
            }
            else if (daysUntilExpiry <= WarningDaysBeforeExpiry)
            {
                // Within warning period
                baseResult.State = LicenseState.Warning;
                baseResult.Message = $"License expires in {(int)Math.Ceiling(daysUntilExpiry)} days.";
            }
            else
            {
                // Active
                baseResult.State = LicenseState.Active;
                baseResult.Message = "License is active and valid.";
            }

            return baseResult;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse license file");
            return new LicenseStatusResult
            {
                State = LicenseState.Invalid,
                Message = "License file format is invalid."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during license validation");
            return new LicenseStatusResult
            {
                State = LicenseState.Invalid,
                Message = "An error occurred while validating the license."
            };
        }
    }

    private bool VerifySignature(LicenseData license)
    {
        try
        {
            var canonicalPayload = LicenseCanonicalBuilder.BuildCanonicalPayload(license);
            var payloadBytes = Encoding.UTF8.GetBytes(canonicalPayload);
            var signatureBytes = Convert.FromBase64String(license.Signature);

            var publicKeyPem = File.ReadAllText(_publicKeyPath);

            using var rsa = RSA.Create();
            rsa.ImportFromPem(publicKeyPem.ToCharArray());

            return rsa.VerifyData(payloadBytes, signatureBytes, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying license signature");
            return false;
        }
    }
}
