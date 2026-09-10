using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Primitives;

namespace Smart_Core.Infrastructure.Storage;

public sealed class PublicMediaFileProvider : IFileProvider, IDisposable
{
    private readonly PhysicalFileProvider _inner;

    public PublicMediaFileProvider(string root)
    {
        _inner = new PhysicalFileProvider(root);
    }

    public IFileInfo GetFileInfo(string subpath)
    {
        // Filter at the filesystem boundary: repeated slashes/backslashes must
        // not bypass the private recording directory's authorized API.
        var segments = subpath.Replace('\\', '/').Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Any(segment => segment is "." or "..") ||
            (segments.Length > 0 && segments[0].Equals("video-chunks", StringComparison.OrdinalIgnoreCase)))
            return new NotFoundFileInfo(subpath);
        return _inner.GetFileInfo(subpath);
    }

    public IDirectoryContents GetDirectoryContents(string subpath) => NotFoundDirectoryContents.Singleton;
    public IChangeToken Watch(string filter) => _inner.Watch(filter);
    public void Dispose() => _inner.Dispose();
}
