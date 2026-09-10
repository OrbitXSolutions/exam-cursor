using Smart_Core.Infrastructure.Storage;

namespace Backend_API.Tests;

public sealed class StoragePathsTests
{
    [Fact]
    public void DefaultsResolveAgainstContentRootRatherThanWorkingDirectory()
    {
        var environment = new TestEnvironment();
        var paths = new StoragePaths(TestEnvironment.Configuration(), environment);

        Assert.Equal(Path.Combine(environment.ContentRootPath, "MediaStorage"), paths.MediaPath);
        Assert.Equal(Path.Combine(environment.ContentRootPath, "wwwroot", "Organization"), paths.OrganizationPath);
        Assert.Equal(Path.Combine(environment.ContentRootPath, "wwwroot", "candidateIDs"), paths.IdentityPath);
        Assert.Equal(Path.Combine(environment.ContentRootPath, "wwwroot", "tutorials"), paths.TutorialsPath);
        Assert.Equal(Path.Combine(environment.ContentRootPath, "License"), paths.LicenseDirectory);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void EveryStorageOverrideResolvesConsistently(bool absolute)
    {
        var environment = new TestEnvironment();
        var configured = absolute ? Path.GetFullPath("shared-files") : "shared-files";
        var configuration = TestEnvironment.Configuration(new()
        {
            ["MediaStorage:Local:BasePath"] = configured,
            ["Storage:OrganizationPath"] = configured,
            ["Storage:IdentityPath"] = configured,
            ["Storage:TutorialsPath"] = configured,
            ["License:Directory"] = configured
        });
        var paths = new StoragePaths(configuration, environment);
        var expected = Path.GetFullPath(configured, environment.ContentRootPath);

        Assert.All(new[] { paths.MediaPath, paths.OrganizationPath, paths.IdentityPath,
            paths.TutorialsPath, paths.LicenseDirectory }, actual => Assert.Equal(expected, actual));
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void BlankConfigurationUsesDefault(string value)
    {
        var environment = new TestEnvironment();
        var paths = new StoragePaths(TestEnvironment.Configuration(new()
        {
            ["Storage:IdentityPath"] = value
        }), environment);

        Assert.Equal(Path.Combine(environment.ContentRootPath, "wwwroot", "candidateIDs"), paths.IdentityPath);
    }

    [Theory]
    [InlineData("candidate/identity.jpg")]
    [InlineData("candidate\\identity.jpg")]
    public void RelativeResolutionNormalizesSeparatorsInsideConfiguredRoot(string relativePath)
    {
        var root = Path.GetFullPath("shared-files");
        Assert.Equal(Path.Combine(root, "candidate", "identity.jpg"),
            StoragePaths.ResolveRelativePath(root, relativePath));
        Assert.Equal(Path.Combine(root, "candidate", "identity.jpg"),
            StoragePaths.ResolveRelativePath(root + Path.DirectorySeparatorChar, relativePath));
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("../private.txt")]
    [InlineData("candidate/../../private.txt")]
    [InlineData("candidate\\..\\private.txt")]
    [InlineData("./identity.jpg")]
    [InlineData("/rooted.txt")]
    [InlineData("\\rooted.txt")]
    [InlineData("C:\\private.txt")]
    [InlineData("identity.jpg:stream")]
    public void RelativeResolutionRejectsTraversalRootedPathsAndAlternateStreams(string relativePath)
    {
        Assert.Throws<ArgumentException>(() =>
            StoragePaths.ResolveRelativePath(Path.GetFullPath("shared-files"), relativePath));
    }
}
