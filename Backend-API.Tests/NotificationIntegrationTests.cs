using System.Collections.Concurrent;
using System.Data.Common;
using System.Reflection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Smart_Core.Application.DTOs.ExamAssignment;
using Smart_Core.Application.DTOs.ExamResult;
using Smart_Core.Application.DTOs.Notification;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Entities.ExamResult;
using Smart_Core.Domain.Entities.Notification;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;
using Smart_Core.Infrastructure.Hubs;
using Smart_Core.Infrastructure.Persistence;
using Smart_Core.Infrastructure.Services;
using Smart_Core.Infrastructure.Services.Authorization;
using Smart_Core.Infrastructure.Services.ExamAssignment;
using Smart_Core.Infrastructure.Services.ExamResult;
using Smart_Core.Infrastructure.Services.Notification;
using AttemptEntity = Smart_Core.Domain.Entities.Attempt.Attempt;

namespace Backend_API.Tests;

public sealed class NotificationIntegrationTests
{
    [SqlServerFact]
    public async Task WorkerSelectsEachEmailTemplateAndCredentialFreeSmsEventWithoutDecryptingUnusedPassword()
    {
        await using var fixture = await NotificationDatabase.CreateAsync();
        await using var db = fixture.Database();
        var (candidate, exam) = await SeedAsync(db);
        foreach (var type in Enum.GetValues<NotificationEventType>())
        {
            db.NotificationTemplates.Add(new NotificationTemplate
            {
                EventType = type, SubjectEn = $"{type}: {{{{ExamTitle}}}}",
                BodyEn = $"{type} for {{{{CandidateName}}}} at {{{{LoginUrl}}}}"
            });
            db.NotificationLogs.Add(Log(candidate, exam, type));
            db.NotificationLogs.Add(Log(candidate, exam, type, NotificationChannel.Sms));
        }
        await db.SaveChangesAsync();
        var provider = new RecordingDelivery();
        var encryption = new UnusedEncryption();
        await using var services = fixture.Services(provider, encryption);
        using var worker = Worker(services);
        await Cycle(worker);

        var logs = await db.NotificationLogs.AsNoTracking().ToListAsync();
        Assert.Equal(6, logs.Count);
        Assert.All(logs, log =>
        {
            Assert.Equal(NotificationStatus.Sent, log.Status);
            Assert.NotNull(log.SentAt);
        });
        Assert.Equal(3, provider.Emails.Count);
        foreach (var type in Enum.GetValues<NotificationEventType>())
            Assert.Contains(provider.Emails, e => e.Subject == $"{type}: Notification Exam"
                && e.Body.Contains($"{type} for Candidate") && !e.Body.Contains("{{"));
        Assert.Contains(provider.Sms, m => m.Contains("Login to take the exam."));
        Assert.Contains(provider.Sms, m => m.Contains("Login to view your results."));
        Assert.Contains(provider.Sms, m => m.Contains("has expired and is no longer available."));
        Assert.DoesNotContain(provider.Sms, m => m.Contains("Password"));
        Assert.Equal(0, encryption.Decryptions);
    }

    [SqlServerFact]
    public async Task MissingOrInactiveTemplatesFailWithoutCallingProviders()
    {
        await using var fixture = await NotificationDatabase.CreateAsync();
        await using var db = fixture.Database();
        var (candidate, exam) = await SeedAsync(db);
        db.NotificationTemplates.Add(new NotificationTemplate
        {
            EventType = NotificationEventType.ResultPublished, IsActive = false
        });
        db.NotificationLogs.Add(Log(candidate, exam, NotificationEventType.ExamPublished));
        db.NotificationLogs.Add(Log(candidate, exam, NotificationEventType.ResultPublished, NotificationChannel.Sms));
        await db.SaveChangesAsync();
        var provider = new RecordingDelivery();
        await using var services = fixture.Services(provider);
        using var worker = Worker(services);
        await Cycle(worker);
        Assert.Empty(provider.Emails);
        Assert.Empty(provider.Sms);
        Assert.All(await db.NotificationLogs.AsNoTracking().ToListAsync(),
            log => Assert.Equal(NotificationStatus.Failed, log.Status));
    }

