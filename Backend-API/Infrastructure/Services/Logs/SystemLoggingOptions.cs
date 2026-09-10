namespace Smart_Core.Infrastructure.Services.Logs;

public sealed class SystemLoggingOptions
{
    public int Capacity { get; init; } = 1024;
    public int BatchSize { get; init; } = 100;
    public int FlushIntervalSeconds { get; init; } = 2;
    public int PersistenceTimeoutSeconds { get; init; } = 5;
    public int FailureBackoffSeconds { get; init; } = 5;
    public int RetentionDays { get; init; } = 30;

    public static SystemLoggingOptions FromConfiguration(IConfiguration configuration) => new()
    {
        Capacity = Read(configuration, nameof(Capacity), 1024, 1, 10000),
        BatchSize = Read(configuration, nameof(BatchSize), 100, 1, 500),
        FlushIntervalSeconds = Read(configuration, nameof(FlushIntervalSeconds), 2, 1, 30),
        PersistenceTimeoutSeconds = Read(configuration, nameof(PersistenceTimeoutSeconds), 5, 1, 30),
        FailureBackoffSeconds = Read(configuration, nameof(FailureBackoffSeconds), 5, 1, 60),
        RetentionDays = Read(configuration, nameof(RetentionDays), 30, 1, 365)
    };

    private static int Read(IConfiguration configuration, string key, int fallback, int min, int max) =>
        int.TryParse(configuration[$"SystemLogging:{key}"], out var value) ? Math.Clamp(value, min, max) : fallback;
}
