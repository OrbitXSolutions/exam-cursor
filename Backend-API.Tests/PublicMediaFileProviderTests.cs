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
    public void PrivateRecordingsCannotBeResolvedThroughPublicProvider(string path)
    {
        var root = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Path.Combine(root, "video-chunks", "1"));
        File.WriteAllText(Path.Combine(root, "video-chunks", "1", "chunk.webm"), "test media");
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
