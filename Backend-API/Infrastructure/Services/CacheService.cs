using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Smart_Core.Application.Interfaces;
using StackExchange.Redis;

namespace Smart_Core.Infrastructure.Services;

public class CacheService : ICacheService
{
    private readonly IDistributedCache _distributedCache;
    private readonly IConnectionMultiplexer? _connectionMultiplexer;
    private readonly ILogger<CacheService> _logger;
    private static readonly TimeSpan DefaultExpiration = TimeSpan.FromMinutes(30);

    public CacheService(
        IDistributedCache distributedCache,
        ILogger<CacheService> logger,
        IConnectionMultiplexer? connectionMultiplexer = null)
    {
        _distributedCache = distributedCache;
        _connectionMultiplexer = connectionMultiplexer;
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        try
        {
            var cachedValue = await _distributedCache.GetStringAsync(key);
            if (string.IsNullOrEmpty(cachedValue))
            {
                return default;
            }

            return JsonSerializer.Deserialize<T>(cachedValue);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get cache for key {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        try
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiration ?? DefaultExpiration
            };

            var serializedValue = JsonSerializer.Serialize(value);
            await _distributedCache.SetStringAsync(key, serializedValue, options);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to set cache for key {Key}", key);
        }
    }

    public async Task RemoveAsync(string key)
    {
        try
        {
            await _distributedCache.RemoveAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to remove cache for key {Key}", key);
        }
    }

    public async Task RemoveByPrefixAsync(string prefix)
    {
        try
        {
            // Only works with Redis - skip if using in-memory cache
            if (_connectionMultiplexer == null || !_connectionMultiplexer.IsConnected)
            {
                _logger.LogDebug("RemoveByPrefix skipped - Redis not available. Using in-memory cache.");
                return;
            }

            var server = _connectionMultiplexer.GetServer(_connectionMultiplexer.GetEndPoints().First());
            var keys = server.Keys(pattern: $"SmartCore_{prefix}*").ToArray();

            if (keys.Length > 0)
            {
                var db = _connectionMultiplexer.GetDatabase();
                await db.KeyDeleteAsync(keys);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to remove cache by prefix {Prefix}", prefix);
        }
    }

    public async Task<bool> ExistsAsync(string key)
    {
        try
        {
            var cachedValue = await _distributedCache.GetStringAsync(key);
            return !string.IsNullOrEmpty(cachedValue);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to check cache existence for key {Key}", key);
            return false;
        }
    }
}
