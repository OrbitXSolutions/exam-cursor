using Smart_Core.Application.DTOs.License;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.Interfaces.License;

public interface ILicenseValidationService
{
    LicenseStatusResult GetLicenseStatus();
    LicenseState GetCurrentState();
    void ReloadLicense();
}
