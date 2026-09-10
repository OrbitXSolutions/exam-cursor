namespace Smart_Core.Infrastructure.Storage;

public static class ImageUploadValidator
{
    public static async Task<string?> GetSafeExtensionAsync(
        IFormFile file, bool allowWebP = false, bool allowIcon = false,
        CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var contentType = file.ContentType.ToLowerInvariant();
        var safeExtension = (extension, contentType) switch
        {
            (".jpg" or ".jpeg", "image/jpeg") => ".jpg",
            (".png", "image/png") => ".png",
            (".webp", "image/webp") when allowWebP => ".webp",
            (".ico", "image/x-icon" or "image/vnd.microsoft.icon") when allowIcon => ".ico",
            _ => null
        };
        if (safeExtension == null || file.Length == 0)
            return null;

        var header = new byte[12];
        await using var stream = file.OpenReadStream();
        var count = await stream.ReadAtLeastAsync(header, header.Length, throwOnEndOfStream: false, cancellationToken);

        // Inspect file bytes as well as the untrusted filename and MIME type.
        var valid = safeExtension switch
        {
            ".jpg" => count >= 4 && header[0] == 0xff && header[1] == 0xd8 && header[2] == 0xff,
            ".png" => count >= 8 && header.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }),
            ".webp" => count >= 12 && header.AsSpan(0, 4).SequenceEqual("RIFF"u8) &&
                header.AsSpan(8, 4).SequenceEqual("WEBP"u8),
            ".ico" => count >= 6 && header[0] == 0 && header[1] == 0 &&
                header[2] == 1 && header[3] == 0 && (header[4] != 0 || header[5] != 0),
            _ => false
        };
        return valid ? safeExtension : null;
    }
}
