using Smart_Core.Application.Interfaces;

namespace Smart_Core.Infrastructure.Services;

public class CacheService : ICacheService
{
    // Always use the authoritative database. Local invalidation cannot keep
    // read caches coherent when requests are balanced across multiple servers.

    public T? Get<T>(string key)
    {
        return default;
    }

    public bool TryGet<T>(string key, out T? value)
    {
        value = default;
        return false;
    }

    public void Set<T>(string key, T value, TimeSpan? expiration = null)
    {
    }

    public void Remove(string key)
    {
    }

    public void RemoveByPrefix(string prefix)
    {
    }

    public Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null)
    {
        return factory();
    }
}
