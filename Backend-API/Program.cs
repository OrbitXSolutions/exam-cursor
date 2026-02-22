using System.Text;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;
using Mapster;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Assessment;
using Smart_Core.Application.Interfaces.Attempt;
using Smart_Core.Application.Interfaces.Lookups;
using Smart_Core.Application.Interfaces.QuestionBank;
using Smart_Core.Application.Interfaces.Grading;
using Smart_Core.Application.Interfaces.ExamResult;
using Smart_Core.Application.Interfaces.Proctor;
using Smart_Core.Application.Interfaces.Incident;
using Smart_Core.Application.Interfaces.Audit;
using Smart_Core.Application.Interfaces.Candidate;
using Smart_Core.Application.Interfaces.Batch;
using Smart_Core.Application.Interfaces.CandidateAdmin;
using Smart_Core.Application.Interfaces.ExamAssignment;
using Smart_Core.Application.Interfaces.AttemptControl;
using Smart_Core.Application.Interfaces.CandidateExamDetails;
using Smart_Core.Application.Interfaces.ExamOperations;
using Smart_Core.Application.Settings;
using Smart_Core.Domain.Entities;
using Smart_Core.Infrastructure.Data;
using Smart_Core.Infrastructure.Mapping;
using Smart_Core.Infrastructure.Middleware;
using Smart_Core.Infrastructure.Persistence;
using Smart_Core.Infrastructure.Services;
using Smart_Core.Infrastructure.Services.Assessment;
using Smart_Core.Infrastructure.Services.Attempt;
using Smart_Core.Infrastructure.Services.Lookups;
using Smart_Core.Infrastructure.Services.QuestionBank;
using Smart_Core.Infrastructure.Services.Grading;
using Smart_Core.Infrastructure.Services.ExamResult;
using Smart_Core.Infrastructure.Services.Proctor;
using Smart_Core.Infrastructure.Services.AttemptControl;
using Smart_Core.Infrastructure.Services.Incident;
using Smart_Core.Infrastructure.Services.Audit;
using Smart_Core.Infrastructure.Services.Candidate;
using Smart_Core.Infrastructure.Services.Batch;
using Smart_Core.Infrastructure.Services.CandidateAdmin;
using Smart_Core.Infrastructure.Services.ExamAssignment;
using Smart_Core.Infrastructure.Services.CandidateExamDetails;
using Smart_Core.Infrastructure.Services.ExamOperations;
using Smart_Core.Infrastructure.Hubs;
using Smart_Core.Infrastructure.Storage;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container

// Database Context
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ASP.NET Identity
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 8;

    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    // User settings
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = false; // Set to true in production
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!)),
        ClockSkew = TimeSpan.Zero
    };

    // Allow SignalR to receive the JWT token from query string
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// Redis Caching (optional - falls back to in-memory cache)
var redisConnection = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrWhiteSpace(redisConnection))
{
    try
    {
        builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
            ConnectionMultiplexer.Connect(redisConnection));

        builder.Services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnection;
            options.InstanceName = "SmartCore_";
        });

        Log.Information("Redis cache configured successfully");
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Failed to connect to Redis, falling back to in-memory cache");
        builder.Services.AddDistributedMemoryCache();
    }
}
else
{
    Log.Information("Redis not configured, using in-memory distributed cache");
    builder.Services.AddDistributedMemoryCache();
}

// Rate Limiting
var rateLimitSettings = builder.Configuration.GetSection("RateLimiting");
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.User.Identity?.Name ?? httpContext.Request.Headers.Host.ToString(),
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = int.Parse(rateLimitSettings["PermitLimit"] ?? "100"),
                Window = TimeSpan.FromSeconds(int.Parse(rateLimitSettings["WindowInSeconds"] ?? "60")),
                QueueLimit = int.Parse(rateLimitSettings["QueueLimit"] ?? "10"),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst
            }));

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsync("Too many requests. Please try again later.", token);
    };
});

// FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Mapster Configuration
MappingConfig.RegisterMappings();

// Media Storage Configuration
builder.Services.Configure<MediaStorageSettings>(builder.Configuration.GetSection("MediaStorage"));
var mediaStorageProvider = builder.Configuration.GetValue<string>("MediaStorage:Provider") ?? "Local";

