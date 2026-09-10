using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace Backend_API.Tests;

internal sealed class TestEnvironment : IWebHostEnvironment
{
    public string ApplicationName { get; set; } = "BackendRegressionTests";
    public string EnvironmentName { get; set; } = Environments.Production;
    public string ContentRootPath { get; set; } = Path.GetFullPath("test-content-root");
    public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    public string WebRootPath { get; set; } = Path.GetFullPath("test-content-root/wwwroot");
    public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();

    public static IConfiguration Configuration(Dictionary<string, string?>? values = null) =>
        new ConfigurationBuilder().AddInMemoryCollection(values ?? []).Build();
}
