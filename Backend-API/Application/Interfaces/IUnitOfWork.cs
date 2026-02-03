using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Application.Interfaces;

/// <summary>
/// Simple Unit of Work that doesn't over-abstract EF Core.
/// Provides transaction management and direct DbContext access.
/// </summary>
public interface IUnitOfWork : IDisposable
{
    /// <summary>
    /// Direct access to the DbContext for queries and operations.
    /// Use this when you need full EF Core capabilities.
    /// </summary>
    ApplicationDbContext Context { get; }
    
    /// <summary>
    /// Saves all changes made in this context to the database.
    /// </summary>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Begins a database transaction.
    /// </summary>
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Commits the current transaction.
    /// </summary>
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Rolls back the current transaction.
    /// </summary>
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
