using System.Text;
using System.Security.Claims;
using System.Security.Cryptography.X509Certificates;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;
using Mapster;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using StackExchange.Redis;
using Smart_Core.Infrastructure;
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
using Smart_Core.Application.Interfaces.Logs;
using Smart_Core.Application.Interfaces.License;
using Smart_Core.Infrastructure.Services.Logs;
using Smart_Core.Infrastructure.Services.License;
using Smart_Core.Infrastructure.Filters.Logs;

var builder = WebApplication.CreateBuilder(args);
ProductionConfiguration.Validate(builder.Configuration, builder.Environment);

// Configure Serilog
Serilog.Debugging.SelfLog.Enable(TextWriter.Synchronized(Console.Error));
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("MachineName", Environment.MachineName)
    .Enrich.WithProperty("EnvironmentName", builder.Environment.EnvironmentName)
    .CreateLogger();

builder.Host.UseSerilog();
builder.Services.Configure<ForwardedHeadersOptions>(options =>
    ProductionConfiguration.ConfigureForwarding(options, builder.Configuration));

var dataProtection = builder.Services.AddDataProtection().SetApplicationName("SmartExam");
var keyRingPath = builder.Configuration["DataProtection:KeyRingPath"];
if (!string.IsNullOrWhiteSpace(keyRingPath))
    dataProtection.PersistKeysToFileSystem(new DirectoryInfo(keyRingPath));
var keyCertificatePath = builder.Configuration["DataProtection:CertificatePath"];
if (!string.IsNullOrWhiteSpace(keyCertificatePath))
    dataProtection.ProtectKeysWithCertificate(X509CertificateLoader.LoadPkcs12FromFile(
        keyCertificatePath, builder.Configuration["DataProtection:CertificatePassword"]));

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

// Application read caches are bypassed so every node reads authoritative SQL state.

// Rate Limiting
var rateLimitSettings = builder.Configuration.GetSection("RateLimiting");
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier) is { } userId
                ? $"user:{userId}"
                : $"ip:{httpContext.Connection.RemoteIpAddress}",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = httpContext.User.Identity?.IsAuthenticated == true
                    ? rateLimitSettings.GetValue<int>("PermitLimit", 100)
                    : rateLimitSettings.GetValue<int>("AnonymousPermitLimit", 100),
                Window = TimeSpan.FromSeconds(int.Parse(rateLimitSettings["WindowInSeconds"] ?? "60")),
                QueueLimit = int.Parse(rateLimitSettings["QueueLimit"] ?? "0"),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst
            }));

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            context.HttpContext.Response.Headers.RetryAfter = Math.Ceiling(retryAfter.TotalSeconds).ToString(System.Globalization.CultureInfo.InvariantCulture);
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
builder.Services.AddSingleton<StoragePaths>();

// OpenAI Configuration
builder.Services.Configure<OpenAISettings>(builder.Configuration.GetSection("OpenAI"));
builder.Services.AddHttpClient();
builder.Services.AddHttpClient("Sms", client =>
    client.Timeout = TimeSpan.FromSeconds(Math.Clamp(builder.Configuration.GetValue<int>("SmsSettings:TimeoutSeconds", 30), 1, 120)))
    .RemoveAllLoggers();
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
builder.Services.AddScoped<IAiQuestionGeneratorService, AiQuestionGeneratorService>();
builder.Services.AddScoped<IAssessmentService, AssessmentService>();
builder.Services.AddScoped<IExamShareService, ExamShareService>();
builder.Services.AddScoped<IWalkInFieldService, WalkInFieldService>();
builder.Services.AddScoped<IAttemptService, AttemptService>();
builder.Services.AddScoped<IGradingService, GradingService>();
builder.Services.AddScoped<IAiGradingService, AiGradingService>();
builder.Services.AddScoped<IAiProctorService, AiProctorService>();
builder.Services.AddScoped<IExamResultService, ExamResultService>();
builder.Services.AddScoped<ICertificateService, CertificateService>();
builder.Services.AddScoped<IProctorService, ProctorService>();
builder.Services.AddScoped<IExamProctorService, ExamProctorService>();
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
builder.Services.AddScoped<Smart_Core.Infrastructure.Services.Authorization.ResourceAuthorizationService>();
builder.Services.AddSingleton<IEncryptionService, AesEncryptionService>();
builder.Services.AddScoped<INotificationService, Smart_Core.Infrastructure.Services.Notification.NotificationService>();
builder.Services.AddScoped<IUserNotificationService, Smart_Core.Infrastructure.Services.Notification.UserNotificationService>();
builder.Services.AddSingleton<INotificationDispatcher, Smart_Core.Infrastructure.Services.Notification.NotificationDispatcher>();
builder.Services.AddSingleton<ICacheService, CacheService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<DatabaseSeeder>();

// License Validation
builder.Services.AddSingleton<LicenseValidationService>();
builder.Services.AddSingleton<ILicenseValidationService>(sp => sp.GetRequiredService<LicenseValidationService>());

