# Smart Core API - Implementation Complete

## ? Clean Architecture Backend Structure

A comprehensive **Clean Architecture** backend structure for .NET 9 with ASP.NET Identity, JWT Authentication, and enterprise-grade features.

---

## ?? Project Structure

```
Smart_Core/
??? Controllers/
?   ??? AuthController.cs      # JWT Auth endpoints
?   ??? UsersController.cs     # User management
?   ??? RolesController.cs     # Role management
?   ??? SeedController.cs      # Database seeding
??? Application/
?   ??? DTOs/
?   ?   ??? Common/ApiResponse.cs
?   ?   ??? Auth/AuthDtos.cs
?   ?   ??? Users/UserDtos.cs
?   ?   ??? Roles/RoleDtos.cs
?   ??? Interfaces/
?   ?   ??? IAuthService.cs
?   ?   ??? IUserService.cs
?   ?   ??? IRoleService.cs
?   ?   ??? IEmailService.cs
?   ?   ??? ISmsService.cs
?   ?   ??? ICacheService.cs
?   ?   ??? ITokenService.cs
?   ?   ??? ICurrentUserService.cs
?   ?   ??? IUnitOfWork.cs
?   ??? Validators/
?       ??? Auth/AuthValidators.cs
?       ??? Roles/RoleValidators.cs
?       ??? Users/UserValidators.cs
??? Domain/
?   ??? Common/BaseEntity.cs
?   ??? Entities/
?   ?   ??? ApplicationUser.cs
?   ?   ??? ApplicationRole.cs
?   ??? Constants/AppRoles.cs
??? Infrastructure/
  ??? Data/
    ?   ??? ApplicationDbContext.cs
    ?   ??? ApplicationDbContextFactory.cs
    ?   ??? DatabaseSeeder.cs
    ?   ??? Configurations/
    ?       ??? ApplicationUserConfiguration.cs
    ?       ??? ApplicationRoleConfiguration.cs
    ??? Services/
    ?   ??? AuthService.cs
    ???? UserService.cs
    ?   ??? RoleService.cs
    ?   ??? TokenService.cs
    ?   ??? EmailService.cs
  ?   ??? SmsService.cs
    ?   ??? CacheService.cs
    ?   ??? CurrentUserService.cs
    ?   ??? LogCleanupService.cs
    ??? Persistence/
    ?   ??? UnitOfWork.cs
    ??? Mapping/
 ?   ??? MappingConfig.cs
  ??? Middleware/
  ??? GlobalExceptionMiddleware.cs
```

---

## ? Features Implemented

| Feature | Details |
|---------|---------|
| **ASP.NET Identity** | Extended with `IsBlocked`, `Status`, `DisplayName`, `FullName` |
| **JWT Authentication** | Access Token (1hr) + Refresh Token (20hrs) |
| **AuthController** | Register, Login, Confirm Email, Forgot/Reset Password, Change Password, Logout, Refresh Token |
| **UsersController** | List, Get by ID/Email/Role, Block/Unblock, Activate/Deactivate, Soft Delete |
| **RolesController** | CRUD, Add/Remove User, List Users in Role |
| **FluentValidation** | All DTOs validated |
| **Serilog** | File + SQL Server logging with 30-day auto-cleanup |
| **Redis Caching** | Full cache service implementation |
| **Rate Limiting** | 100 requests/60 seconds (configurable) |
| **Global Exception Handling** | Middleware with standardized API responses |
| **Unit of Work** | Simple implementation that doesn't over-abstract EF Core |
| **Mapster** | Object mapping configuration |
| **Swagger** | At startup page with JWT authentication support |
| **BaseEntity** | CreatedDate, UpdatedDate, CreatedBy, UpdatedBy, DeletedBy, IsDeleted |
| **Entity Configurations** | Separate configuration files (not inside DbContext) |

---

## ?? Authentication Endpoints

### AuthController (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login and get tokens | No |
| GET | `/confirm-email` | Confirm email address | No |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password with token | No |
| POST | `/change-password` | Change password | Yes |
| POST | `/refresh-token` | Refresh access token | No |
| POST | `/logout` | Logout (invalidate refresh token) | Yes |

---

## ?? User Management Endpoints

### UsersController (`/api/users`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/` | Get all users (paginated) | SuperDev, Admin |
| GET | `/{id}` | Get user by ID | SuperDev, Admin |
| GET | `/by-email/{email}` | Get user by email | SuperDev, Admin |
| GET | `/by-role/{roleName}` | Get users by role | SuperDev, Admin |
| PUT | `/{id}` | Update user | SuperDev, Admin |
| POST | `/{id}/block` | Block user | SuperDev, Admin |
| POST | `/{id}/unblock` | Unblock user | SuperDev, Admin |
| POST | `/{id}/activate` | Activate user | SuperDev, Admin |
| POST | `/{id}/deactivate` | Deactivate user | SuperDev, Admin |
| DELETE | `/{id}` | Soft delete user | SuperDev only |

