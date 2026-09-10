using Smart_Core.Infrastructure.Services;

namespace Backend_API.Tests;

public sealed class CacheServiceTests
{
    [Fact]
    public void SetCannotMakeAnySubsequentReadReturnCachedState()
    {
        var cache = new CacheService();
        cache.Set("exam", "outdated", TimeSpan.FromHours(1));
        cache.Set("count", 42);

        Assert.Null(cache.Get<string>("exam"));
        Assert.Equal(0, cache.Get<int>("count"));
        Assert.False(cache.TryGet<string>("exam", out var value));
        Assert.Null(value);
        Assert.False(cache.TryGet<int>("count", out var count));
        Assert.Equal(0, count);
    }

    [Fact]
    public async Task ReadOnFirstServerSeesChangesMadeThroughSecondServer()
    {
        var firstServer = new CacheService();
        var secondServer = new CacheService();
        var authoritativeValue = "before update";
        Task<string> ReadDatabase() => Task.FromResult(authoritativeValue);

        Assert.Equal("before update", await firstServer.GetOrCreateAsync("exam:1", ReadDatabase));
        authoritativeValue = "after update";
        secondServer.Remove("exam:1");
        secondServer.RemoveByPrefix("exam:");

        Assert.Equal("after update", await firstServer.GetOrCreateAsync("exam:1", ReadDatabase));
        Assert.Equal("after update", await secondServer.GetOrCreateAsync("exam:1", ReadDatabase));
    }

    [Fact]
    public async Task FactoryRunsOnEveryCallRegardlessOfExpiration()
    {
        var cache = new CacheService();
        var calls = 0;

        for (var expected = 1; expected <= 3; expected++)
        {
            Assert.Equal(expected, await cache.GetOrCreateAsync(
                "same-key", () => Task.FromResult(++calls), TimeSpan.FromDays(1)));
        }

        Assert.Equal(3, calls);
    }

    [Fact]
    public async Task FactoryFailuresPropagateAndDoNotPoisonNextRead()
    {
        var cache = new CacheService();
        var failure = new InvalidOperationException("database unavailable");

        var observed = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            cache.GetOrCreateAsync("exam", () => Task.FromException<string>(failure)));
        Assert.Same(failure, observed);
        Assert.Equal("recovered", await cache.GetOrCreateAsync("exam", () => Task.FromResult("recovered")));
    }

    [Fact]
    public void SynchronousFactoryFailurePropagatesUnchanged()
    {
        var cache = new CacheService();
        var failure = new InvalidOperationException("factory failed before returning a task");

        var observed = Assert.Throws<InvalidOperationException>(() =>
        {
            _ = cache.GetOrCreateAsync<string>("exam", () => throw failure);
        });

        Assert.Same(failure, observed);
    }

    [Fact]
    public async Task ConcurrentReadsEachInvokeTheirOwnFactory()
    {
        var cache = new CacheService();
        var release = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var calls = 0;

        async Task<int> ReadDatabase()
        {
            var call = Interlocked.Increment(ref calls);
            await release.Task;
            return call;
        }

        var reads = Enumerable.Range(0, 8)
            .Select(_ => cache.GetOrCreateAsync("same-key", ReadDatabase))
            .ToArray();
        try
        {
            Assert.Equal(reads.Length, calls);
        }
        finally
        {
            release.SetResult();
        }

        Assert.Equal(Enumerable.Range(1, 8), (await Task.WhenAll(reads)).Order());
    }
}
