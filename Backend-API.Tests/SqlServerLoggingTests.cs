using System.Text.Json;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using Smart_Core.Application.DTOs.Logs;
using Smart_Core.Domain.Entities.Logs;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;
using Smart_Core.Infrastructure.Services.Logs;
using Smart_Core.Migrations;

namespace Backend_API.Tests;

public sealed class SqlServerLoggingTests
{
    [SqlServerFact]
    [Trait("Category", "SqlServer")]
    public async Task MigratedSqlSchemaPersistsMetadataAndOtherServerReadsWithoutHistoricalPayloads()
    {
        var settings = new SqlConnectionStringBuilder(SqlServerFactAttribute.ConnectionString)
        {
            InitialCatalog = "RegressionLogs_" + Guid.NewGuid().ToString("N"),
            Pooling = false
        };
        var dbOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(settings.ConnectionString).Options;
        await using var database = new ApplicationDbContext(dbOptions);
        try
        {
            await database.GetService<IRelationalDatabaseCreator>().CreateAsync();
            var generator = database.GetService<IMigrationsSqlGenerator>();
            var operations = new AddSystemLogsTable().UpOperations
                .Concat(new UseUaeDateTimeOffset().UpOperations
                    .OfType<AlterColumnOperation>()
                    .Where(operation => operation.Table == "SystemLogs"))
                .ToList();
            foreach (var command in generator.Generate(operations, database.GetService<IDesignTimeModel>().Model))
                await database.Database.ExecuteSqlRawAsync(command.CommandText);

            var configuration = TestEnvironment.Configuration(new()
            {
                ["SystemLogging:FlushIntervalSeconds"] = "1",
                ["SystemLogging:BatchSize"] = "5",
                ["SystemLogging:PersistenceTimeoutSeconds"] = "5"
            });
            var channel = new SystemLogChannel(configuration);
            await using var services = new ServiceCollection()
                .AddScoped(_ => new ApplicationDbContext(dbOptions))
                .BuildServiceProvider();
            var logger = new RecordingLogger<LogPersistenceService>();
            using var worker = new LogPersistenceService(channel,
                services.GetRequiredService<IServiceScopeFactory>(), configuration, logger);
            channel.TryWrite(new SystemLog
            {
                Category = LogCategory.Candidate, Level = SystemLogLevel.Info,
                Action = "POST Attempt", UserId = "candidate-id",
                Endpoint = "/api/attempts/{id}", ResponseStatusCode = 200,
                RequestBody = "private-queued-payload"
            });
            await worker.StartAsync(CancellationToken.None);
            try
            {
                using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(20));
                while (!await database.SystemLogs.AnyAsync(timeout.Token))
                    await Task.Delay(100, timeout.Token);
            }
            finally
            {
                using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                await worker.StopAsync(timeout.Token);
            }

            Assert.Empty(logger.Entries);
            var persisted = await database.SystemLogs.AsNoTracking().SingleAsync();
            Assert.Null(persisted.RequestBody);
            Assert.Equal(TimeSpan.FromHours(4), persisted.Timestamp.Offset);

            var historical = new SystemLog
            {
                Timestamp = DateTimeOffset.UtcNow,
                Category = LogCategory.Developer,
                Level = SystemLogLevel.Error,
                Action = "POST Historical",
                ResponseStatusCode = 500,
                RequestBody = "private-historical-request",
                ResponseBody = "private-historical-response",
                ErrorMessage = "private-historical-error",
                StackTrace = "private-historical-stack",
                UserDisplayName = "private-historical-name",
                IpAddress = "192.0.2.1",
                UserAgent = "private-historical-agent"
            };
            database.SystemLogs.Add(historical);
            await database.SaveChangesAsync();

            await using var otherServer = new ApplicationDbContext(dbOptions);
            var service = new SystemLogService(otherServer);
            var page = await service.GetLogsAsync(LogCategory.Candidate, new SystemLogFilterDto());
            Assert.Equal(1, page.TotalCount);
            Assert.Equal("POST Attempt", Assert.Single(page.Items).Action);
            var detail = await service.GetDetailAsync(historical.Id);
            Assert.NotNull(detail);
            Assert.Null(detail.RequestBody);
            Assert.Null(detail.ResponseBody);
            Assert.Null(detail.StackTrace);
            Assert.Null(detail.UserDisplayName);
            Assert.Null(detail.UserAgent);
            Assert.Null(detail.IpAddress);
            Assert.DoesNotContain("private-", JsonSerializer.Serialize(detail));
            var errors = await service.GetAppErrorsAsync(new AppLogFilterDto());
            Assert.Single(errors.Items);
            Assert.DoesNotContain("private-", JsonSerializer.Serialize(errors));
            var stats = await service.GetStatsAsync();
            Assert.Equal(1, stats.CandidateCount);
            Assert.Equal(1, stats.DeveloperCount);
            Assert.Equal(1, stats.ErrorCount);
        }
        finally
        {
            await database.Database.EnsureDeletedAsync();
        }
    }
}
