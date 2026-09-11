using System.Collections.Concurrent;
using System.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Smart_Core.Application.DTOs.Attempt;
using Smart_Core.Application.DTOs.Candidate;
using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Entities.Attempt;
using Smart_Core.Domain.Entities.Lookups;
using Smart_Core.Domain.Entities.Proctor;
using Smart_Core.Domain.Entities.QuestionBank;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;
using Smart_Core.Infrastructure.Hubs;
using Smart_Core.Infrastructure.Services;
using Smart_Core.Infrastructure.Services.Attempt;
using Smart_Core.Infrastructure.Services.Candidate;
using Xunit.Abstractions;

namespace Backend_API.Tests;

[Trait("Category", "SqlServer")]
public sealed class AttemptConcurrencyTests(ITestOutputHelper output) : IAsyncLifetime
{
    private string? _connectionString;

    public async Task InitializeAsync()
    {
        if (SqlServerFactAttribute.ConnectionString is not { } connectionString) return;
        _connectionString = new SqlConnectionStringBuilder(connectionString)
        {
            InitialCatalog = "RegressionAttempts_" + Guid.NewGuid().ToString("N"),
            MaxPoolSize = 150
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

    [SqlServerConcurrencyTheory]
    [InlineData(false, false)]
    [InlineData(false, true)]
    [InlineData(true, false)]
    [InlineData(true, true)]
    public async Task ConcurrentFirstAnswersAreUpsertedWithoutDuplicates(bool firstBulk, bool secondBulk)
    {
        var seed = await SeedAsync();
        var attemptId = await StartAsync(seed, seed.Candidates[0]);
        var pause = new PauseBeforeSave();
        await using var firstDb = Database(pause);
        await using var secondDb = Database();
        var first = SaveAsync(Service(firstDb), attemptId, seed, firstBulk, "first");
        await pause.Entered.Task.WaitAsync(TimeSpan.FromSeconds(15));
        var second = SaveAsync(Service(secondDb), attemptId, seed, secondBulk, "second");
        try
        {
            // The unfixed second request can insert while the first has read "no answer".
            // The fixed request waits for the first transaction's attempt update lock.
            await Task.WhenAny(second, Task.Delay(500));
        }
        finally
        {
            pause.Release.TrySetResult();
        }
        await Task.WhenAll(first, second).WaitAsync(TimeSpan.FromSeconds(30));
        Assert.True(first.Result);
        Assert.True(second.Result);
        await using var verify = Database();
        var answer = await verify.AttemptAnswers.SingleAsync(a => a.AttemptId == attemptId);
        Assert.Equal("second", answer.TextAnswer);
        Assert.Equal(AttemptStatus.InProgress, (await verify.Attempts.SingleAsync(a => a.Id == attemptId)).Status);
        Assert.Equal(2, await verify.AttemptEvents.CountAsync(e =>
            e.AttemptId == attemptId && e.EventType == AttemptEventType.AnswerSaved));
    }

    [SqlServerConcurrencyTheory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task SavingBeforeSubmitCannotReopenSubmittedAttempt(bool bulk)
    {
        var seed = await SeedAsync();
        var attemptId = await StartAsync(seed, seed.Candidates[0]);
        var pause = new PauseBeforeSave();
        await using var savingDb = Database(pause);
        await using var submittingDb = Database();
        var saving = SaveAsync(Service(savingDb), attemptId, seed, bulk, "saved before submit");
        await pause.Entered.Task.WaitAsync(TimeSpan.FromSeconds(15));
        var submitting = Service(submittingDb).SubmitAttemptAsync(attemptId, seed.Candidates[0]);
        try
        {
            await Task.WhenAny(submitting, Task.Delay(500));
        }
        finally
        {
            pause.Release.TrySetResult();
        }
        await Task.WhenAll(saving, submitting).WaitAsync(TimeSpan.FromSeconds(30));
        Assert.True(saving.Result);
        Assert.True(submitting.Result.Success, submitting.Result.Message);
        await using var verify = Database();
        Assert.Equal(AttemptStatus.Submitted, (await verify.Attempts.SingleAsync(a => a.Id == attemptId)).Status);
        Assert.Equal(1, submitting.Result.Data!.AnsweredQuestions);
        Assert.Equal("saved before submit", (await verify.AttemptAnswers.SingleAsync(a => a.AttemptId == attemptId)).TextAnswer);
        Assert.Equal(ProctorSessionStatus.Completed,
            (await verify.ProctorSessions.SingleAsync(s => s.AttemptId == attemptId)).Status);
    }

    [SqlServerConcurrencyTheory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task SubmitBeforeSaveRejectsLateAnswerAndDuplicateSubmission(bool bulk)
    {
        var seed = await SeedAsync();
        var attemptId = await StartAsync(seed, seed.Candidates[0]);
        var pause = new PauseBeforeSave();
        await using var submittingDb = Database(pause);
        await using var savingDb = Database();
        await using var duplicateDb = Database();
        var submitting = Service(submittingDb).SubmitAttemptAsync(attemptId, seed.Candidates[0]);
        await pause.Entered.Task.WaitAsync(TimeSpan.FromSeconds(15));
        var saving = SaveAsync(Service(savingDb), attemptId, seed, bulk, "too late");
        var duplicate = Service(duplicateDb).SubmitAttemptAsync(attemptId, seed.Candidates[0]);
        try
        {
            await Task.WhenAny(Task.WhenAll(saving, duplicate), Task.Delay(500));
        }
        finally
        {
            pause.Release.TrySetResult();
        }
        await Task.WhenAll(submitting, saving, duplicate).WaitAsync(TimeSpan.FromSeconds(30));
        Assert.True(submitting.Result.Success);
        Assert.False(saving.Result);
        Assert.False(duplicate.Result.Success);
        await using var verify = Database();
        Assert.Empty(await verify.AttemptAnswers.Where(a => a.AttemptId == attemptId).ToListAsync());
        Assert.Equal(1, await verify.AttemptEvents.CountAsync(e =>
            e.AttemptId == attemptId && e.EventType == AttemptEventType.Submitted));
    }

    [SqlServerFact]
    public async Task SqlFailureInSubmitEventRollsBackStatusAndProctorSessionAndAllowsRetry()
    {
        var seed = await SeedAsync();
        var attemptId = await StartAsync(seed, seed.Candidates[0]);
        await using (var setup = Database())
        {
            // A real SQL constraint failure after ExecuteUpdate, not a mocked database.
            Assert.Equal(6, (int)AttemptEventType.Submitted);
            await setup.Database.ExecuteSqlRawAsync("""
                ALTER TABLE [AttemptEvents] ADD CONSTRAINT [CK_Concurrency_SubmitFailure]
                CHECK ([EventType] <> 6);
                """);
        }
        try
        {
            await using var failing = Database();
            await Assert.ThrowsAsync<DbUpdateException>(() =>
                Service(failing).SubmitAttemptAsync(attemptId, seed.Candidates[0]));
            await using var verify = Database();
            var attempt = await verify.Attempts.SingleAsync(a => a.Id == attemptId);
            Assert.Equal(AttemptStatus.Started, attempt.Status);
            Assert.Null(attempt.SubmittedAt);
            var session = await verify.ProctorSessions.SingleAsync(s => s.AttemptId == attemptId);
            Assert.Equal(ProctorSessionStatus.Active, session.Status);
            Assert.Null(session.EndedAt);
            Assert.False(await verify.AttemptEvents.AnyAsync(e =>
                e.AttemptId == attemptId && e.EventType == AttemptEventType.Submitted));
        }
        finally
        {
            await using var cleanup = Database();
            await cleanup.Database.ExecuteSqlRawAsync(
                "ALTER TABLE [AttemptEvents] DROP CONSTRAINT [CK_Concurrency_SubmitFailure]");
        }
        await using var retry = Database();
        Assert.True((await Service(retry).SubmitAttemptAsync(attemptId, seed.Candidates[0])).Success);
    }

    [SqlServerConcurrencyTheory]
    [InlineData(false, false)]
    [InlineData(true, false)]
    [InlineData(true, true)]
    public async Task SqlFailureInAnswerEventRollsBackAnswerAndStatusAndAllowsRetry(bool bulk, bool candidateApi)
    {
        var seed = await SeedAsync();
        var attemptId = await StartAsync(seed, seed.Candidates[0]);
        await using (var setup = Database())
        {
            Assert.Equal(2, (int)AttemptEventType.AnswerSaved);
            await setup.Database.ExecuteSqlRawAsync("""
                ALTER TABLE [AttemptEvents] ADD CONSTRAINT [CK_Concurrency_AnswerFailure]
                CHECK ([EventType] <> 2);
                """);
        }
        try
        {
            await using var failing = Database();
            await Assert.ThrowsAsync<DbUpdateException>(() =>
                candidateApi
                    ? SaveAtEntryPointAsync(failing, attemptId, seed, true, "rolled back")
                    : SaveAsync(Service(failing), attemptId, seed, bulk, "rolled back"));
            await using var verify = Database();
            Assert.Equal(AttemptStatus.Started, (await verify.Attempts.SingleAsync(a => a.Id == attemptId)).Status);
            Assert.False(await verify.AttemptAnswers.AnyAsync(a => a.AttemptId == attemptId));
            Assert.False(await verify.AttemptEvents.AnyAsync(e =>
                e.AttemptId == attemptId && e.EventType == AttemptEventType.AnswerSaved));
        }
        finally
        {
            await using var cleanup = Database();
            await cleanup.Database.ExecuteSqlRawAsync(
                "ALTER TABLE [AttemptEvents] DROP CONSTRAINT [CK_Concurrency_AnswerFailure]");
        }
        await using var retry = Database();
        Assert.True(candidateApi
            ? await SaveAtEntryPointAsync(retry, attemptId, seed, true, "retry")
            : await SaveAsync(Service(retry), attemptId, seed, bulk, "retry"));
    }

    [SqlServerConcurrencyTheory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task SqlFailureInStartSnapshotRollsBackWholeAttemptAndAllowsRetry(bool candidateApi)
    {
        var seed = await SeedAsync();
        await using (var setup = Database())
            await setup.Database.ExecuteSqlRawAsync("""
                ALTER TABLE [AttemptQuestions] ADD CONSTRAINT [CK_Concurrency_SnapshotFailure]
                CHECK ([Order] < 2);
                """);
        try
        {
            await using var failing = Database();
            await Assert.ThrowsAsync<DbUpdateException>(() =>
                StartAtEntryPointAsync(failing, seed, seed.Candidates[0], candidateApi));
            await using var verify = Database();
            Assert.Empty(await verify.Attempts.ToListAsync());
            Assert.Empty(await verify.AttemptQuestions.ToListAsync());
            Assert.Empty(await verify.AttemptEvents.ToListAsync());
            Assert.Empty(await verify.ProctorSessions.ToListAsync());
        }
        finally
        {
            await using var cleanup = Database();
            await cleanup.Database.ExecuteSqlRawAsync(
                "ALTER TABLE [AttemptQuestions] DROP CONSTRAINT [CK_Concurrency_SnapshotFailure]");
        }
        await using var retry = Database();
        var attemptId = await StartAtEntryPointAsync(retry, seed, seed.Candidates[0], candidateApi);
        await using var verifyRetry = Database();
        Assert.Equal(1, (await verifyRetry.Attempts.SingleAsync(a => a.Id == attemptId)).AttemptNumber);
    }

    [SqlServerConcurrencyTheory]
    [InlineData(false, false)]
    [InlineData(false, true)]
    [InlineData(true, false)]
    [InlineData(true, true)]
    public async Task ConcurrentStartsCreateOneCompleteSnapshotWithoutDeadlock(bool firstCandidateApi, bool secondCandidateApi)
    {
        var seed = await SeedAsync();
        var pause = new PauseBeforeSave();
        await using var firstDb = Database(pause);
        await using var secondDb = Database();
        var first = StartAtEntryPointAsync(firstDb, seed, seed.Candidates[0], firstCandidateApi);
        await pause.Entered.Task.WaitAsync(TimeSpan.FromSeconds(15));
        var second = StartAtEntryPointAsync(secondDb, seed, seed.Candidates[0], secondCandidateApi);
        try
        {
            await Task.WhenAny(second, Task.Delay(500));
        }
        finally
        {
            pause.Release.TrySetResult();
        }
        await Task.WhenAll(first, second).WaitAsync(TimeSpan.FromSeconds(30));
        Assert.Equal(first.Result, second.Result);
        await using var verify = Database();
        var attempt = await verify.Attempts.SingleAsync(a => a.ExamId == seed.ExamId);
        Assert.Equal(1, attempt.AttemptNumber);
        Assert.Equal(seed.QuestionIds.Length, await verify.AttemptQuestions.CountAsync(q => q.AttemptId == attempt.Id));
        Assert.Equal(1, await verify.ProctorSessions.CountAsync(s => s.AttemptId == attempt.Id));
        Assert.Equal(1, await verify.AttemptEvents.CountAsync(e =>
            e.AttemptId == attempt.Id && e.EventType == AttemptEventType.Started));
    }

    [SqlServerConcurrencyTheory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task StartingOneCandidateDoesNotBlockAnotherCandidate(bool candidateApi)
    {
        var seed = await SeedAsync(candidateCount: 2);
        var pause = new PauseBeforeSave();
        await using var firstDb = Database(pause);
        var first = StartAtEntryPointAsync(firstDb, seed, seed.Candidates[0], candidateApi);
        await pause.Entered.Task.WaitAsync(TimeSpan.FromSeconds(15));
        try
        {
            await using var secondDb = Database();
            await StartAtEntryPointAsync(secondDb, seed, seed.Candidates[1], !candidateApi).WaitAsync(TimeSpan.FromSeconds(10));
        }
        finally
        {
            pause.Release.TrySetResult();
            await first.WaitAsync(TimeSpan.FromSeconds(30));
        }
        await using var verify = Database();
        Assert.Equal(2, await verify.Attempts.CountAsync(a => a.ExamId == seed.ExamId));
    }

    [SqlServerFact]
    public async Task ExpiredActiveAttemptStaysExpiredWhenMaximumAttemptsPreventsRestart()
    {
        var seed = await SeedAsync();
        var attemptId = await StartAsync(seed, seed.Candidates[0]);
        await using (var setup = Database())
            await setup.Attempts.Where(a => a.Id == attemptId).ExecuteUpdateAsync(s =>
                s.SetProperty(a => a.ExpiresAt, UaeTimeHelper.NowUae.AddMinutes(-1)));
        await using (var restarting = Database())
        {
            var result = await Service(restarting).StartAttemptAsync(
                new StartAttemptDto { ExamId = seed.ExamId }, seed.Candidates[0]);
            Assert.False(result.Success);
            Assert.Contains("Maximum attempts (1)", result.Message);
        }
        await using var verify = Database();
        var attempt = await verify.Attempts.SingleAsync(a => a.ExamId == seed.ExamId);
        Assert.Equal(AttemptStatus.Expired, attempt.Status);
        Assert.Equal(ExpiryReason.TimerExpiredWhileActive, attempt.ExpiryReason);
    }

    [SqlServerFact]
    public async Task CandidateStartPreservesMaximumAttemptsAndConsumesOneAdminOverride()
    {
        var seed = await SeedAsync();
        var originalId = await StartAsync(seed, seed.Candidates[0]);
        await using (var setup = Database())
            await setup.Attempts.Where(a => a.Id == originalId).ExecuteUpdateAsync(s =>
                s.SetProperty(a => a.ExpiresAt, UaeTimeHelper.NowUae.AddMinutes(-1)));
        await using (var denied = Database())
        {
            var result = await CandidateService(denied).StartExamAsync(seed.ExamId, new StartExamRequest(), seed.Candidates[0]);
            Assert.False(result.Success);
            Assert.Contains("Maximum attempts (1)", result.Message);
        }
        await using (var setup = Database())
        {
            Assert.Equal(AttemptStatus.Expired, (await setup.Attempts.SingleAsync(a => a.Id == originalId)).Status);
            setup.Set<AdminAttemptOverride>().Add(new AdminAttemptOverride
            {
                ExamId = seed.ExamId, CandidateId = seed.Candidates[0], GrantedBy = seed.Candidates[0],
                Reason = "Concurrency regression", GrantedAt = UaeTimeHelper.NowUae
            });
            await setup.SaveChangesAsync();
        }
        var pause = new PauseBeforeSave();
        await using var firstDb = Database(pause);
        await using var secondDb = Database();
        var first = StartAtEntryPointAsync(firstDb, seed, seed.Candidates[0], true);
        await pause.Entered.Task.WaitAsync(TimeSpan.FromSeconds(15));
        var second = StartAtEntryPointAsync(secondDb, seed, seed.Candidates[0], true);
        try
        {
            await Task.WhenAny(second, Task.Delay(500));
        }
        finally
        {
            pause.Release.TrySetResult();
        }
        await Task.WhenAll(first, second).WaitAsync(TimeSpan.FromSeconds(30));
        Assert.Equal(first.Result, second.Result);
        await using var verify = Database();
        var resumed = await verify.Attempts.SingleAsync(a => a.Id == first.Result);
        Assert.Equal(AttemptStatus.Resumed, resumed.Status);
        Assert.Equal(2, resumed.AttemptNumber);
        Assert.Equal(originalId, resumed.ResumedFromAttemptId);
        var usedOverride = await verify.Set<AdminAttemptOverride>().SingleAsync();
        Assert.True(usedOverride.IsUsed);
        Assert.Equal(resumed.Id, usedOverride.UsedAttemptId);
        Assert.Equal(2, await verify.Attempts.CountAsync(a => a.ExamId == seed.ExamId));
    }

    [SqlServerConcurrencyTheory]
    [InlineData(true, false)]
    [InlineData(false, true)]
    [InlineData(true, true)]
    public async Task CandidateAndAttemptAnswerEntryPointsShareUpsertLock(bool firstCandidateApi, bool secondCandidateApi)
    {
        var seed = await SeedAsync();
        var attemptId = await StartAsync(seed, seed.Candidates[0]);
        var pause = new PauseBeforeSave();
        await using var firstDb = Database(pause);
        await using var secondDb = Database();
        var first = SaveAtEntryPointAsync(firstDb, attemptId, seed, firstCandidateApi, "first");
        await pause.Entered.Task.WaitAsync(TimeSpan.FromSeconds(15));
        var second = SaveAtEntryPointAsync(secondDb, attemptId, seed, secondCandidateApi, "second");
        try
        {
            await Task.WhenAny(second, Task.Delay(500));
        }
        finally
        {
            pause.Release.TrySetResult();
        }
        await Task.WhenAll(first, second).WaitAsync(TimeSpan.FromSeconds(30));
        Assert.True(first.Result);
        Assert.True(second.Result);
        await using var verify = Database();
        Assert.Equal("second", (await verify.AttemptAnswers.SingleAsync(a => a.AttemptId == attemptId)).TextAnswer);
        Assert.Equal(2, await verify.AttemptEvents.CountAsync(e =>
            e.AttemptId == attemptId && e.EventType == AttemptEventType.AnswerSaved));
    }

    [SqlServerConcurrencyTheory]
    [InlineData(true, false, false)]
    [InlineData(true, false, true)]
    [InlineData(false, true, false)]
    [InlineData(false, true, true)]
    [InlineData(true, true, false)]
    [InlineData(true, true, true)]
    public async Task CandidateAndAttemptEntryPointsShareSubmitLock(bool candidateSave, bool candidateSubmit, bool submitFirst)
    {
        var seed = await SeedAsync();
        var attemptId = await StartAsync(seed, seed.Candidates[0]);
        var pause = new PauseBeforeSave();
        await using var firstDb = Database(pause);
        await using var secondDb = Database();
        var first = submitFirst
            ? SubmitAtEntryPointAsync(firstDb, attemptId, seed.Candidates[0], candidateSubmit)
            : SaveAtEntryPointAsync(firstDb, attemptId, seed, candidateSave, "before submit");
        await pause.Entered.Task.WaitAsync(TimeSpan.FromSeconds(15));
        var second = submitFirst
            ? SaveAtEntryPointAsync(secondDb, attemptId, seed, candidateSave, "too late")
            : SubmitAtEntryPointAsync(secondDb, attemptId, seed.Candidates[0], candidateSubmit);
        try
        {
            await Task.WhenAny(second, Task.Delay(500));
        }
        finally
        {
            pause.Release.TrySetResult();
        }
        await Task.WhenAll(first, second).WaitAsync(TimeSpan.FromSeconds(30));
        Assert.True(first.Result);
        Assert.Equal(!submitFirst, second.Result);
        await using var verify = Database();
        Assert.Equal(AttemptStatus.Submitted, (await verify.Attempts.SingleAsync(a => a.Id == attemptId)).Status);
        Assert.Equal(submitFirst ? 0 : 1, await verify.AttemptAnswers.CountAsync(a => a.AttemptId == attemptId));
        Assert.Equal(1, await verify.AttemptEvents.CountAsync(e =>
            e.AttemptId == attemptId && e.EventType == AttemptEventType.Submitted));
        Assert.Equal(ProctorSessionStatus.Completed,
            (await verify.ProctorSessions.SingleAsync(s => s.AttemptId == attemptId)).Status);
    }

    [SqlServerConcurrencyTheory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task CandidateSubmitSqlFailureRollsBackAndLateSubmitAndDuplicateRulesArePreserved(bool late)
    {
        var seed = await SeedAsync();
        var attemptId = await StartAsync(seed, seed.Candidates[0]);
        await using (var setup = Database())
        {
            if (late)
                await setup.Attempts.Where(a => a.Id == attemptId).ExecuteUpdateAsync(s =>
                    s.SetProperty(a => a.ExpiresAt, UaeTimeHelper.NowUae.AddMinutes(-1)));
            await setup.Database.ExecuteSqlRawAsync("""
                ALTER TABLE [AttemptEvents] ADD CONSTRAINT [CK_Concurrency_CandidateSubmitFailure]
                CHECK ([EventType] <> 6);
                """);
        }
        try
        {
            await using var failing = Database();
            await Assert.ThrowsAsync<DbUpdateException>(() =>
                CandidateService(failing).SubmitAttemptAsync(attemptId, seed.Candidates[0]));
            await using var verify = Database();
            var attempt = await verify.Attempts.SingleAsync(a => a.Id == attemptId);
            Assert.Equal(AttemptStatus.Started, attempt.Status);
            Assert.Null(attempt.SubmittedAt);
            Assert.Equal(ProctorSessionStatus.Active,
                (await verify.ProctorSessions.SingleAsync(s => s.AttemptId == attemptId)).Status);
            Assert.False(await verify.AttemptEvents.AnyAsync(e =>
                e.AttemptId == attemptId && e.EventType == AttemptEventType.Submitted));
        }
        finally
        {
            await using var cleanup = Database();
            await cleanup.Database.ExecuteSqlRawAsync(
                "ALTER TABLE [AttemptEvents] DROP CONSTRAINT [CK_Concurrency_CandidateSubmitFailure]");
        }
        await using (var retry = Database())
            Assert.True((await CandidateService(retry).SubmitAttemptAsync(attemptId, seed.Candidates[0])).Success);
        await using (var duplicate = Database())
            Assert.True((await CandidateService(duplicate).SubmitAttemptAsync(attemptId, seed.Candidates[0])).Success);
        await using var verifyRetry = Database();
        Assert.Equal(1, await verifyRetry.AttemptEvents.CountAsync(e =>
            e.AttemptId == attemptId && e.EventType == AttemptEventType.Submitted));
    }

    [SqlServerConcurrencyTheory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task ValidationOwnershipExpiryAndDisconnectRulesArePreserved(bool bulk)
    {
        var seed = await SeedAsync();
        var candidate = seed.Candidates[0];
        var attemptId = await StartAsync(seed, candidate);
        await using (var unauthorized = Database())
            Assert.False(await SaveAsync(Service(unauthorized), attemptId, seed, bulk, "private", "other-candidate"));
        await using (var invalid = Database())
            Assert.False(await SaveAsync(Service(invalid), attemptId, seed, bulk, " "));
        await using (var verify = Database())
        {
            Assert.Equal(AttemptStatus.Started, (await verify.Attempts.SingleAsync(a => a.Id == attemptId)).Status);
            Assert.False(await verify.AttemptAnswers.AnyAsync(a => a.AttemptId == attemptId));
            await verify.Attempts.Where(a => a.Id == attemptId).ExecuteUpdateAsync(s =>
                s.SetProperty(a => a.ExpiresAt, UaeTimeHelper.NowUae.AddMinutes(-1)));
        }
        await using (var expired = Database())
            Assert.False(await SaveAsync(Service(expired), attemptId, seed, bulk, "expired"));
        await using (var verify = Database())
        {
            var attempt = await verify.Attempts.SingleAsync(a => a.Id == attemptId);
            Assert.Equal(AttemptStatus.Expired, attempt.Status);
            Assert.Equal(ExpiryReason.TimerExpiredWhileActive, attempt.ExpiryReason);
        }

        var disconnectedSeed = await SeedAsync();
        var disconnectedId = await StartAsync(disconnectedSeed, disconnectedSeed.Candidates[0]);
        await using (var setup = Database())
            await setup.Attempts.Where(a => a.Id == disconnectedId).ExecuteUpdateAsync(s =>
                s.SetProperty(a => a.TotalDisconnectSeconds, Smart_Core.Domain.Constants.ExamDefaults.MaxDisconnectSeconds + 1));
        await using (var disconnected = Database())
            Assert.False(await SaveAsync(Service(disconnected), disconnectedId, disconnectedSeed, bulk, "disconnected"));
        await using (var verify = Database())
        {
            var attempt = await verify.Attempts.SingleAsync(a => a.Id == disconnectedId);
            Assert.Equal(AttemptStatus.Expired, attempt.Status);
            Assert.Equal(ExpiryReason.DisconnectTimeout, attempt.ExpiryReason);
            Assert.Equal(ProctorSessionStatus.Completed,
                (await verify.ProctorSessions.SingleAsync(s => s.AttemptId == disconnectedId)).Status);
            Assert.Equal(1, await verify.AttemptEvents.CountAsync(e =>
                e.AttemptId == disconnectedId && e.EventType == AttemptEventType.DisconnectExpired));
        }
    }

    [SqlServerFact]
    public async Task FiftyCandidatesPersistConcurrentStartsSavesAndSubmissions()
    {
        const int candidateCount = 50;
        var seed = await SeedAsync(candidateCount, questionCount: 10);
        var durations = new ConcurrentDictionary<string, ConcurrentBag<double>>();
        var allStarted = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var readyCount = 0;
        var elapsed = Stopwatch.StartNew();
        await Task.WhenAll(seed.Candidates.Select(async candidate =>
        {
            if (Interlocked.Increment(ref readyCount) == candidateCount) allStarted.TrySetResult();
            await allStarted.Task;
            var attemptId = await Measure("start", () => StartAsync(seed, candidate));
            await Task.WhenAll(Enumerable.Range(0, 2).Select(async copy =>
            {
                await using var db = Database();
                var result = await Measure("bulk-save", () => Service(db).BulkSaveAnswersAsync(attemptId,
                    new BulkSaveAnswersDto
                    {
                        Answers = seed.QuestionIds.Select(q => new SaveAnswerDto
                        {
                            QuestionId = q, TextAnswer = $"candidate-{candidate}-copy-{copy}"
                        }).ToList()
                    }, candidate));
                Assert.True(result.Success, result.Message);
                Assert.All(result.Data!, answer => Assert.True(answer.Success));
            }));
            await using var submitDb = Database();
            var submit = await Measure("submit", () => Service(submitDb).SubmitAttemptAsync(attemptId, candidate));
            Assert.True(submit.Success, submit.Message);
            Assert.Equal(seed.QuestionIds.Length, submit.Data!.AnsweredQuestions);
        })).WaitAsync(TimeSpan.FromMinutes(3));
        elapsed.Stop();
        await using var verify = Database();
        var attempts = await verify.Attempts.Where(a => a.ExamId == seed.ExamId).ToListAsync();
        Assert.Equal(candidateCount, attempts.Count);
        Assert.All(attempts, a => Assert.Equal(AttemptStatus.Submitted, a.Status));
        Assert.Equal(candidateCount * seed.QuestionIds.Length,
            await verify.AttemptAnswers.CountAsync(a => a.Attempt.ExamId == seed.ExamId));
        Assert.Equal(candidateCount * seed.QuestionIds.Length,
            await verify.AttemptQuestions.CountAsync(q => q.Attempt.ExamId == seed.ExamId));
        Assert.Equal(candidateCount * seed.QuestionIds.Length * 2,
            await verify.AttemptEvents.CountAsync(e => e.Attempt.ExamId == seed.ExamId && e.EventType == AttemptEventType.AnswerSaved));
        Assert.Equal(candidateCount,
            await verify.AttemptEvents.CountAsync(e => e.Attempt.ExamId == seed.ExamId && e.EventType == AttemptEventType.Started));
        Assert.Equal(candidateCount,
            await verify.AttemptEvents.CountAsync(e => e.Attempt.ExamId == seed.ExamId && e.EventType == AttemptEventType.Submitted));
        Assert.Equal(candidateCount,
            await verify.ProctorSessions.CountAsync(s => s.ExamId == seed.ExamId && s.Status == ProctorSessionStatus.Completed));
        output.WriteLine($"Backend-only SQL persistence: {candidateCount} candidates, 10 answers each, " +
            $"50 starts + 100 overlapping bulk saves + 50 submits; elapsed={elapsed.Elapsed.TotalSeconds:F3}s; " +
            $"throughput={200 / elapsed.Elapsed.TotalSeconds:F2} operations/s; no HTTP/browser/WebRTC/SignalR transport.");
        foreach (var (name, samples) in durations.OrderBy(p => p.Key))
        {
            var values = samples.Order().ToArray();
            output.WriteLine($"{name}: n={values.Length}; p50={Percentile(values, .50):F1}ms; " +
                $"p95={Percentile(values, .95):F1}ms; p99={Percentile(values, .99):F1}ms; max={values[^1]:F1}ms");
        }

        async Task<T> Measure<T>(string operation, Func<Task<T>> action)
        {
            var timer = Stopwatch.StartNew();
            var result = await action();
            durations.GetOrAdd(operation, _ => []).Add(timer.Elapsed.TotalMilliseconds);
            return result;
        }
    }

    private static double Percentile(double[] values, double percentile) =>
        values[Math.Clamp((int)Math.Ceiling(values.Length * percentile) - 1, 0, values.Length - 1)];

    private ApplicationDbContext Database(params IInterceptor[] interceptors) =>
        new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(_connectionString!, sql => sql.CommandTimeout(45))
            .AddInterceptors(interceptors).Options);

    private static AttemptService Service(ApplicationDbContext db) =>
        new(db, new TestHub(), new HttpContextAccessor(), new CacheService(), null!);

    private static CandidateService CandidateService(ApplicationDbContext db) =>
        new(db, null!, null!, null!, NullLogger<CandidateService>.Instance,
            new NoGradingScopeFactory(), new CacheService(), new TestHub(), new HttpContextAccessor());

    private static async Task<int> StartAtEntryPointAsync(ApplicationDbContext db, Seed seed, string candidate, bool candidateApi)
    {
        if (candidateApi)
        {
            var result = await CandidateService(db).StartExamAsync(seed.ExamId, new StartExamRequest(), candidate);
            Assert.True(result.Success, result.Message);
            return result.Data!.AttemptId;
        }
        var attemptResult = await Service(db).StartAttemptAsync(new StartAttemptDto { ExamId = seed.ExamId }, candidate);
        Assert.True(attemptResult.Success, attemptResult.Message);
        return attemptResult.Data!.AttemptId;
    }

    private static async Task<bool> SaveAtEntryPointAsync(ApplicationDbContext db, int attemptId, Seed seed, bool candidateApi, string text)
    {
        if (!candidateApi) return await SaveAsync(Service(db), attemptId, seed, true, text);
        return (await CandidateService(db).SaveAnswersAsync(attemptId, new BulkSaveAnswersRequest
        {
            Answers = [new SaveAnswerRequest { QuestionId = seed.QuestionIds[0], TextAnswer = text }]
        }, seed.Candidates[0])).Success;
    }

    private static async Task<bool> SubmitAtEntryPointAsync(ApplicationDbContext db, int attemptId, string candidate, bool candidateApi) =>
        candidateApi
            ? (await CandidateService(db).SubmitAttemptAsync(attemptId, candidate)).Success
            : (await Service(db).SubmitAttemptAsync(attemptId, candidate)).Success;

    private async Task<int> StartAsync(Seed seed, string candidate)
    {
        await using var db = Database();
        var response = await Service(db).StartAttemptAsync(new StartAttemptDto { ExamId = seed.ExamId }, candidate);
        Assert.True(response.Success, response.Message);
        return response.Data!.AttemptId;
    }

    private static async Task<bool> SaveAsync(AttemptService service, int attemptId, Seed seed,
        bool bulk, string text, string? candidate = null)
    {
        var answer = new SaveAnswerDto { QuestionId = seed.QuestionIds[0], TextAnswer = text };
        if (!bulk) return (await service.SaveAnswerAsync(attemptId, answer, candidate ?? seed.Candidates[0])).Success;
        var response = await service.BulkSaveAnswersAsync(attemptId,
            new BulkSaveAnswersDto { Answers = [answer] }, candidate ?? seed.Candidates[0]);
        return response.Success && response.Data!.All(a => a.Success);
    }

    private async Task<Seed> SeedAsync(int candidateCount = 1, int questionCount = 2)
    {
        await using var db = Database();
        var suffix = Guid.NewGuid().ToString("N");
        var department = new Department { NameEn = $"Concurrency-{suffix}", NameAr = $"Concurrency-{suffix}" };
        var subject = new QuestionSubject { NameEn = "Concurrency", NameAr = "Concurrency", Department = department };
        var type = new QuestionType { NameEn = $"Essay-{suffix}", NameAr = $"Essay-{suffix}" };
        var exam = new Exam
        {
            Department = department, TitleEn = "Concurrency", TitleAr = "Concurrency",
            DurationMinutes = 60, MaxAttempts = 1, IsPublished = true
        };
        var section = new ExamSection { Exam = exam, TitleEn = "Section", TitleAr = "Section", Order = 1 };
        var questions = Enumerable.Range(1, questionCount).Select(i => new Question
        {
            BodyEn = $"Question {i}", BodyAr = $"Question {i}", QuestionType = type, Subject = subject, Points = 1
        }).ToArray();
        db.ExamQuestions.AddRange(questions.Select((question, index) => new ExamQuestion
        {
            Exam = exam, ExamSection = section, Question = question, Order = index + 1, Points = 1
        }));
        var candidates = Enumerable.Range(0, candidateCount).Select(_ => Guid.NewGuid().ToString("N")).ToArray();
        db.Users.AddRange(candidates.Select(id => new ApplicationUser
        {
            Id = id, UserName = id, NormalizedUserName = id.ToUpperInvariant(), Department = department
        }));
        await db.SaveChangesAsync();
        return new Seed(exam.Id, questions.Select(q => q.Id).ToArray(), candidates);
    }

    private sealed record Seed(int ExamId, int[] QuestionIds, string[] Candidates);

    private sealed class NoGradingScopeFactory : IServiceScopeFactory
    {
        public IServiceScope CreateScope() =>
            throw new NotSupportedException("Background grading is outside these persistence regression tests.");
    }

    private sealed class PauseBeforeSave : SaveChangesInterceptor
    {
        private int _paused;
        public TaskCompletionSource Entered { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public TaskCompletionSource Release { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            if (Interlocked.Exchange(ref _paused, 1) == 0)
            {
                Entered.TrySetResult();
                await Release.Task.WaitAsync(TimeSpan.FromSeconds(20), cancellationToken);
            }
            return result;
        }
    }

    private sealed class TestHub : IHubContext<ProctorHub>
    {
        public IHubClients Clients { get; } = new TestClients();
        public IGroupManager Groups => throw new NotSupportedException();
    }

    private sealed class TestClients : IHubClients, IClientProxy
    {
        public IClientProxy All => this;
        public IClientProxy AllExcept(IReadOnlyList<string> excludedConnectionIds) => this;
        public IClientProxy Client(string connectionId) => this;
        public IClientProxy Clients(IReadOnlyList<string> connectionIds) => this;
        public IClientProxy Group(string groupName) => this;
        public IClientProxy GroupExcept(string groupName, IReadOnlyList<string> excludedConnectionIds) => this;
        public IClientProxy Groups(IReadOnlyList<string> groupNames) => this;
        public IClientProxy User(string userId) => this;
        public IClientProxy Users(IReadOnlyList<string> userIds) => this;
        public Task SendCoreAsync(string method, object?[] args, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}

public sealed class SqlServerConcurrencyTheoryAttribute : TheoryAttribute
{
    public SqlServerConcurrencyTheoryAttribute()
    {
        if (string.IsNullOrWhiteSpace(SqlServerFactAttribute.ConnectionString))
            Skip = "Set TEST_SQLSERVER_CONNECTION to an isolated SQL Server Developer instance.";
    }
}