    [SqlServerFact]
    public async Task WorkerHonorsIndependentEmailAndSmsBatchLimitsAcrossCycles()
    {
        await using var fixture = await NotificationDatabase.CreateAsync();
        await using var db = fixture.Database();
        var (candidate, exam) = await SeedAsync(db);
        var settings = await db.NotificationSettings.SingleAsync();
        settings.EmailBatchSize = 2;
        settings.SmsBatchSize = 3;
        db.NotificationTemplates.Add(Template());
        for (var index = 0; index < 5; index++)
        {
            db.NotificationLogs.Add(Log(candidate, exam));
            db.NotificationLogs.Add(Log(candidate, exam, channel: NotificationChannel.Sms));
        }
        await db.SaveChangesAsync();
        var provider = new RecordingDelivery();
        await using var services = fixture.Services(provider);
        using var worker = Worker(services);

        foreach (var (emails, sms) in new[] { (2, 3), (4, 5), (5, 5), (5, 5) })
        {
            await Cycle(worker);
            Assert.Equal(emails, provider.Emails.Count);
            Assert.Equal(sms, provider.Sms.Count);
            Assert.Equal(emails + sms,
                await db.NotificationLogs.CountAsync(l => l.Status == NotificationStatus.Sent));
            Assert.Equal(10 - emails - sms,
                await db.NotificationLogs.CountAsync(l => l.Status == NotificationStatus.Pending));
        }
    }

    [SqlServerFact]
    public async Task PasswordTemplatesFailSafelyThenExplicitRetryRendersSubjectAndBodyCredentials()
    {
        await using var fixture = await NotificationDatabase.CreateAsync();
        await using var db = fixture.Database();
        var (candidate, exam) = await SeedAsync(db);
        db.NotificationTemplates.AddRange(
            new NotificationTemplate
            {
                EventType = NotificationEventType.ExamPublished,
                SubjectEn = "Invitation {{Password}}", BodyEn = "Hello {{CandidateName}}"
            },
            new NotificationTemplate
            {
                EventType = NotificationEventType.ResultPublished,
                SubjectEn = "Results", BodyEn = "Credential {{Password}}"
            });
        foreach (var type in new[] { NotificationEventType.ExamPublished, NotificationEventType.ResultPublished })
        {
            db.NotificationLogs.Add(Log(candidate, exam, type));
            db.NotificationLogs.Add(Log(candidate, exam, type, NotificationChannel.Sms));
        }
        await db.SaveChangesAsync();
        var provider = new RecordingDelivery();
        var unreadable = new UnusedEncryption();
        await using (var services = fixture.Services(provider, unreadable))
        {
            using var worker = Worker(services);
            await Cycle(worker);
        }

        Assert.Equal(2, unreadable.Decryptions);
        Assert.Empty(provider.Emails);
        Assert.Equal(2, provider.Sms.Count);
        var failed = await db.NotificationLogs.AsNoTracking()
            .Where(l => l.Channel == NotificationChannel.Email).ToListAsync();
        var service = NotificationService(db);
        foreach (var row in failed)
        {
            Assert.Equal(NotificationStatus.Failed, row.Status);
            Assert.Null(row.SentAt);
            Assert.Equal("Email notification processing failed.", row.ErrorMessage);
            Assert.True((await service.RetryNotificationAsync(row.Id)).Success);
        }

        var encryption = new ReadableEncryption();
        await using (var services = fixture.Services(provider, encryption))
        {
            using var worker = Worker(services);
            await Cycle(worker);
        }
        Assert.Equal(2, encryption.Decryptions);
        Assert.Equal(2, provider.Emails.Count);
        Assert.Contains(provider.Emails, e => e.Subject == "Invitation synthetic-credential");
        Assert.Contains(provider.Emails, e => e.Body.Contains("Credential synthetic-credential"));
        Assert.Equal(2, provider.Sms.Count);
        Assert.DoesNotContain(provider.Sms, text => text.Contains("synthetic-credential"));
        Assert.All(await db.NotificationLogs.AsNoTracking().ToListAsync(),
            row => Assert.Equal(NotificationStatus.Sent, row.Status));
    }

    [SqlServerFact]
    public async Task TwoWorkerNodesCannotSendTheSamePendingRows()
    {
        await using var fixture = await NotificationDatabase.CreateAsync();
        await using var db = fixture.Database();
        var (candidate, exam) = await SeedAsync(db);
        db.NotificationTemplates.Add(Template());
        db.NotificationLogs.Add(Log(candidate, exam));
        await db.SaveChangesAsync();
        var entered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var release = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var provider = new RecordingDelivery
        {
            OnEmail = async () => { entered.SetResult(); await release.Task; return true; }
        };
        await using var firstServices = fixture.Services(provider);
        await using var secondServices = fixture.Services(provider);
        using var first = Worker(firstServices);
        using var second = Worker(secondServices);
        var sending = Cycle(first);
        try
        {
            await entered.Task.WaitAsync(TimeSpan.FromSeconds(15));
            await Cycle(second).WaitAsync(TimeSpan.FromSeconds(15));
            Assert.Single(provider.Emails);
        }
        finally
        {
            release.TrySetResult();
            await sending.WaitAsync(TimeSpan.FromSeconds(15));
        }
        await Cycle(second);
        Assert.Single(provider.Emails);
        Assert.Equal(NotificationStatus.Sent, (await db.NotificationLogs.AsNoTracking().SingleAsync()).Status);
    }

