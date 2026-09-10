namespace Smart_Core.Infrastructure.Storage;

public sealed class StoragePaths
{
    public string MediaPath { get; }
    public string OrganizationPath { get; }
    public string IdentityPath { get; }
    public string TutorialsPath { get; }
    public string LicenseDirectory { get; }

    public StoragePaths(IConfiguration configuration, IWebHostEnvironment environment)
    {
        MediaPath = Resolve("MediaStorage:Local:BasePath", "MediaStorage");
        OrganizationPath = Resolve("Storage:OrganizationPath", Path.Combine("wwwroot", "Organization"));
        IdentityPath = Resolve("Storage:IdentityPath", Path.Combine("wwwroot", "candidateIDs"));
        TutorialsPath = Resolve("Storage:TutorialsPath", Path.Combine("wwwroot", "tutorials"));
        LicenseDirectory = Resolve("License:Directory", "License");

        string Resolve(string key, string defaultPath)
        {
            var configuredPath = configuration[key];
            return Path.GetFullPath(
                string.IsNullOrWhiteSpace(configuredPath) ? defaultPath : configuredPath,
                environment.ContentRootPath);
        }
    }

    public static string ResolveRelativePath(string root, string relativePath)
    {
        var normalized = relativePath.Replace('\\', '/');
        if (string.IsNullOrWhiteSpace(normalized) || Path.IsPathRooted(normalized) ||
            normalized.Split('/').Any(segment => segment is "." or ".." || segment.Contains(':')))
            throw new ArgumentException("Storage paths must be relative and stay within their configured directory.", nameof(relativePath));

        var fullPath = Path.GetFullPath(normalized, root);
        var rootPrefix = Path.EndsInDirectorySeparator(root) ? root : root + Path.DirectorySeparatorChar;
        var comparison = OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
        if (!fullPath.StartsWith(rootPrefix, comparison))
            throw new ArgumentException("Storage paths must stay within their configured directory.", nameof(relativePath));

        return fullPath;
    }
}
