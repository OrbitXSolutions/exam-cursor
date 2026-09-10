using Serilog;
using Serilog.Core;
using Serilog.Events;

namespace Backend_API.Tests;

public sealed class AsyncLoggingTests
{
    [Fact]
    public async Task SlowDiagnosticSinkCannotBlockCallersWhenBufferIsFull()
    {
        using var sink = new BlockingSink();
        using var logger = new LoggerConfiguration()
            .WriteTo.Async(write => write.Sink(sink), bufferSize: 1, blockWhenFull: false)
            .CreateLogger();
        logger.Information("First diagnostic");
        try
        {
            await sink.Started.Task.WaitAsync(TimeSpan.FromSeconds(5));
            await Task.Run(() =>
            {
                for (var i = 0; i < 100; i++)
                    logger.Information("Diagnostic {Number}", i);
            }).WaitAsync(TimeSpan.FromSeconds(5));

            Assert.Equal(1, sink.Emitted);
        }
        finally
        {
            sink.Release.Set();
        }
    }

    private sealed class BlockingSink : ILogEventSink, IDisposable
    {
        private int _emitted;
        public int Emitted => Volatile.Read(ref _emitted);
        public TaskCompletionSource Started { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public ManualResetEventSlim Release { get; } = new();

        public void Emit(LogEvent logEvent)
        {
            Interlocked.Increment(ref _emitted);
            Started.TrySetResult();
            Release.Wait(TimeSpan.FromSeconds(15));
        }

        public void Dispose() => Release.Dispose();
    }
}
