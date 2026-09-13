using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Entities.ExamResult;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;
using Smart_Core.Infrastructure.Services;
using Smart_Core.Infrastructure.Services.Authorization;
using Smart_Core.Infrastructure.Services.ExamResult;
using AttemptEntity = Smart_Core.Domain.Entities.Attempt.Attempt;

namespace Backend_API.Tests;

[Trait("Category", "SqlServer")]
public sealed class ResultSummaryConcurrencyTests : IAsyncLifetime
{
    private string? _connectionString;

    public async Task InitializeAsync()
    {
        if (SqlServerFactAttribute.ConnectionString is not { } connectionString) return;
        _connectionString = new SqlConnectionStringBuilder(connectionString)
        {
            InitialCatalog = "RegressionResultSummaries_" + Guid.NewGuid().ToString("N")
        }.ConnectionString;
        await using var db = Database();
        try
        {
            await db.Database.EnsureCreatedAsync();
        }
        catch
        {
            await db.Database.EnsureDeletedAsync();
            throw;
        }
    }

    public async Task DisposeAsync()
    {
        if (_connectionString == null) return;
        await using var db = Database();
        await db.Database.EnsureDeletedAsync();
    }

    [SqlServerFact]
    public async Task ConcurrentFirstRefreshAndReadRepairPersistExactlyOneSummary()
    {
        var seed = await SeedAsync();
        var pause = new PauseBeforeSummarySave();
        await using var firstDb = Database(pause);
        await using var secondDb = Database();
        await firstDb.Database.OpenConnectionAsync();
        await secondDb.Database.OpenConnectionAsync();

        var first = Service(firstDb, seed).RefreshCandidateExamSummaryAsync(seed.ExamId, seed.CandidateId, seed.CandidateId);
        await pause.Entered.Task.WaitAsync(TimeSpan.FromSeconds(15));
        var second = Service(secondDb, seed).GetCandidateExamSummaryAsync(seed.ExamId, seed.CandidateId);
        try
        {
            await WaitUntilCompletedOrBlockedAsync(second, firstDb, secondDb);
        }
        finally
        {
            pause.Release.TrySetResult();
        }

        await Task.WhenAll(first, second).WaitAsync(TimeSpan.FromSeconds(30));
        Assert.True(first.Result.Success, first.Result.Message);
        Assert.True(second.Result.Success, second.Result.Message);
        Assert.Equal(first.Result.Data!.Id, second.Result.Data!.Id);
        await AssertRankingAsync(seed);
    }

    [SqlServerFact]
    public async Task OverlappingExistingRefreshCannotOverwriteNewerAggregate()
    {
        var seed = await SeedAsync();
        await using (var setup = Database())
        {
            Assert.True((await Service(setup, seed).RefreshCandidateExamSummaryAsync(
                seed.ExamId, seed.CandidateId, seed.CandidateId)).Success);
            await setup.Results.Where(r => r.Id == seed.BestResultId)
                .ExecuteUpdateAsync(s => s.SetProperty(r => r.TotalScore, 85m));
        }

        var pause = new PauseBeforeSummarySave();
        await using var firstDb = Database(pause);
        await using var secondDb = Database();
        await firstDb.Database.OpenConnectionAsync();
        await secondDb.Database.OpenConnectionAsync();
        var first = Service(firstDb, seed).RefreshCandidateExamSummaryAsync(seed.ExamId, seed.CandidateId, seed.CandidateId);
        await pause.Entered.Task.WaitAsync(TimeSpan.FromSeconds(15));
        try
        {
            await using (var regrading = Database())
                await regrading.Results.Where(r => r.Id == seed.LatestResultId).ExecuteUpdateAsync(s => s
                    .SetProperty(r => r.TotalScore, 95m)
                    .SetProperty(r => r.IsPassed, true));

            var second = Service(secondDb, seed).RefreshCandidateExamSummaryAsync(seed.ExamId, seed.CandidateId, seed.CandidateId);
            await WaitUntilCompletedOrBlockedAsync(second, firstDb, secondDb);
            pause.Release.TrySetResult();
            await Task.WhenAll(first, second).WaitAsync(TimeSpan.FromSeconds(30));
            Assert.True(first.Result.Success, first.Result.Message);
            Assert.True(second.Result.Success, second.Result.Message);
        }
        finally
        {
            pause.Release.TrySetResult();
        }

        await using var verify = Database();
        var summary = await verify.CandidateExamSummaries.SingleAsync();
        Assert.Equal(3, summary.TotalAttempts);
        Assert.Equal(seed.LatestResultId, summary.BestResultId);
        Assert.Equal(seed.LatestAttemptId, summary.BestAttemptId);
        Assert.Equal(95m, summary.BestScore);
        Assert.True(summary.BestIsPassed);
        Assert.Equal(95m, summary.LatestScore);
        Assert.True(summary.LatestIsPassed);
        Assert.Equal(seed.LatestStartedAt, summary.LastAttemptAt);
    }