// System Logs (Channel + Background persistence)
builder.Services.AddSingleton<SystemLogChannel>();
builder.Services.AddScoped<ISystemLogService, SystemLogService>();

// Background Services
builder.Services.AddHostedService<LogCleanupService>();
builder.Services.AddHostedService<VideoRetentionService>();
builder.Services.AddHostedService<Smart_Core.Infrastructure.Services.Background.AttemptExpiryBackgroundService>();
builder.Services.AddHostedService<Smart_Core.Infrastructure.Services.Notification.NotificationBackgroundService>();
builder.Services.AddHostedService<LogPersistenceService>();
builder.Services.AddHostedService<LicenseCheckBackgroundService>();

// HTTP Context Accessor
builder.Services.AddHttpContextAccessor();

// Redis is a SignalR backplane, not an application-data cache.
var signalR = builder.Services.AddSignalR();
var redisConnection = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrWhiteSpace(redisConnection))
{
    signalR.AddStackExchangeRedis(redisConnection, options =>
    {
        options.Configuration.ChannelPrefix = RedisChannel.Literal(
            builder.Configuration["SignalR:ChannelPrefix"] ?? "SmartExam");
    });
}

// CORS policy for SignalR — allow frontend origins
builder.Services.AddCors(options =>
{
    options.AddPolicy("SignalRCors", policy =>
    {
        policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
            .AllowAnyHeader()
            .AllowAnyMethod()
            .WithExposedHeaders("X-Trace-Id", "X-License-State", "Retry-After", "Content-Disposition")
            .AllowCredentials();
    });
});

// Controllers
builder.Services.AddControllers(options => options.Filters.Add<ApiResponseLoggingFilter>());

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
app.UseForwardedHeaders();
app.UseRouting();

// Metadata-only request diagnostics use a bounded, non-blocking channel.
app.UseRequestResponseLogging();

// Global Exception Handling
app.UseGlobalExceptionMiddleware();

// CORS — required for SignalR WebSocket from frontend origin
app.UseCors("SignalRCors");

if (app.Environment.IsDevelopment() || builder.Configuration.GetValue<bool>("Swagger:Enabled"))
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Smart Core API v1");
        options.RoutePrefix = string.Empty;
    });
}

app.UseHttpsRedirection();

var storagePaths = app.Services.GetRequiredService<StoragePaths>();

// Recordings must use the authorized download API, never the public asset route.
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/media/video-chunks", StringComparison.OrdinalIgnoreCase))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }
    await next(context);
});

// Use the same configured roots as uploads and background retention.
var mediaStoragePath = storagePaths.MediaPath;
if (!Directory.Exists(mediaStoragePath))
{
    Directory.CreateDirectory(mediaStoragePath);
    Log.Information("Created MediaStorage directory at {Path}", mediaStoragePath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PublicMediaFileProvider(mediaStoragePath),
    RequestPath = "/media"
});

// Serve organization images from wwwroot/Organization/
var orgImagePath = storagePaths.OrganizationPath;
if (!Directory.Exists(orgImagePath))
{
    Directory.CreateDirectory(orgImagePath);
    Log.Information("Created Organization image directory at {Path}", orgImagePath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(orgImagePath),
    RequestPath = "/organization",
    ContentTypeProvider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider(
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [".jpg"] = "image/jpeg", [".jpeg"] = "image/jpeg", [".png"] = "image/png",
            [".webp"] = "image/webp", [".ico"] = "image/x-icon"
        }),
    OnPrepareResponse = context => context.Context.Response.Headers.XContentTypeOptions = "nosniff"
});

// Private identity photos are served only by IdentityVerificationController.

// Serve tutorial videos from wwwroot/tutorials/
var tutorialsPath = storagePaths.TutorialsPath;
if (!Directory.Exists(tutorialsPath))
{
    Directory.CreateDirectory(tutorialsPath);
    Log.Information("Created tutorials directory at {Path}", tutorialsPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(tutorialsPath),
    RequestPath = "/tutorials"
});

// Authentication & Authorization
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

// License enforcement — after auth, before controllers
app.UseLicenseEnforcement();

app.MapControllers();

// SignalR Hubs
app.MapHub<ProctorHub>("/hubs/proctor");
app.MapHub<Smart_Core.Infrastructure.Hubs.NotificationHub>("/hubs/notifications");

// Apply pending migrations and seed data in development
// Note: Auto-migration disabled to prevent conflicts when DB already has tables.
// Use 'dotnet ef database update' manually when you need to apply new migrations.
// if (app.Environment.IsDevelopment())
// {
//     using var scope = app.Services.CreateScope();
//     var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
//     await dbContext.Database.MigrateAsync();
// }

try
{
    Log.Information("Starting Smart Core API");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
    Environment.ExitCode = 1;
}
finally
{
    Log.CloseAndFlush();
}