    [SqlServerFact]
    public async Task ShutdownPersistsAcceptedMessageBeforeLeavingRemainingRowsPending()
    {
        await using var fixture = await NotificationDatabase.CreateAsync();
        await using var db = fixture.Database();
        var (candidate, exam) = await SeedAsync(db);
        db.NotificationTemplates.Add(Template());
        db.NotificationLogs.AddRange(Log(candidate, exam), Log(candidate, exam));
        await db.SaveChangesAsync();
        using var shutdown = new CancellationTokenSource();
        var provider = new RecordingDelivery { OnEmail = () => { shutdown.Cancel(); return Task.FromResult(true); } };
        await using var services = fixture.Services(provider);
        using var worker = Worker(services);
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => Cycle(worker, shutdown.Token));
        var logs = await db.NotificationLogs.AsNoTracking().ToListAsync();
        Assert.Single(logs, l => l.Status == NotificationStatus.Sent);
        Assert.Single(logs, l => l.Status == NotificationStatus.Pending);
        provider.OnEmail = () => Task.FromResult(false);
        await Cycle(worker);
        logs = await db.NotificationLogs.AsNoTracking().ToListAsync();
        Assert.Single(logs, l => l.Status == NotificationStatus.Sent);
        Assert.Single(logs, l => l.Status == NotificationStatus.Failed && l.SentAt == null);
        Assert.Equal(2, provider.Emails.Count);
    }

    [SqlServerFact]
    public async Task AssignmentDeduplicationIsPerChannelAndFailedRowsRemainExplicitRetries()
    {
        await using var fixture = await NotificationDatabase.CreateAsync();
        await using var db = fixture.Database();
        var (candidate, exam) = await SeedAsync(db);
        var service = NotificationService(db);
        var settings = await db.NotificationSettings.SingleAsync();
        settings.EnableEmail = false;
        await db.SaveChangesAsync();
        await service.QueueExamPublishedForCandidatesAsync(exam.Id, [candidate.Id, candidate.Id]);
        await service.QueueExamPublishedForCandidatesAsync(exam.Id, [candidate.Id]);
        Assert.Single(await db.NotificationLogs.ToListAsync());

        settings.EnableEmail = true;
        await db.SaveChangesAsync();
        await service.QueueExamPublishedForCandidatesAsync(exam.Id, [candidate.Id]);
        Assert.Equal(2, await db.NotificationLogs.CountAsync());
        var email = await db.NotificationLogs.SingleAsync(l => l.Channel == NotificationChannel.Email);
        email.Status = NotificationStatus.Failed;
        await db.SaveChangesAsync();
        await service.QueueExamPublishedForCandidatesAsync(exam.Id, [candidate.Id]);
        Assert.Equal(2, await db.NotificationLogs.CountAsync());
        Assert.True((await service.RetryNotificationAsync(email.Id)).Success);
        Assert.Equal(NotificationStatus.Pending,
            (await db.NotificationLogs.AsNoTracking().SingleAsync(l => l.Id == email.Id)).Status);

        exam.IsPublished = false;
        var another = new ApplicationUser { Id = "unpublished-recipient", Email = "other@example.invalid" };
        db.Users.Add(another);
        await db.SaveChangesAsync();
        await service.QueueExamPublishedForCandidatesAsync(exam.Id, [another.Id]);
        Assert.Equal(2, await db.NotificationLogs.CountAsync());
    }

    [SqlServerFact]
    public async Task MultiplePublishedAttemptsQueueOneResultEmailWithoutAddingSmsOrExpiryTriggers()
    {
        await using var fixture = await NotificationDatabase.CreateAsync();
        await using var db = fixture.Database();
        var (candidate, exam) = await SeedAsync(db);
        for (var attempt = 1; attempt <= 2; attempt++)
        {
            db.Results.Add(new Result
            {
                Candidate = candidate, Exam = exam, IsPublishedToCandidate = true,
                Attempt = new AttemptEntity
                {
                    Candidate = candidate, Exam = exam, AttemptNumber = attempt,
                    Status = AttemptStatus.Submitted, StartedAt = DateTimeOffset.UtcNow
                },
                FinalizedAt = DateTimeOffset.UtcNow
            });
        }
        await db.SaveChangesAsync();
        var service = NotificationService(db);
        await service.QueueResultPublishedNotificationsAsync(exam.Id);
        await service.QueueResultPublishedNotificationsAsync(exam.Id);
        var log = await db.NotificationLogs.SingleAsync();
        Assert.Equal(NotificationChannel.Email, log.Channel);
        Assert.Equal(NotificationEventType.ResultPublished, log.EventType);
    }

    [SqlServerFact]
    public async Task AssignmentProducerQueuesBothChannelsOnlyForNewAssignments()
    {
        await using var fixture = await NotificationDatabase.CreateAsync();
        await using var db = fixture.Database();
        var (candidate, exam) = await SeedAsync(db);
        db.NotificationTemplates.Add(Template());
        await db.SaveChangesAsync();
        var service = new ExamAssignmentService(db, null!, NotificationService(db),
            NullLogger<ExamAssignmentService>.Instance, new CacheService());
        var request = new AssignExamDto
        {
            ExamId = exam.Id, CandidateIds = [candidate.Id, candidate.Id],
            ScheduleFrom = DateTimeOffset.UtcNow, ScheduleTo = DateTimeOffset.UtcNow.AddHours(2)
        };
        Assert.True((await service.AssignAsync(request, "operator")).Success);
        Assert.Single(await db.ExamAssignments.ToListAsync());
        Assert.Equal(2, await db.NotificationLogs.CountAsync());
        request.ScheduleTo = request.ScheduleTo.AddHours(1);
        Assert.True((await service.AssignAsync(request, "operator")).Success);
        Assert.Equal(2, await db.NotificationLogs.CountAsync());

        var provider = new RecordingDelivery();
        await using var services = fixture.Services(provider);
        using var worker = Worker(services);
        await Cycle(worker);
        Assert.Single(provider.Emails);
        Assert.Single(provider.Sms);
    }

    [SqlServerFact]
    public async Task BulkResultPublicationProducerPersistsOneEmailForMultipleAttempts()
    {
        await using var fixture = await NotificationDatabase.CreateAsync();
        await using var db = fixture.Database();
        var (candidate, exam) = await SeedAsync(db);
        db.Roles.Add(new ApplicationRole { Id = "SuperAdmin", Name = "SuperAdmin", NormalizedName = "SUPERADMIN" });
        db.Users.Add(new ApplicationUser { Id = "publisher", UserName = "publisher" });
        db.UserRoles.Add(new IdentityUserRole<string> { UserId = "publisher", RoleId = "SuperAdmin" });
        for (var attempt = 1; attempt <= 2; attempt++)
        {
            db.Results.Add(new Result
            {
                Candidate = candidate, Exam = exam,
                Attempt = new AttemptEntity
                {
                    Candidate = candidate, Exam = exam, AttemptNumber = attempt,
                    Status = AttemptStatus.Submitted, StartedAt = DateTimeOffset.UtcNow
                },
                FinalizedAt = DateTimeOffset.UtcNow
            });
        }
        db.NotificationTemplates.Add(new NotificationTemplate
        {
            EventType = NotificationEventType.ResultPublished, SubjectEn = "Published result",
            BodyEn = "Results for {{ExamTitle}}"
        });
        await db.SaveChangesAsync();
        await using var identityServices = fixture.IdentityServices();
        await using var scope = identityServices.CreateAsyncScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var service = new ExamResultService(db, null!, null!, null!, userManager, NotificationService(db),
            new CacheService(), new ResourceAuthorizationService(db, userManager, null!));
        var request = new BulkPublishResultsDto { ResultIds = await db.Results.Select(r => r.Id).ToListAsync() };

        var response = await service.BulkPublishResultsAsync(request, "publisher");
        Assert.True(response.Success);
        Assert.Equal(2, response.Data);
        Assert.Equal(2, await db.Results.CountAsync(r => r.IsPublishedToCandidate));
        Assert.True((await service.BulkPublishResultsAsync(request, "publisher")).Success);
        var row = await db.NotificationLogs.SingleAsync();
        Assert.Equal(NotificationChannel.Email, row.Channel);
        Assert.Equal(NotificationEventType.ResultPublished, row.EventType);

        var provider = new RecordingDelivery();
        await using var services = fixture.Services(provider);
        using var worker = Worker(services);
        await Cycle(worker);
        Assert.Single(provider.Emails);
        Assert.Empty(provider.Sms);
    }

    [SqlServerFact]
    public async Task RetryAndSendNowNeverOverwriteAConcurrentlyCompletedDelivery()
    {
        await using var fixture = await NotificationDatabase.CreateAsync();
        await using var seed = fixture.Database();
        var (candidate, exam) = await SeedAsync(seed);
        var row = Log(candidate, exam);
        row.Status = NotificationStatus.Failed;
        seed.NotificationLogs.Add(row);
        await seed.SaveChangesAsync();

        foreach (var retry in new[] { true, false })
        {
            await seed.NotificationLogs.Where(l => l.Id == row.Id)
                .ExecuteUpdateAsync(s => s.SetProperty(l => l.Status, NotificationStatus.Failed));
            var race = new BeforeUpdate(async () =>
            {
                await using var workerDb = fixture.Database();
                await workerDb.NotificationLogs.Where(l => l.Id == row.Id)
                    .ExecuteUpdateAsync(s => s.SetProperty(l => l.Status, NotificationStatus.Sent));
            });
            await using var requestDb = fixture.Database(race);
            var service = NotificationService(requestDb);
            var response = retry ? await service.RetryNotificationAsync(row.Id) : await service.SendNowAsync(row.Id);
            Assert.False(response.Success);
            Assert.True(race.Executed);
            var persisted = await seed.NotificationLogs.AsNoTracking().SingleAsync();
            Assert.Equal(NotificationStatus.Sent, persisted.Status);
            Assert.Equal(0, persisted.RetryCount);
        }
    }

    [SqlServerFact]
    public async Task ScopedStartAndSubmitNotificationsPersistForDepartmentRolesAndGlobalSuperAdminOnly()
    {
        await using var fixture = await NotificationDatabase.CreateAsync();
        await using var db = fixture.Database();
        var (candidate, exam) = await SeedAsync(db);
        var otherDepartment = new Department { NameEn = "Other", NameAr = "Other", Code = "OTHER" };
        db.Departments.Add(otherDepartment);
        foreach (var role in new[] { "SuperAdmin", "Admin", "Proctor" })
            db.Roles.Add(new ApplicationRole { Id = role, Name = role, NormalizedName = role.ToUpperInvariant() });
        var recipients = new[]
        {
            new ApplicationUser { Id = "global", Department = otherDepartment },
            new ApplicationUser { Id = "admin", Department = exam.Department },
            new ApplicationUser { Id = "proctor", Department = exam.Department },
            new ApplicationUser { Id = "other", Department = otherDepartment }
        };
        db.Users.AddRange(recipients);
        db.UserRoles.AddRange(
            new IdentityUserRole<string> { UserId = "global", RoleId = "SuperAdmin" },
            new IdentityUserRole<string> { UserId = "admin", RoleId = "Admin" },
            new IdentityUserRole<string> { UserId = "admin", RoleId = "Proctor" },
            new IdentityUserRole<string> { UserId = "proctor", RoleId = "Proctor" },
            new IdentityUserRole<string> { UserId = "other", RoleId = "Admin" });
        await db.SaveChangesAsync();
        var hub = new RecordingNotificationHub();
        await using var identityServices = fixture.IdentityServices();
        await using var scope = identityServices.CreateAsyncScope();
        var service = new UserNotificationService(new UnitOfWork(db), hub,
            scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>(),
            NullLogger<UserNotificationService>.Instance);
        foreach (var type in new[] { UserNotificationType.CandidateStartedExam, UserNotificationType.CandidateSubmittedExam })
            await service.CreateForRolesScopedAsync(["SuperAdmin", "Admin", "Proctor"],
                type, "Title", "Title", "Message", "Message", exam.Id, actorUserId: candidate.Id);

        Assert.Equal(6, await db.UserNotifications.CountAsync());
        Assert.Equal(6, hub.Pushes.Count);
        Assert.DoesNotContain(hub.Pushes, p => p.Group is "user-other" or "user-candidate");
        Assert.All(hub.Pushes, p =>
        {
            Assert.Equal("ReceiveNotification", p.Method);
            Assert.Contains("Notification Exam", p.Notification.MessageEn);
            Assert.Contains("candidate@example.invalid", p.Notification.MessageEn);
        });
        Assert.Equal(2, await service.GetUnreadCountAsync("admin"));
        var page = await service.GetPagedAsync("admin", 1, 20);
        Assert.Equal(2, page.TotalCount);
        await service.MarkAsReadAsync("other", page.Items[0].Id);
        Assert.Equal(2, await service.GetUnreadCountAsync("admin"));
        await service.MarkAsReadAsync("admin", page.Items[0].Id);
        Assert.Equal(1, await service.GetUnreadCountAsync("admin"));
        await service.MarkAllAsReadAsync("admin");
        Assert.Equal(0, await service.GetUnreadCountAsync("admin"));
        Assert.Equal(2, await service.GetUnreadCountAsync("proctor"));
        Assert.Empty((await service.GetPagedAsync("other", 1, 20)).Items);
    }

    [SqlServerFact]
    public async Task FailedPushIsObservedAfterPersistenceAndDoesNotLoseRestNotification()
    {
        await using var fixture = await NotificationDatabase.CreateAsync();
        await using var db = fixture.Database();
        var (candidate, exam) = await SeedAsync(db);
        var pending = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var entered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var hub = new RecordingNotificationHub
        {
            OnSend = () => { entered.SetResult(); return pending.Task; }
        };
        var logger = new RecordingLogger<UserNotificationService>();
        var service = new UserNotificationService(new UnitOfWork(db), hub, null!, logger);
        var creating = service.CreateAsync(candidate.Id, UserNotificationType.ExamAssigned,
            "Assigned", "Assigned", "Message", "Message", exam.Id);
        await entered.Task.WaitAsync(TimeSpan.FromSeconds(15));
        try
        {
            Assert.False(creating.IsCompleted);
            await using var reading = fixture.Database();
            Assert.Single(await reading.UserNotifications.ToListAsync());
        }
        finally
        {
            pending.TrySetException(new InvalidOperationException("synthetic transport outage"));
            await creating.WaitAsync(TimeSpan.FromSeconds(15));
        }
        Assert.Equal(1, await service.GetUnreadCountAsync(candidate.Id));
        Assert.Single(logger.Entries);
    }

    [SqlServerFact]
    public async Task SlowPushReceivesCancellationAndLeavesItsPersistedNotificationReadable()
    {
        await using var fixture = await NotificationDatabase.CreateAsync();
        await using var db = fixture.Database();
        var (candidate, exam) = await SeedAsync(db);
        var entered = new TaskCompletionSource<CancellationToken>(TaskCreationOptions.RunContinuationsAsynchronously);
        var hub = new RecordingNotificationHub
        {
            OnSendWithCancellation = token =>
            {
                entered.SetResult(token);
                return Task.Delay(Timeout.InfiniteTimeSpan, token);
            }
        };
        var logger = new RecordingLogger<UserNotificationService>();
        var service = new UserNotificationService(new UnitOfWork(db), hub, null!, logger);
        var creating = service.CreateAsync(candidate.Id, UserNotificationType.ExamAssigned,
            "Assigned", "Assigned", "Message", "Message", exam.Id);
        var token = await entered.Task.WaitAsync(TimeSpan.FromSeconds(15));
        Assert.True(token.CanBeCanceled);
        await using (var reading = fixture.Database())
            Assert.Single(await reading.UserNotifications.ToListAsync());

        await creating.WaitAsync(TimeSpan.FromSeconds(15));
        Assert.True(token.IsCancellationRequested);
        Assert.Equal(1, await service.GetUnreadCountAsync(candidate.Id));
        Assert.Single(logger.Entries);
    }

    [SqlServerFact]
    public async Task DispatcherUsesIndependentScopeToPersistAndPushUserNotification()
    {
        await using var fixture = await NotificationDatabase.CreateAsync();
        int examId;
        string candidateId;
        await using (var db = fixture.Database())
        {
            var (candidate, exam) = await SeedAsync(db);
            examId = exam.Id;
            candidateId = candidate.Id;
        }

        var delivered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var hub = new RecordingNotificationHub { OnSend = () => { delivered.TrySetResult(); return Task.CompletedTask; } };
        var logger = new RecordingLogger<NotificationDispatcher>();
        await using var services = new ServiceCollection()
            .AddScoped(_ => fixture.Database())
            .AddScoped<IUnitOfWork, UnitOfWork>()
            .AddScoped<IUserNotificationService>(sp => new UserNotificationService(
                sp.GetRequiredService<IUnitOfWork>(), hub, null!, NullLogger<UserNotificationService>.Instance))
            .BuildServiceProvider();
        var dispatcher = new NotificationDispatcher(services.GetRequiredService<IServiceScopeFactory>(), logger);
        dispatcher.NotifyUser(candidateId, UserNotificationType.ExamAssigned,
            "Assigned", "Assigned", "Message", "Message", examId);

        await delivered.Task.WaitAsync(TimeSpan.FromSeconds(15));
        await using var reading = fixture.Database();
        var row = await reading.UserNotifications.SingleAsync();
        Assert.Equal(candidateId, row.UserId);
        Assert.Equal(examId, row.RelatedExamId);
        Assert.Equal(UserNotificationType.ExamAssigned, row.Type);
        Assert.Equal($"user-{candidateId}", Assert.Single(hub.Pushes).Group);
        Assert.Empty(logger.Entries);
    }

    internal static async Task<(ApplicationUser Candidate, Exam Exam)> SeedAsync(ApplicationDbContext db)
    {
        var candidate = new ApplicationUser
        {
            Id = "candidate", UserName = "candidate", NormalizedUserName = "CANDIDATE",
            Email = "candidate@example.invalid", FullName = "Candidate", PhoneNumber = "+15555550101",
            EncryptedPassword = "synthetic-unreadable-ciphertext"
        };
        var exam = new Exam
        {
            Department = new Department { NameEn = "Testing", NameAr = "Testing", Code = "TEST" },
            TitleEn = "Notification Exam", TitleAr = "Notification Exam", IsPublished = true, DurationMinutes = 60
        };
        db.AddRange(candidate, exam, new NotificationSettings
        {
            EnableEmail = true, EnableSms = true, BatchDelayMs = 0,
            LoginUrl = "https://exam.example.invalid/login"
        });
        await db.SaveChangesAsync();
        return (candidate, exam);
    }

    private static NotificationLog Log(ApplicationUser candidate, Exam exam,
        NotificationEventType type = NotificationEventType.ExamPublished,
        NotificationChannel channel = NotificationChannel.Email) => new()
        {
            Candidate = candidate, Exam = exam, EventType = type, Channel = channel,
            Status = NotificationStatus.Pending, RecipientEmail = candidate.Email!,
            RecipientPhone = candidate.PhoneNumber
        };

    private static NotificationTemplate Template() => new()
    {
        EventType = NotificationEventType.ExamPublished, SubjectEn = "Exam", BodyEn = "Exam invitation"
    };

    private static NotificationService NotificationService(ApplicationDbContext db) =>
        new(db, new UnusedEncryption(), new RecordingDelivery(), new RecordingDelivery(),
            NullLogger<NotificationService>.Instance);

    private static NotificationBackgroundService Worker(IServiceProvider services) =>
        new(services, NullLogger<NotificationBackgroundService>.Instance, TestEnvironment.Configuration());

    private static Task Cycle(NotificationBackgroundService worker, CancellationToken token = default) =>
        (Task)typeof(NotificationBackgroundService)
            .GetMethod("ProcessPendingNotificationsAsync", BindingFlags.NonPublic | BindingFlags.Instance)!
            .Invoke(worker, [token])!;

    private sealed class BeforeUpdate(Func<Task> before) : DbCommandInterceptor
    {
        public bool Executed { get; private set; }
        public override async ValueTask<InterceptionResult<int>> NonQueryExecutingAsync(DbCommand command,
            CommandEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            if (!Executed && command.CommandText.StartsWith("UPDATE", StringComparison.Ordinal))
            {
                Executed = true;
                await before();
            }
            return result;
        }
    }
}