    [SqlServerFact]
    public async Task RefreshUsesPersistedResultsAndReloadsAlreadyTrackedSummary()
    {
        var seed = await SeedAsync();
        await using var staleDb = Database();
        var staleService = Service(staleDb, seed);
        Assert.True((await staleService.RefreshCandidateExamSummaryAsync(seed.ExamId, seed.CandidateId, seed.CandidateId)).Success);
        await staleDb.Results.Include(r => r.Attempt).ToListAsync();
        var trackedSummary = await staleDb.CandidateExamSummaries.SingleAsync();

        await using (var newerDb = Database())
        {
            await newerDb.Results.Where(r => r.Id == seed.LatestResultId).ExecuteUpdateAsync(s => s
                .SetProperty(r => r.TotalScore, 95m)
                .SetProperty(r => r.IsPassed, true));
            Assert.True((await Service(newerDb, seed).RefreshCandidateExamSummaryAsync(
                seed.ExamId, seed.CandidateId, seed.CandidateId)).Success);
        }

        var refreshed = await staleService.RefreshCandidateExamSummaryAsync(seed.ExamId, seed.CandidateId, seed.CandidateId);
        Assert.True(refreshed.Success, refreshed.Message);
        Assert.Equal(95m, refreshed.Data!.BestScore);
        Assert.Equal(95m, refreshed.Data.BestPercentage);
        Assert.Same(trackedSummary, await staleDb.CandidateExamSummaries.SingleAsync());

        // Change only the persisted summary, then restore the result scores. A stale
        // original-value snapshot must not suppress updates back to the correct values.
        await using (var newerDb = Database())
        {
            await newerDb.Results.Where(r => r.Id == seed.LatestResultId).ExecuteUpdateAsync(s => s
                .SetProperty(r => r.TotalScore, 20m)
                .SetProperty(r => r.IsPassed, false));
            Assert.True((await Service(newerDb, seed).RefreshCandidateExamSummaryAsync(
                seed.ExamId, seed.CandidateId, seed.CandidateId)).Success);
            await newerDb.Results.Where(r => r.Id == seed.LatestResultId).ExecuteUpdateAsync(s => s
                .SetProperty(r => r.TotalScore, 95m)
                .SetProperty(r => r.IsPassed, true));
        }

        Assert.True((await staleService.RefreshCandidateExamSummaryAsync(seed.ExamId, seed.CandidateId, seed.CandidateId)).Success);
        await using var verify = Database();
        var persisted = await verify.CandidateExamSummaries.SingleAsync();
        Assert.Equal(seed.LatestResultId, persisted.BestResultId);
        Assert.Equal(95m, persisted.BestScore);
        Assert.Equal(95m, persisted.LatestScore);
        Assert.True(persisted.BestIsPassed);
        Assert.True(persisted.LatestIsPassed);
    }

