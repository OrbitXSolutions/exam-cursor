using System.Data;
using System.Reflection;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Infrastructure.Data;

namespace Backend_API.Tests;

public sealed class SqlServerWorkerLockTests
{
    [Fact]
    public async Task NonSqlServerContextFailsBeforeDoingAnyWork()
    {
        await using var db = new ApplicationDbContext(new DbContextOptions<ApplicationDbContext>());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            WorkerLease.TryAcquireAsync(db, "test-resource"));
    }

    [Fact]
    public async Task RetryingExecutionStrategyIsRejectedBeforeConnecting()
    {
        await using var db = new ApplicationDbContext(
            new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlServer("Server=unused.invalid;Database=regression;Integrated Security=true",
                    sql => sql.EnableRetryOnFailure())
                .Options);

        var error = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            WorkerLease.TryAcquireAsync(db, "test-resource"));

        Assert.Contains("non-retrying", error.Message);
        Assert.Equal(ConnectionState.Closed, db.Database.GetDbConnection().State);
    }

    [SqlServerFact]
    [Trait("Category", "SqlServer")]
    public async Task TwoServersCannotAcquireSameResourceUntilFirstReleasesIt()
    {
        var resource = "Regression:exclusive:" + Guid.NewGuid().ToString("N");
        await using var firstDb = Database();
        await using var secondDb = Database();
        await using var first = await WorkerLease.TryAcquireAsync(firstDb, resource);
        Assert.NotNull(first);
        await first.EnsureHeldAsync();

        await using var second = await WorkerLease.TryAcquireAsync(secondDb, resource);
        Assert.Null(second);
        await first.EnsureHeldAsync();
        var connectionSettings = new SqlConnectionStringBuilder(firstDb.Database.GetDbConnection().ConnectionString);
        Assert.False(connectionSettings.Pooling);
        Assert.Equal(0, connectionSettings.ConnectRetryCount);

        await first.DisposeAsync();
        await using var thirdDb = Database();
        await using var third = await WorkerLease.TryAcquireAsync(thirdDb, resource);
        Assert.NotNull(third);
        await third.EnsureHeldAsync();
    }

    [SqlServerFact]
    [Trait("Category", "SqlServer")]
    public async Task DifferentWorkerResourcesCanRunConcurrently()
    {
        var resource = "Regression:independent:" + Guid.NewGuid().ToString("N");
        await using var firstDb = Database();
        await using var secondDb = Database();
        await using var first = await WorkerLease.TryAcquireAsync(firstDb, resource + ":notifications");
        await using var second = await WorkerLease.TryAcquireAsync(secondDb, resource + ":expiry");

        Assert.NotNull(first);
        Assert.NotNull(second);
        await first.EnsureHeldAsync();
        await second.EnsureHeldAsync();
    }

    [SqlServerFact]
    [Trait("Category", "SqlServer")]
    public async Task LosingSqlSessionFailsOwnershipCheckAndReleasesLock()
    {
        var resource = "Regression:disconnect:" + Guid.NewGuid().ToString("N");
        await using var firstDb = Database();
        await using var first = await WorkerLease.TryAcquireAsync(firstDb, resource);
        Assert.NotNull(first);
        await firstDb.Database.CloseConnectionAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() => first.EnsureHeldAsync());

        await using var secondDb = Database();
        await using var second = await WorkerLease.TryAcquireAsync(secondDb, resource);
        Assert.NotNull(second);
        await second.EnsureHeldAsync();
    }

    [SqlServerFact]
    [Trait("Category", "SqlServer")]
    public async Task AlreadyOpenConnectionIsRejectedWithoutTakingLock()
    {
        await using var db = Database();
        await db.Database.OpenConnectionAsync();

        var error = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            WorkerLease.TryAcquireAsync(db, "Regression:open:" + Guid.NewGuid().ToString("N")));

        Assert.Contains("fresh", error.Message);
    }

    private static ApplicationDbContext Database() =>
        new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(SqlServerFactAttribute.ConnectionString)
            .Options);

    // The lock is intentionally an internal implementation detail, not a public testing API.
    private sealed class WorkerLease(object lease) : IAsyncDisposable
    {
        private static readonly Type LockType = typeof(ApplicationDbContext).Assembly.GetType(
            "Smart_Core.Infrastructure.Services.Background.SqlServerWorkerLock", throwOnError: true)!;

        public static async Task<WorkerLease?> TryAcquireAsync(ApplicationDbContext db, string resource)
        {
            var task = (Task)LockType.GetMethod("TryAcquireAsync", BindingFlags.Public | BindingFlags.Static)!
                .Invoke(null, [db, resource, CancellationToken.None])!;
            await task;
            var result = task.GetType().GetProperty("Result")!.GetValue(task);
            return result == null ? null : new WorkerLease(result);
        }

        public Task EnsureHeldAsync() =>
            (Task)LockType.GetMethod("EnsureHeldAsync")!.Invoke(lease, [CancellationToken.None])!;

        public ValueTask DisposeAsync() => ((IAsyncDisposable)lease).DisposeAsync();
    }
}

public sealed class SqlServerFactAttribute : FactAttribute
{
    public static string? ConnectionString
    {
        get
        {
            var connectionString = Environment.GetEnvironmentVariable("TEST_SQLSERVER_CONNECTION");
            if (string.IsNullOrWhiteSpace(connectionString)) return null;
            var builder = new SqlConnectionStringBuilder(connectionString);
            if (Environment.GetEnvironmentVariable("TEST_SQLSERVER_PASSWORD") is { } password)
                builder.Password = password;
            return builder.ConnectionString;
        }
    }

    public SqlServerFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(ConnectionString))
            Skip = "Set TEST_SQLSERVER_CONNECTION to an isolated SQL Server Developer instance to run integration tests.";
    }
}