internal sealed class NotificationDatabase : IAsyncDisposable
{
    private readonly string _connection;
    private NotificationDatabase(string connection) => _connection = connection;
    public static async Task<NotificationDatabase> CreateAsync()
    {
        var builder = new SqlConnectionStringBuilder(SqlServerFactAttribute.ConnectionString)
        {
            InitialCatalog = "Phase2Notifications_" + Guid.NewGuid().ToString("N"), Pooling = false
        };
        var fixture = new NotificationDatabase(builder.ConnectionString);
        await using var db = fixture.Database();
        try { await db.Database.EnsureCreatedAsync(); }
        catch { await fixture.DisposeAsync(); throw; }
        return fixture;
    }

    public ApplicationDbContext Database(params IInterceptor[] interceptors) =>
        new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(_connection).AddInterceptors(interceptors).Options);

    public ServiceProvider Services(RecordingDelivery provider, IEncryptionService? encryption = null) =>
        new ServiceCollection().AddScoped(_ => Database())
            .AddSingleton<IEmailService>(provider).AddSingleton<ISmsService>(provider)
            .AddSingleton(encryption ?? new UnusedEncryption()).BuildServiceProvider();

    public ServiceProvider IdentityServices()
    {
        var services = new ServiceCollection().AddLogging().AddScoped(_ => Database());
        services.AddIdentityCore<ApplicationUser>().AddRoles<ApplicationRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>();
        return services.BuildServiceProvider();
    }

    public async ValueTask DisposeAsync()
    {
        await using var db = Database();
        await db.Database.EnsureDeletedAsync();
    }
}

