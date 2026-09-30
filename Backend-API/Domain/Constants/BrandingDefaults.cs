namespace Smart_Core.Domain.Constants;

/// <summary>Defaults shared by the existing organization/system branding settings.</summary>
public static class BrandingDefaults
{
    public const string Name = "Digital Dubai Exams";
    public const string LogoUrl = "/branding/digital-dubai.png";
    public const string FaviconUrl = "/branding/favicon.png";
    public const string FooterText = "Digital Dubai · Dubai Data and Statistics Establishment";
    // Accessible action color in the supplied E-Source cyan/blue identity family.
    public const string PrimaryColor = "#0076a8";

    public static string Effective(string? organization, string? system, string fallback) =>
        !string.IsNullOrWhiteSpace(organization) ? organization :
        !string.IsNullOrWhiteSpace(system) ? system : fallback;
}
