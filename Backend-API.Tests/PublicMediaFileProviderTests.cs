using Smart_Core.Infrastructure.Storage;

namespace Backend_API.Tests;

public sealed class PublicMediaFileProviderTests
{
    [Theory]
    [InlineData("video-chunks/1/chunk.webm")]
    [InlineData("/video-chunks/1/chunk.webm")]
    [InlineData("//video-chunks/1/chunk.webm")]
    [InlineData("\\video-chunks\\1\\chunk.webm")]
    [InlineData("VIDEO-CHUNKS/1/chunk.webm")]
    [InlineData("public/../video-chunks/1/chunk.webm")]
    [InlineData("./video-chunks/1/chunk.webm")]
    [InlineData("video-chunks./1/chunk.webm")]
    [InlineData("video-chunks /1/chunk.webm")]
    [InlineData("VIDEO-~1/1/chunk.webm")]
    [InlineData("video-chunks/1/chunk.webm::$DATA")]
    [InlineData("proctor-snapshots/1/snapshot.png")]
    [InlineData("/proctor-snapshots/1/snapshot.png")]
    [InlineData("//proctor-snapshots/1/snapshot.png")]
    [InlineData("\\proctor-snapshots\\1\\snapshot.png")]
    [InlineData("PROCTOR-SNAPSHOTS/1/snapshot.png")]
    [InlineData("public/../proctor-snapshots/1/snapshot.png")]
    [InlineData("./proctor-snapshots/1/snapshot.png")]
    [InlineData("proctor-snapshots./1/snapshot.png")]
    [InlineData("proctor-snapshots /1/snapshot.png")]
    [InlineData("PROCTO~1/1/snapshot.png")]
    [InlineData("procto~1/1/snapshot.png")]
    public void PrivateRecordingsCannotBeResolvedThroughPublicProvider(string path)
    {
        var root = Path.Combine(AppContext.BaseDirectory, "public-media-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Path.Combine(root, "video-chunks", "1"));
        File.WriteAllText(Path.Combine(root, "video-chunks", "1", "chunk.webm"), "test media");
        Directory.CreateDirectory(Path.Combine(root, "proctor-snapshots", "1"));
        File.WriteAllText(Path.Combine(root, "proctor-snapshots", "1", "snapshot.png"), "test private image");
        // A real directory makes this test meaningful even on volumes without 8.3 aliases.
        // Requests using short-name syntax must never resolve through the public provider.
        Directory.CreateDirectory(Path.Combine(root, "PROCTO~1", "1"));
        File.WriteAllText(Path.Combine(root, "PROCTO~1", "1", "snapshot.png"), "test private alias");
        File.WriteAllText(Path.Combine(root, "public.png"), "test public asset");
        try
        {
            using var provider = new PublicMediaFileProvider(root);
            Assert.False(provider.GetFileInfo(path).Exists);
            Assert.True(provider.GetFileInfo("/public.png").Exists);
            Assert.False(provider.GetDirectoryContents("/").Exists);
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }
}