internal sealed class UnusedEncryption : IEncryptionService
{
    public int Decryptions { get; private set; }
    public string Encrypt(string value) => throw new NotSupportedException();
    public string Decrypt(string value)
    {
        Decryptions++;
        throw new InvalidOperationException("Unneeded credential decryption");
    }
}

internal sealed class ReadableEncryption : IEncryptionService
{
    public int Decryptions { get; private set; }
    public string Encrypt(string value) => throw new NotSupportedException();
    public string Decrypt(string value)
    {
        Decryptions++;
        return "synthetic-credential";
    }
}

internal sealed class RecordingDelivery : IEmailService, ISmsService
{
    public ConcurrentQueue<(string Subject, string Body)> Emails { get; } = new();
    public ConcurrentQueue<string> Sms { get; } = new();
    public Func<Task<bool>> OnEmail { get; set; } = () => Task.FromResult(true);
    public Task<bool> SendEmailAsync(string to, string subject, string body, bool isHtml = true)
    {
        Emails.Enqueue((subject, body));
        return OnEmail();
    }
    public Task<bool> SendSmsAsync(string phoneNumber, string message)
    {
        Sms.Enqueue(message);
        return Task.FromResult(true);
    }
    public Task<bool> SendEmailAsync(List<string> to, string subject, string body, bool isHtml = true) => throw new NotSupportedException();
    public Task<(bool Success, string? Error)> SendEmailWithDetailAsync(string to, string subject, string body, bool isHtml = true) => throw new NotSupportedException();
    public Task<bool> SendPasswordResetEmailAsync(string to, string resetLink) => throw new NotSupportedException();
    public Task<bool> SendEmailConfirmationAsync(string to, string confirmationLink) => throw new NotSupportedException();
    public Task<bool> SendWelcomeEmailAsync(string to, string displayName) => throw new NotSupportedException();
    public Task<bool> SendVerificationCodeAsync(string phoneNumber, string code) => throw new NotSupportedException();
    public Task<bool> SendBulkSmsAsync(List<string> phoneNumbers, string message) => throw new NotSupportedException();
}

