using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Lookups;
using Smart_Core.Infrastructure.Data;

namespace Backend_API.Tests;

[Trait("Category", "SqlServer")]
public sealed class MigrationBootstrapTests : IAsyncLifetime
{
    private const string BeforeSubjectDepartments =
        "20260306031036_AddMaxViolationWarningsAndCountableViolationCount";
    private string? _connectionString;

    public Task InitializeAsync()
    {
        if (SqlServerFactAttribute.ConnectionString is { } connectionString)
            _connectionString = new SqlConnectionStringBuilder(connectionString)
            {
                InitialCatalog = "RegressionMigrations_" + Guid.NewGuid().ToString("N"),
                Pooling = false
            }.ConnectionString;
        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        if (_connectionString == null) return;
        await using var database = Database();
        await database.Database.EnsureDeletedAsync();
    }

    [SqlServerFact]
    public async Task FreshDatabaseAppliesEveryMigrationAndKeepsSeededSubjectWithRequiredDepartment()
    {
        await using var database = Database();
        await database.Database.MigrateAsync();
        await database.Database.MigrateAsync();

        Assert.Empty(await database.Database.GetPendingMigrationsAsync());
        var subject = Assert.Single(await database.QuestionSubjects.ToListAsync());
        var department = Assert.Single(await database.Departments.ToListAsync());
        Assert.Equal("General", subject.NameEn);
        Assert.Equal("عام", subject.NameAr);
        Assert.Equal(department.Id, subject.DepartmentId);
        Assert.True(department.IsActive);
        Assert.False(department.IsDeleted);

        // The repair must retain the required foreign key, not bypass it for bootstrap.
        var error = await Assert.ThrowsAsync<SqlException>(() => database.Database.ExecuteSqlRawAsync(
            "UPDATE QuestionSubjects SET DepartmentId = 0"));
        Assert.Equal(547, error.Number);
    }

    [SqlServerFact]
    public async Task UpgradePreservesSubjectsAndUsesFirstNondeletedExistingDepartment()
    {
        await using var database = Database();
        await database.GetService<IMigrator>().MigrateAsync(BeforeSubjectDepartments);
        await database.Database.ExecuteSqlRawAsync("""
            INSERT INTO Departments (NameEn, NameAr, Code, IsActive, CreatedDate, IsDeleted)
            VALUES (N'Archived', N'Archived-ar', N'ARCHIVE', 0, GETUTCDATE(), 1),
                   (N'First', N'First-ar', N'FIRST', 1, GETUTCDATE(), 0),
                   (N'Second', N'Second-ar', N'SECOND', 1, GETUTCDATE(), 0);
            INSERT INTO QuestionSubjects (NameEn, NameAr, CreatedDate, CreatedBy, IsDeleted)
            VALUES (N'Existing', N'Existing-ar', GETUTCDATE(), N'OriginalOwner', 0);
            """);

        await database.Database.MigrateAsync();

        var departments = await database.Departments.IgnoreQueryFilters().OrderBy(d => d.Id).ToListAsync();
        Assert.Equal(3, departments.Count);
        Assert.True(departments[0].IsDeleted);
        var subjects = await database.QuestionSubjects.OrderBy(s => s.Id).ToListAsync();
        Assert.Equal(2, subjects.Count);
        Assert.All(subjects, subject => Assert.Equal(departments[1].Id, subject.DepartmentId));
        Assert.Equal("General", subjects[0].NameEn);
        Assert.Equal("Existing", subjects[1].NameEn);
        Assert.Equal("OriginalOwner", subjects[1].CreatedBy);
    }

    [SqlServerFact]
    public async Task UpgradeDoesNotRestoreArchivedDepartmentsOrCollideWithTheirNames()
    {
        await using var database = Database();
        await database.GetService<IMigrator>().MigrateAsync(BeforeSubjectDepartments);
        await database.Database.ExecuteSqlRawAsync("""
            INSERT INTO Departments (NameEn, NameAr, IsActive, CreatedDate, IsDeleted)
            VALUES (N'General Department', N'القسم العام', 0, GETUTCDATE(), 1),
                   (N'General Department (2)', N'القسم العام (2)', 0, GETUTCDATE(), 1);
            """);

        await database.Database.MigrateAsync();

        var department = Assert.Single(await database.Departments.ToListAsync());
        Assert.Equal("General Department (3)", department.NameEn);
        Assert.Equal(2, await database.Departments.IgnoreQueryFilters().CountAsync(d => d.IsDeleted));
        Assert.Equal(department.Id, (await database.QuestionSubjects.SingleAsync()).DepartmentId);
    }

