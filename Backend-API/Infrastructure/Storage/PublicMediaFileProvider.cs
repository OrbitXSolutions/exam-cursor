using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Primitives;

namespace Smart_Core.Infrastructure.Storage;

public sealed class PublicMediaFileProvider : IFileProvider, IDisposable
{
    private readonly PhysicalFileProvider _inner;
    private static readonly HashSet<string> PublicExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".pdf"
    };

    public PublicMediaFileProvider(string root)
    {
        _inner = new PhysicalFileProvider(root);
    }

    public IFileInfo GetFileInfo(string subpath)
    {
        // Filter at the filesystem boundary: repeated slashes/backslashes must
        // not bypass the private recording directory's authorized API.
        var segments = subpath.Replace('\\', '/').Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (!PublicExtensions.Contains(Path.GetExtension(subpath)) ||
            segments.Any(segment => segment is "." or ".." || segment.EndsWith('.') ||
                segment.EndsWith(' ') || segment.Contains(':') ||
                System.Text.RegularExpressions.Regex.IsMatch(segment, @"^[^~]{1,6}~[0-9]+(?:\.[^.]*)?$")) ||
            (segments.Length > 0 && (segments[0].Equals("video-chunks", StringComparison.OrdinalIgnoreCase) ||
                segments[0].Equals("proctor-snapshots", StringComparison.OrdinalIgnoreCase))))
            return new NotFoundFileInfo(subpath);
        return _inner.GetFileInfo(subpath);
    }

    public IDirectoryContents GetDirectoryContents(string subpath) => NotFoundDirectoryContents.Singleton;
    public IChangeToken Watch(string filter) => _inner.Watch(filter);
    public void Dispose() => _inner.Dispose();
}
