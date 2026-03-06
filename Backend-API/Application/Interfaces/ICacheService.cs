namespace Smart_Core.Application.Interfaces;

public interface ICacheService
{
    T? Get<T>(string key);
    bool TryGet<T>(string key, out T? value);
    void Set<T>(string key, T value, TimeSpan? expiration = null);
    void Remove(string key);
    void RemoveByPrefix(string prefix);

    // Async convenience: get-or-create pattern
    Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null);
}
