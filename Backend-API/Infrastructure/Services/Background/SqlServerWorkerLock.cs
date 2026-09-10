using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Background;

internal sealed class SqlServerWorkerLock : IAsyncDisposable
{
    private const int CommandTimeoutSeconds = 5;
    private readonly ApplicationDbContext _db;
    private readonly SqlConnection _connection;
    private readonly string _resource;
    private bool _acquired;
    private bool _disposed;

    private SqlServerWorkerLock(ApplicationDbContext db, SqlConnection connection, string resource)
    {
        _db = db;
        _connection = connection;
        _resource = resource;
    }

    public static async Task<SqlServerWorkerLock?> TryAcquireAsync(
        ApplicationDbContext db, string resource, CancellationToken ct)
    {
        if (!db.Database.IsSqlServer() || db.Database.GetDbConnection() is not SqlConnection connection)
            throw new InvalidOperationException("Background worker coordination requires SQL Server.");

        if (connection.State != ConnectionState.Closed || db.Database.CurrentTransaction != null
            || db.Database.CreateExecutionStrategy().RetriesOnFailure)
            throw new InvalidOperationException("Worker coordination requires a fresh, non-retrying database scope.");

        // A session lock must never survive in a pool or silently reconnect without its lock.
        var connectionSettings = new SqlConnectionStringBuilder(connection.ConnectionString)
        {
            Pooling = false,
            ConnectRetryCount = 0
        };
        connectionSettings.ConnectTimeout = connectionSettings.ConnectTimeout == 0
            ? 15 : Math.Min(connectionSettings.ConnectTimeout, 15);
        connection.ConnectionString = connectionSettings.ConnectionString;

        var lease = new SqlServerWorkerLock(db, connection, resource);
        try
        {
            await db.Database.OpenConnectionAsync(ct);
            await using var command = connection.CreateCommand();
            command.CommandTimeout = CommandTimeoutSeconds;
            command.CommandText = """
                DECLARE @result int;
                EXEC @result = sys.sp_getapplock
                    @Resource = @resource, @LockMode = 'Exclusive',
                    @LockOwner = 'Session', @LockTimeout = 0, @DbPrincipal = 'public';
                SELECT @result;
                """;
            command.Parameters.Add("@resource", SqlDbType.NVarChar, 255).Value = resource;
            var result = Convert.ToInt32(await command.ExecuteScalarAsync(ct));
            if (result >= 0)
            {
                lease._acquired = true;
                return lease;
            }

            await lease.DisposeAsync();
            if (result == -1)
                return null;

            ct.ThrowIfCancellationRequested();
            throw new InvalidOperationException($"SQL Server worker lock acquisition failed (code {result}).");
        }
        catch
        {
            await lease.DisposeAsync();
            throw;
        }
    }

    public async Task EnsureHeldAsync(CancellationToken ct)
    {
        if (_disposed || !_acquired || _connection.State != ConnectionState.Open)
            throw new InvalidOperationException("SQL Server worker lock session is no longer available.");

        await using var command = _connection.CreateCommand();
        command.CommandTimeout = CommandTimeoutSeconds;
        command.CommandText = "SELECT APPLOCK_MODE('public', @resource, 'Session');";
        command.Parameters.Add("@resource", SqlDbType.NVarChar, 255).Value = _resource;
        if (!string.Equals(await command.ExecuteScalarAsync(ct) as string, "Exclusive", StringComparison.Ordinal))
            throw new InvalidOperationException("SQL Server worker lock ownership was lost.");
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed)
            return;
        _disposed = true;

        try
        {
            if (_acquired && _connection.State == ConnectionState.Open)
            {
                using var releaseTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(CommandTimeoutSeconds));
                await using var command = _connection.CreateCommand();
                command.CommandTimeout = CommandTimeoutSeconds;
                command.CommandText = """
                    EXEC sys.sp_releaseapplock
                        @Resource = @resource, @LockOwner = 'Session', @DbPrincipal = 'public';
                    """;
                command.Parameters.Add("@resource", SqlDbType.NVarChar, 255).Value = _resource;
                await command.ExecuteNonQueryAsync(releaseTimeout.Token);
            }
        }
        catch (Exception ex) when (ex is SqlException or InvalidOperationException or OperationCanceledException)
        {
            // Connection disposal below is the fallback if explicit release fails.
        }
        finally
        {
            // Closing this non-pooled connection releases even an ambiguously acquired lock.
            try
            {
                await _db.Database.CloseConnectionAsync();
            }
            finally
            {
                await _connection.DisposeAsync();
            }
        }
    }
}