    [SqlServerFact]
    public async Task RefreshPreservesRankingAttemptRulesAndNoResultsBehavior()
    {
        var seed = await SeedAsync();
        await using var db = Database();
        var service = Service(db, seed);
        var response = await service.RefreshCandidateExamSummaryAsync(seed.ExamId, seed.CandidateId, seed.CandidateId);
        Assert.True(response.Success, response.Message);
        Assert.Equal(80m, response.Data!.BestPercentage);
        Assert.Equal(2, response.Data.RemainingAttempts);
        var original = await db.CandidateExamSummaries.SingleAsync();
        var createdAt = original.CreatedDate;
        Assert.True((await service.RefreshCandidateExamSummaryAsync(seed.ExamId, seed.CandidateId, seed.CandidateId)).Success);
        await AssertRankingAsync(seed);
        await using var verify = Database();
        var persisted = await verify.CandidateExamSummaries.SingleAsync();
        Assert.Equal(original.Id, persisted.Id);
        Assert.Equal(createdAt, persisted.CreatedDate);
        Assert.Equal(seed.CandidateId, persisted.CreatedBy);
        Assert.Equal(seed.CandidateId, persisted.UpdatedBy);

        var emptyCandidate = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString("N"),
            DepartmentId = (await db.Exams.SingleAsync()).DepartmentId
        };
        db.Users.Add(emptyCandidate);
        await db.SaveChangesAsync();
        var emptySeed = seed with { CandidateId = emptyCandidate.Id };
        var empty = await Service(db, emptySeed).RefreshCandidateExamSummaryAsync(
            seed.ExamId, emptyCandidate.Id, emptyCandidate.Id);
        Assert.False(empty.Success);
        Assert.False(await verify.CandidateExamSummaries.AnyAsync(s => s.CandidateId == emptyCandidate.Id));
    }

    [SqlServerFact]
    public async Task FailedSummaryInsertRollsBackAndAnotherRequestCanRetry()
    {
        var seed = await SeedAsync();
        await using (var setup = Database())
            await setup.Database.ExecuteSqlRawAsync("""
                ALTER TABLE [CandidateExamSummaries] ADD CONSTRAINT [CK_ResultSummary_ForcedFailure]
                CHECK ([TotalAttempts] < 0);
                """);
        try
        {
            await using var failing = Database();
            await Assert.ThrowsAsync<DbUpdateException>(() => Service(failing, seed)
                .RefreshCandidateExamSummaryAsync(seed.ExamId, seed.CandidateId, seed.CandidateId));
            await using var verify = Database();
            Assert.Empty(await verify.CandidateExamSummaries.ToListAsync());
            Assert.Equal(3, await verify.Results.CountAsync());
        }
        finally
        {
            await using var cleanup = Database();
            await cleanup.Database.ExecuteSqlRawAsync(
                "ALTER TABLE [CandidateExamSummaries] DROP CONSTRAINT [CK_ResultSummary_ForcedFailure]");
        }

        await using var retry = Database();
        Assert.True((await Service(retry, seed).RefreshCandidateExamSummaryAsync(
            seed.ExamId, seed.CandidateId, seed.CandidateId)).Success);
        await AssertRankingAsync(seed);
    }

    private async Task AssertRankingAsync(Seed seed)
    {
        await using var verify = Database();
        var summary = await verify.CandidateExamSummaries.SingleAsync();
        Assert.Equal(seed.ExamId, summary.ExamId);
        Assert.Equal(seed.CandidateId, summary.CandidateId);
        Assert.Equal(3, summary.TotalAttempts);
        Assert.Equal(seed.BestResultId, summary.BestResultId);
        Assert.Equal(seed.BestAttemptId, summary.BestAttemptId);
        Assert.Equal(80m, summary.BestScore);
        Assert.True(summary.BestIsPassed);
        Assert.Equal(seed.LatestAttemptId, summary.LatestAttemptId);
        Assert.Equal(20m, summary.LatestScore);
        Assert.False(summary.LatestIsPassed);
        Assert.Equal(seed.LatestStartedAt, summary.LastAttemptAt);
    }

    private async Task WaitUntilCompletedOrBlockedAsync(Task request, ApplicationDbContext owner, ApplicationDbContext waiter)
    {
        var ownerId = ((SqlConnection)owner.Database.GetDbConnection()).ServerProcessId;
        var waiterId = ((SqlConnection)waiter.Database.GetDbConnection()).ServerProcessId;
        await using var observer = new SqlConnection(_connectionString);
        await observer.OpenAsync();
        await using var command = observer.CreateCommand();
        command.CommandText = """
            SELECT COUNT(*) FROM sys.dm_exec_requests
            WHERE session_id = @waiter AND blocking_session_id = @owner AND wait_type LIKE 'LCK_M_%';
            """;
        command.Parameters.AddWithValue("@owner", ownerId);
        command.Parameters.AddWithValue("@waiter", waiterId);
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        // Observe the actual SQL lock wait; do not assume requests overlapped after a fixed delay.
        while (!request.IsCompleted)
        {
            if ((int)(await command.ExecuteScalarAsync(timeout.Token))! > 0) return;
            await Task.Delay(10, timeout.Token);
        }
    }

    private ApplicationDbContext Database(params IInterceptor[] interceptors) =>
        new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(_connectionString!, sql => sql.CommandTimeout(30))
            .AddInterceptors(interceptors).Options);

    private static ExamResultService Service(ApplicationDbContext db, Seed seed)
    {
        var currentUser = new CurrentUser(seed.CandidateId);
        var manager = new UserManager<ApplicationUser>(
            new UserStore<ApplicationUser, ApplicationRole, ApplicationDbContext>(db),
            Options.Create(new IdentityOptions()), new PasswordHasher<ApplicationUser>(), [], [],
            new UpperInvariantLookupNormalizer(), new IdentityErrorDescriber(), null!,
            NullLogger<UserManager<ApplicationUser>>.Instance);
        return new ExamResultService(db, null!, currentUser, manager, null!,
            new CacheService(), new ResourceAuthorizationService(db, manager, currentUser));
    }

    private async Task<Seed> SeedAsync()
    {
        await using var db = Database();
        var department = new Department { NameEn = "Results", NameAr = "Results" };
        var candidate = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString("N"),
            Department = department,
            UserName = "summary-candidate"
        };
        var exam = new Exam
        {
            Department = department,
            TitleEn = "Results",
            TitleAr = "Results",
            MaxAttempts = 5,
            DurationMinutes = 60,
            PassScore = 50
        };
        var finalizedAt = new DateTimeOffset(2026, 6, 1, 12, 0, 0, TimeSpan.FromHours(4));
        var results = new[] { 80m, 80m, 20m, 100m }.Select((score, index) => new Result
        {
            Candidate = candidate,
            Exam = exam,
            TotalScore = score,
            MaxPossibleScore = 100,
            PassScore = 50,
            IsPassed = score >= 50,
            FinalizedAt = finalizedAt.AddMinutes(index),
            IsPublishedToCandidate = false,
            IsDeleted = index == 3,
            Attempt = new AttemptEntity
            {
                Candidate = candidate,
                Exam = exam,
                AttemptNumber = index + 1,
                Status = AttemptStatus.Submitted,
                StartedAt = finalizedAt.AddHours(-index - 1)
            }
        }).ToArray();
        db.Results.AddRange(results);
        await db.SaveChangesAsync();
        return new Seed(exam.Id, candidate.Id, results[0].Id, results[0].AttemptId,
            results[2].Id, results[2].AttemptId, results[2].Attempt.StartedAt);
    }

    private sealed record Seed(int ExamId, string CandidateId, int BestResultId, int BestAttemptId,
        int LatestResultId, int LatestAttemptId, DateTimeOffset LatestStartedAt);

    private sealed class CurrentUser(string candidateId) : ICurrentUserService
    {
        public string? UserId => candidateId;
        public string? Email => null;
        public bool IsAuthenticated => true;
    }

    private sealed class PauseBeforeSummarySave : SaveChangesInterceptor
    {
        private int _paused;
        public TaskCompletionSource Entered { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public TaskCompletionSource Release { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            if (eventData.Context!.ChangeTracker.Entries<CandidateExamSummary>().Any() &&
                Interlocked.Exchange(ref _paused, 1) == 0)
            {
                Entered.TrySetResult();
                await Release.Task.WaitAsync(TimeSpan.FromSeconds(20), cancellationToken);
            }
            return result;
        }
    }
}