internal sealed class RecordingNotificationHub : IHubContext<NotificationHub>, IHubClients
{
    public ConcurrentQueue<(string Group, string Method, UserNotificationDto Notification)> Pushes { get; } = new();
    public Func<Task> OnSend { get; set; } = () => Task.CompletedTask;
    public Func<CancellationToken, Task>? OnSendWithCancellation { get; set; }
    IHubClients IHubContext<NotificationHub>.Clients => this;
    IGroupManager IHubContext<NotificationHub>.Groups => throw new NotSupportedException();
    public IClientProxy Group(string groupName) => new Proxy(this, groupName);
    public IClientProxy All => throw new NotSupportedException();
    public IClientProxy AllExcept(IReadOnlyList<string> excludedConnectionIds) => throw new NotSupportedException();
    public IClientProxy Client(string connectionId) => throw new NotSupportedException();
    public IClientProxy Clients(IReadOnlyList<string> connectionIds) => throw new NotSupportedException();
    public IClientProxy GroupExcept(string groupName, IReadOnlyList<string> excludedConnectionIds) => throw new NotSupportedException();
    public IClientProxy Groups(IReadOnlyList<string> groupNames) => throw new NotSupportedException();
    public IClientProxy User(string userId) => throw new NotSupportedException();
    public IClientProxy Users(IReadOnlyList<string> userIds) => throw new NotSupportedException();
    private sealed class Proxy(RecordingNotificationHub hub, string group) : IClientProxy
    {
        public Task SendCoreAsync(string method, object?[] args, CancellationToken cancellationToken = default)
        {
            hub.Pushes.Enqueue((group, method, Assert.IsType<UserNotificationDto>(args[0])));
            return hub.OnSendWithCancellation?.Invoke(cancellationToken) ?? hub.OnSend();
        }
    }
}