---

## ?? Role Management Endpoints

### RolesController (`/api/roles`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/` | Get all roles | SuperDev, Admin |
| GET | `/{id}` | Get role by ID | SuperDev, Admin |
| POST | `/` | Create new role | SuperDev only |
| PUT | `/{id}` | Update role | SuperDev only |
| DELETE | `/{id}` | Delete role | SuperDev only |
| POST | `/add-user` | Add user to role | SuperDev, Admin |
| POST | `/remove-user` | Remove user from role | SuperDev, Admin |
| GET | `/{roleName}/users` | Get users in role | SuperDev, Admin |

---

## ?? Database Seeding

### SeedController (`/api/seed`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Seed roles and SuperDev user |

### Seeded Data

**Roles:**
- SuperDev
- Admin
- Instructor
- Candidate

**Protected SuperDev User:**
- Email: `Rowyda15@gmail.com`
- Password: `13579@Rowyda`
- Role: SuperDev

---

## ?? Protected User Rules

The SuperDev user (`Rowyda15@gmail.com`) has special protection:

- ? Cannot be deleted
- ? Cannot be blocked
- ? Cannot be deactivated
- ? Cannot be removed from SuperDev role
- ? Cannot be modified

---

## ??? BaseEntity Properties

All entities inherit from `BaseEntity`:

```csharp
public abstract class BaseEntity
{
    public DateTime CreatedDate { get; set; }
  public DateTime? UpdatedDate { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public string? DeletedBy { get; set; }
    public bool IsDeleted { get; set; }
}
```

---

## ?? Extended ApplicationUser Properties

```csharp
public class ApplicationUser : IdentityUser
{
    public string? DisplayName { get; set; }
 public string? FullName { get; set; }
    public bool IsBlocked { get; set; }
    public UserStatus Status { get; set; }  // Active, Inactive, Pending, Suspended
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
    // + BaseEntity properties
}
```

---

## ?? Configuration (appsettings.json)

### Connection Strings
- `DefaultConnection`: SQL Server database
- `Redis`: Redis cache server

### JWT Settings
- `SecretKey`: JWT signing key (min 32 characters)
- `Issuer`: Token issuer
- `Audience`: Token audience
- `AccessTokenExpirationHours`: Default 1 hour
- `RefreshTokenExpirationHours`: Default 20 hours

### Rate Limiting
- `PermitLimit`: 100 requests
- `WindowInSeconds`: 60 seconds
- `QueueLimit`: 10 requests

### Serilog
- Console logging
- File logging (30-day retention)
- SQL Server logging (auto-cleanup after 30 days)

---

## ?? Getting Started

### 1. Update Connection Strings

Edit `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Your SQL Server connection string",
    "Redis": "localhost:6379"
  }
}
```

### 2. Create Database Migration

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 3. Run the Application

```bash
dotnet run
```

### 4. Seed the Database

Call the seed endpoint:
```
POST https://localhost:5001/api/seed
```

### 5. Login with SuperDev Account

```json
POST /api/auth/login
{
  "email": "Rowyda15@gmail.com",
  "password": "13579@Rowyda"
}
```

---

## ?? NuGet Packages Used

| Package | Purpose |
|---------|---------|
| Microsoft.EntityFrameworkCore.SqlServer | SQL Server provider |
| Microsoft.AspNetCore.Identity.EntityFrameworkCore | ASP.NET Identity |
| Microsoft.AspNetCore.Authentication.JwtBearer | JWT Authentication |
| FluentValidation.AspNetCore | Request validation |
| Mapster | Object mapping |
| Serilog.AspNetCore | Logging |
| Serilog.Sinks.MSSqlServer | SQL Server log sink |
| Serilog.Sinks.File | File log sink |
| StackExchange.Redis | Redis caching |
| Swashbuckle.AspNetCore | Swagger/OpenAPI |

---

## ??? Architecture Layers

### Domain Layer
- Entities (ApplicationUser, ApplicationRole)
- BaseEntity
- Constants (AppRoles)
- No dependencies on other layers

### Application Layer
- DTOs (Data Transfer Objects)
- Service Interfaces
- Validators (FluentValidation)
- Depends only on Domain

### Infrastructure Layer
- DbContext and Configurations
- Service Implementations
- Unit of Work
- External service integrations (Email, SMS, Cache)
- Middleware
- Depends on Application and Domain

### Presentation Layer (Controllers)
- API Controllers
- Depends on Application layer interfaces

---

## ?? License

This implementation is part of the Smart Core project.
