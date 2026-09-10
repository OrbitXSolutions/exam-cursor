using Microsoft.EntityFrameworkCore;
using Smart_Core.Infrastructure.Data;

namespace Backend_API.Tests;

public sealed class DatabaseModelTests
{
    [Fact]
    public void CurrentModelMatchesMigrationSnapshotWithoutPendingSchemaChanges()
    {
        using var database = new ApplicationDbContext(
            new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlServer("Server=unused.invalid;Database=model-regression;Integrated Security=true")
                .Options);

        Assert.False(database.Database.HasPendingModelChanges(),
            "The current EF model differs from its migration snapshot; Phase 1 must not introduce schema drift.");
    }
}