    [SqlServerFact]
    public async Task UpgradeWithoutSubjectsDoesNotCreateUnneededDepartment()
    {
        await using var database = Database();
        await database.GetService<IMigrator>().MigrateAsync(BeforeSubjectDepartments);
        await database.Database.ExecuteSqlRawAsync("DELETE FROM QuestionSubjects");

        await database.Database.MigrateAsync();

        Assert.Empty(await database.Departments.IgnoreQueryFilters().ToListAsync());
        Assert.Empty(await database.QuestionSubjects.ToListAsync());
    }

    [SqlServerFact]
    public async Task DemoSeedingAssignsSubjectsPerDepartmentAndIsRepeatableWithoutMovingExistingSubjects()
    {
        await using var database = Database();
        await database.Database.MigrateAsync();
        var existingDepartment = await database.Departments.SingleAsync();
        var existingSubject = new QuestionSubject
        {
            DepartmentId = existingDepartment.Id,
            NameEn = "Mathematics",
            NameAr = "الرياضيات",
            CreatedBy = "OriginalOwner"
        };
        database.QuestionSubjects.Add(existingSubject);
        await database.SaveChangesAsync();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<ApplicationDbContext>(options => options.UseSqlServer(_connectionString));
        services.AddIdentityCore<ApplicationUser>().AddRoles<ApplicationRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>();
        services.AddScoped<DatabaseSeeder>();
        await using var provider = services.BuildServiceProvider();
        await using var scope = provider.CreateAsyncScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
        Assert.True((await seeder.SeedAsync()).Success);
        var firstSeed = await seeder.SeedDemoDataAsync();
        Assert.True(firstSeed.Success, firstSeed.Messages.LastOrDefault());
        var originalIds = await database.QuestionSubjects.OrderBy(s => s.Id).Select(s => s.Id).ToArrayAsync();

        var secondSeed = await seeder.SeedDemoDataAsync();
        Assert.True(secondSeed.Success, secondSeed.Messages.LastOrDefault());

        Assert.Equal(originalIds,
            await database.QuestionSubjects.OrderBy(s => s.Id).Select(s => s.Id).ToArrayAsync());
        var demoDepartments = await database.Departments.Where(d => d.Code != null).ToListAsync();
        Assert.Equal(3, demoDepartments.Count);
        foreach (var department in demoDepartments)
        {
            var subjects = await database.QuestionSubjects.Where(s => s.DepartmentId == department.Id).ToListAsync();
            Assert.Equal(6, subjects.Count);
            Assert.Contains(subjects, subject => subject.NameEn == "Mathematics");
        }
        var preserved = await database.QuestionSubjects.AsNoTracking().SingleAsync(s => s.Id == existingSubject.Id);
        Assert.Equal(existingDepartment.Id, preserved.DepartmentId);
        Assert.Equal("OriginalOwner", preserved.CreatedBy);
        Assert.Equal(20, await database.QuestionSubjects.CountAsync());
        var categories = await database.QuestionCategories.ToListAsync();
        Assert.Equal(26, categories.Count);
        Assert.DoesNotContain(categories, category => category.NameAr.Contains('?'));
        Assert.Equal(14, await database.Users.CountAsync());
        var admin = await database.Users.SingleAsync(user => user.Email == "ahmed.it.admin@examcore.com");
        Assert.Equal(demoDepartments.Single(department => department.Code == "IT").Id, admin.DepartmentId);
        Assert.False(string.IsNullOrEmpty(admin.PasswordHash));
    }

    private ApplicationDbContext Database() => new(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseSqlServer(_connectionString, sql => sql.CommandTimeout(60)).Options);
}