if (mediaStorageProvider.Equals("S3", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddScoped<IStorageProvider, S3StorageProvider>();
}
else
{
    builder.Services.AddScoped<IStorageProvider, LocalStorageProvider>();
}

builder.Services.AddScoped<IMediaStorageService, MediaStorageService>();

// Register Application Services
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<ILookupsService, LookupsService>();
builder.Services.AddScoped<IQuestionBankService, QuestionBankService>();
builder.Services.AddScoped<IAssessmentService, AssessmentService>();
builder.Services.AddScoped<IAttemptService, AttemptService>();
builder.Services.AddScoped<IGradingService, GradingService>();
builder.Services.AddScoped<IExamResultService, ExamResultService>();
builder.Services.AddScoped<ICertificateService, CertificateService>();
builder.Services.AddScoped<IProctorService, ProctorService>();
builder.Services.AddScoped<IIdentityVerificationService, IdentityVerificationService>();
builder.Services.AddScoped<IIncidentService, IncidentService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<ICandidateService, CandidateService>();
builder.Services.AddScoped<ICandidateAdminService, CandidateAdminService>();
builder.Services.AddScoped<IBatchService, BatchService>();
builder.Services.AddScoped<IExamAssignmentService, ExamAssignmentService>();
builder.Services.AddScoped<IAttemptControlService, AttemptControlService>();
builder.Services.AddScoped<IExamOperationsService, ExamOperationsService>();
builder.Services.AddScoped<ICandidateExamDetailsService, CandidateExamDetailsService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ISmsService, SmsService>();
builder.Services.AddScoped<ICacheService, CacheService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<DatabaseSeeder>();

// Background Services
builder.Services.AddHostedService<LogCleanupService>();
builder.Services.AddHostedService<VideoRetentionService>();

// HTTP Context Accessor
builder.Services.AddHttpContextAccessor();

// SignalR
builder.Services.AddSignalR();

// CORS policy for SignalR — allow frontend origins
builder.Services.AddCors(options =>
{
    options.AddPolicy("SignalRCors", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "https://localhost:3000",
                "http://localhost:5221",
                "https://localhost:7184")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Controllers
builder.Services.AddControllers();

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Smart Core API",
        Version = "v1",
        Description = "Clean Architecture Backend API with JWT Authentication"
    });

    // JWT Authentication in Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline

// CORS — required for SignalR WebSocket from frontend origin
app.UseCors("SignalRCors");

// Global Exception Handling
app.UseGlobalExceptionMiddleware();

// Serilog Request Logging
app.UseSerilogRequestLogging();

// Swagger (available in all environments for now, restrict in production if needed)
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Smart Core API v1");
    options.RoutePrefix = string.Empty; // Swagger at startup page
});

app.UseHttpsRedirection();

// Ensure MediaStorage directory exists and serve static files
var mediaStoragePath = Path.Combine(builder.Environment.ContentRootPath, "MediaStorage");
if (!Directory.Exists(mediaStoragePath))
{
    Directory.CreateDirectory(mediaStoragePath);
    Log.Information("Created MediaStorage directory at {Path}", mediaStoragePath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(mediaStoragePath),
    RequestPath = "/media"
});

// Serve organization images from wwwroot/Organization/
var orgImagePath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "Organization");
if (!Directory.Exists(orgImagePath))
{
    Directory.CreateDirectory(orgImagePath);
    Log.Information("Created Organization image directory at {Path}", orgImagePath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(orgImagePath),
    RequestPath = "/organization"
});

// Serve candidate identity verification photos from wwwroot/candidateIDs/
var candidateIDsPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "candidateIDs");
if (!Directory.Exists(candidateIDsPath))
{
    Directory.CreateDirectory(candidateIDsPath);
    Log.Information("Created candidateIDs directory at {Path}", candidateIDsPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(candidateIDsPath),
    RequestPath = "/candidateIDs"
});

// Rate Limiting
app.UseRateLimiter();

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// SignalR Hubs
app.MapHub<ProctorHub>("/hubs/proctor");

// Apply pending migrations and seed data in development
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.MigrateAsync();
}

try
{
    Log.Information("Starting Smart Core API");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
