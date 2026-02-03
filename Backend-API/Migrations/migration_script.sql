IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [AspNetRoles] (
        [Id] nvarchar(450) NOT NULL,
        [Description] nvarchar(500) NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        [Name] nvarchar(256) NULL,
        [NormalizedName] nvarchar(256) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetRoles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [AspNetUsers] (
        [Id] nvarchar(450) NOT NULL,
        [DisplayName] nvarchar(100) NULL,
        [FullName] nvarchar(200) NULL,
        [IsBlocked] bit NOT NULL,
        [Status] int NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        [RefreshToken] nvarchar(500) NULL,
        [RefreshTokenExpiryTime] datetime2 NULL,
        [UserName] nvarchar(256) NULL,
        [NormalizedUserName] nvarchar(256) NULL,
        [Email] nvarchar(256) NULL,
        [NormalizedEmail] nvarchar(256) NULL,
        [EmailConfirmed] bit NOT NULL,
        [PasswordHash] nvarchar(max) NULL,
        [SecurityStamp] nvarchar(max) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        [PhoneNumber] nvarchar(max) NULL,
        [PhoneNumberConfirmed] bit NOT NULL,
        [TwoFactorEnabled] bit NOT NULL,
        [LockoutEnd] datetimeoffset NULL,
        [LockoutEnabled] bit NOT NULL,
        [AccessFailedCount] int NOT NULL,
        CONSTRAINT [PK_AspNetUsers] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [AuditLogs] (
        [Id] bigint NOT NULL IDENTITY,
        [ActorId] nvarchar(450) NULL,
        [ActorType] tinyint NOT NULL,
        [ActorDisplayName] nvarchar(256) NULL,
        [Action] nvarchar(256) NOT NULL,
        [EntityName] nvarchar(128) NOT NULL,
        [EntityId] nvarchar(128) NOT NULL,
        [CorrelationId] nvarchar(128) NULL,
        [TenantId] nvarchar(128) NULL,
        [Source] tinyint NULL,
        [Channel] tinyint NULL,
        [IpAddress] nvarchar(45) NULL,
        [UserAgent] nvarchar(1000) NULL,
        [BeforeJson] nvarchar(max) NULL,
        [AfterJson] nvarchar(max) NULL,
        [MetadataJson] nvarchar(max) NULL,
        [Outcome] tinyint NOT NULL,
        [ErrorMessage] nvarchar(4000) NULL,
        [OccurredAt] datetime2 NOT NULL,
        [DurationMs] int NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [AuditRetentionPolicies] (
        [Id] int NOT NULL IDENTITY,
        [NameEn] nvarchar(200) NOT NULL,
        [NameAr] nvarchar(200) NOT NULL,
        [DescriptionEn] nvarchar(1000) NULL,
        [DescriptionAr] nvarchar(1000) NULL,
        [IsActive] bit NOT NULL,
        [IsDefault] bit NOT NULL,
        [Priority] int NOT NULL,
        [RetentionDays] int NOT NULL,
        [EntityName] nvarchar(128) NULL,
        [ActionPrefix] nvarchar(128) NULL,
        [Channel] nvarchar(50) NULL,
        [ActorType] nvarchar(50) NULL,
        [ArchiveBeforeDelete] bit NOT NULL,
        [ArchiveTarget] nvarchar(50) NULL,
        [ArchivePathTemplate] nvarchar(500) NULL,
        [LastExecutedAt] datetime2 NULL,
        [LastExecutionCount] int NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AuditRetentionPolicies] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [Exams] (
        [Id] int NOT NULL IDENTITY,
        [TitleEn] nvarchar(500) NOT NULL,
        [TitleAr] nvarchar(500) NOT NULL,
        [DescriptionEn] nvarchar(2000) NULL,
        [DescriptionAr] nvarchar(2000) NULL,
        [StartAt] datetime2 NULL,
        [EndAt] datetime2 NULL,
        [DurationMinutes] int NOT NULL,
        [MaxAttempts] int NOT NULL,
        [ShuffleQuestions] bit NOT NULL,
        [ShuffleOptions] bit NOT NULL,
        [PassScore] decimal(10,2) NOT NULL,
        [IsPublished] bit NOT NULL DEFAULT CAST(0 AS bit),
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Exams] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [MediaFiles] (
        [Id] uniqueidentifier NOT NULL,
        [OriginalFileName] nvarchar(500) NOT NULL,
        [StoredFileName] nvarchar(500) NOT NULL,
        [Extension] nvarchar(20) NOT NULL,
        [ContentType] nvarchar(100) NOT NULL,
        [SizeInBytes] bigint NOT NULL,
        [MediaType] int NOT NULL,
        [StorageProvider] int NOT NULL,
        [Path] nvarchar(1000) NOT NULL,
        [Url] nvarchar(2000) NULL,
        [BucketName] nvarchar(100) NULL,
        [Folder] nvarchar(200) NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_MediaFiles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [ProctorRiskRules] (
        [Id] int NOT NULL IDENTITY,
        [NameEn] nvarchar(200) NOT NULL,
        [NameAr] nvarchar(200) NOT NULL,
        [DescriptionEn] nvarchar(1000) NULL,
        [DescriptionAr] nvarchar(1000) NULL,
        [IsActive] bit NOT NULL,
        [EventType] tinyint NOT NULL,
        [ThresholdCount] int NOT NULL,
        [WindowSeconds] int NOT NULL,
        [RiskPoints] decimal(5,2) NOT NULL,
        [MinSeverity] tinyint NULL,
        [MaxTriggers] int NULL,
        [Priority] int NOT NULL,
        [RuleConfigJson] nvarchar(4000) NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ProctorRiskRules] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [QuestionCategories] (
        [Id] int NOT NULL IDENTITY,
        [NameEn] nvarchar(300) NOT NULL,
        [NameAr] nvarchar(300) NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_QuestionCategories] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [QuestionTypes] (
        [Id] int NOT NULL IDENTITY,
        [NameEn] nvarchar(300) NOT NULL,
        [NameAr] nvarchar(300) NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_QuestionTypes] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [AspNetRoleClaims] (
        [Id] int NOT NULL IDENTITY,
        [RoleId] nvarchar(450) NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetRoleClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetRoleClaims_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [AspNetUserClaims] (
        [Id] int NOT NULL IDENTITY,
        [UserId] nvarchar(450) NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetUserClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetUserClaims_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [AspNetUserLogins] (
        [LoginProvider] nvarchar(450) NOT NULL,
        [ProviderKey] nvarchar(450) NOT NULL,
        [ProviderDisplayName] nvarchar(max) NULL,
        [UserId] nvarchar(450) NOT NULL,
        CONSTRAINT [PK_AspNetUserLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
        CONSTRAINT [FK_AspNetUserLogins_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [AspNetUserRoles] (
        [UserId] nvarchar(450) NOT NULL,
        [RoleId] nvarchar(450) NOT NULL,
        CONSTRAINT [PK_AspNetUserRoles] PRIMARY KEY ([UserId], [RoleId]),
        CONSTRAINT [FK_AspNetUserRoles_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AspNetUserRoles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [AspNetUserTokens] (
        [UserId] nvarchar(450) NOT NULL,
        [LoginProvider] nvarchar(450) NOT NULL,
        [Name] nvarchar(450) NOT NULL,
        [Value] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetUserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
        CONSTRAINT [FK_AspNetUserTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [AuditExportJobs] (
        [Id] int NOT NULL IDENTITY,
        [FromDate] datetime2 NOT NULL,
        [ToDate] datetime2 NOT NULL,
        [TenantId] nvarchar(128) NULL,
        [EntityName] nvarchar(128) NULL,
        [ActionPrefix] nvarchar(128) NULL,
        [ActorId] nvarchar(450) NULL,
        [Outcome] tinyint NULL,
        [FilterJson] nvarchar(4000) NULL,
        [Format] tinyint NOT NULL,
        [Status] tinyint NOT NULL,
        [RequestedBy] nvarchar(450) NOT NULL,
        [RequestedAt] datetime2 NOT NULL,
        [StartedAt] datetime2 NULL,
        [FilePath] nvarchar(1000) NULL,
        [FileName] nvarchar(256) NULL,
        [FileSize] bigint NULL,
        [TotalRecords] int NULL,
        [CompletedAt] datetime2 NULL,
        [ExpiresAt] datetime2 NULL,
        [ErrorMessage] nvarchar(4000) NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AuditExportJobs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AuditExportJobs_AspNetUsers_RequestedBy] FOREIGN KEY ([RequestedBy]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [Attempts] (
        [Id] int NOT NULL IDENTITY,
        [ExamId] int NOT NULL,
        [CandidateId] nvarchar(450) NOT NULL,
        [StartedAt] datetime2 NOT NULL,
        [SubmittedAt] datetime2 NULL,
        [ExpiresAt] datetime2 NULL,
        [Status] tinyint NOT NULL,
        [AttemptNumber] int NOT NULL,
        [TotalScore] decimal(10,2) NULL,
        [IsPassed] bit NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Attempts] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Attempts_AspNetUsers_CandidateId] FOREIGN KEY ([CandidateId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Attempts_Exams_ExamId] FOREIGN KEY ([ExamId]) REFERENCES [Exams] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [ExamAccessPolicies] (
        [Id] int NOT NULL IDENTITY,
        [ExamId] int NOT NULL,
        [IsPublic] bit NOT NULL DEFAULT CAST(0 AS bit),
        [AccessCode] nvarchar(50) NULL,
        [RestrictToAssignedCandidates] bit NOT NULL DEFAULT CAST(0 AS bit),
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ExamAccessPolicies] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ExamAccessPolicies_Exams_ExamId] FOREIGN KEY ([ExamId]) REFERENCES [Exams] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [ExamInstructions] (
        [Id] int NOT NULL IDENTITY,
        [ExamId] int NOT NULL,
        [ContentEn] nvarchar(max) NOT NULL,
        [ContentAr] nvarchar(max) NOT NULL,
        [Order] int NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ExamInstructions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ExamInstructions_Exams_ExamId] FOREIGN KEY ([ExamId]) REFERENCES [Exams] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [ExamReports] (
        [Id] int NOT NULL IDENTITY,
        [ExamId] int NOT NULL,
        [FromDate] datetime2 NULL,
        [ToDate] datetime2 NULL,
        [TotalAttempts] int NOT NULL,
        [TotalSubmitted] int NOT NULL,
        [TotalExpired] int NOT NULL,
        [TotalPassed] int NOT NULL,
        [TotalFailed] int NOT NULL,
        [AverageScore] decimal(10,2) NOT NULL,
        [HighestScore] decimal(10,2) NOT NULL,
        [LowestScore] decimal(10,2) NOT NULL,
        [PassRate] decimal(5,2) NOT NULL,
        [TotalFlaggedAttempts] int NULL,
        [AverageRiskScore] decimal(5,2) NULL,
        [GeneratedAt] datetime2 NOT NULL,
        [GeneratedBy] nvarchar(450) NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ExamReports] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ExamReports_Exams_ExamId] FOREIGN KEY ([ExamId]) REFERENCES [Exams] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [ExamSections] (
        [Id] int NOT NULL IDENTITY,
        [ExamId] int NOT NULL,
        [TitleEn] nvarchar(500) NOT NULL,
        [TitleAr] nvarchar(500) NOT NULL,
        [DescriptionEn] nvarchar(2000) NULL,
        [DescriptionAr] nvarchar(2000) NULL,
        [Order] int NOT NULL,
        [DurationMinutes] int NULL,
        [TotalPointsOverride] decimal(10,2) NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ExamSections] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ExamSections_Exams_ExamId] FOREIGN KEY ([ExamId]) REFERENCES [Exams] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [ResultExportJobs] (
        [Id] int NOT NULL IDENTITY,
        [ExamId] int NOT NULL,
        [Format] tinyint NOT NULL,
        [Status] tinyint NOT NULL,
        [FromDate] datetime2 NULL,
        [ToDate] datetime2 NULL,
        [PassedOnly] bit NULL,
        [FailedOnly] bit NULL,
        [RequestedBy] nvarchar(450) NOT NULL,
        [RequestedAt] datetime2 NOT NULL,
        [FileName] nvarchar(500) NULL,
        [FilePath] nvarchar(2000) NULL,
        [FileSizeBytes] bigint NULL,
        [CompletedAt] datetime2 NULL,
        [ErrorMessage] nvarchar(4000) NULL,
        [RetryCount] int NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ResultExportJobs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ResultExportJobs_Exams_ExamId] FOREIGN KEY ([ExamId]) REFERENCES [Exams] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [Questions] (
        [Id] int NOT NULL IDENTITY,
        [Body] nvarchar(max) NOT NULL,
        [QuestionTypeId] int NOT NULL,
        [QuestionCategoryId] int NOT NULL,
        [Points] decimal(10,2) NOT NULL,
        [DifficultyLevel] int NOT NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Questions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Questions_QuestionCategories_QuestionCategoryId] FOREIGN KEY ([QuestionCategoryId]) REFERENCES [QuestionCategories] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Questions_QuestionTypes_QuestionTypeId] FOREIGN KEY ([QuestionTypeId]) REFERENCES [QuestionTypes] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [AttemptEvents] (
        [Id] int NOT NULL IDENTITY,
        [AttemptId] int NOT NULL,
        [EventType] tinyint NOT NULL,
        [MetadataJson] nvarchar(4000) NULL,
        [OccurredAt] datetime2 NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AttemptEvents] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AttemptEvents_Attempts_AttemptId] FOREIGN KEY ([AttemptId]) REFERENCES [Attempts] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [GradingSessions] (
        [Id] int NOT NULL IDENTITY,
        [AttemptId] int NOT NULL,
        [GradedBy] nvarchar(450) NULL,
        [Status] tinyint NOT NULL,
        [TotalScore] decimal(10,2) NULL,
        [IsPassed] bit NULL,
        [GradedAt] datetime2 NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_GradingSessions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_GradingSessions_AspNetUsers_GradedBy] FOREIGN KEY ([GradedBy]) REFERENCES [AspNetUsers] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_GradingSessions_Attempts_AttemptId] FOREIGN KEY ([AttemptId]) REFERENCES [Attempts] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [ProctorSessions] (
        [Id] int NOT NULL IDENTITY,
        [AttemptId] int NOT NULL,
        [ExamId] int NOT NULL,
        [CandidateId] nvarchar(450) NOT NULL,
        [Mode] tinyint NOT NULL,
        [StartedAt] datetime2 NOT NULL,
        [EndedAt] datetime2 NULL,
        [Status] tinyint NOT NULL,
        [DeviceFingerprint] nvarchar(500) NULL,
        [UserAgent] nvarchar(1000) NULL,
        [IpAddress] nvarchar(45) NULL,
        [BrowserName] nvarchar(100) NULL,
        [BrowserVersion] nvarchar(50) NULL,
        [OperatingSystem] nvarchar(100) NULL,
        [ScreenResolution] nvarchar(20) NULL,
        [TotalEvents] int NOT NULL,
        [TotalViolations] int NOT NULL,
        [RiskScore] decimal(5,2) NULL,
        [LastHeartbeatAt] datetime2 NULL,
        [HeartbeatMissedCount] int NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ProctorSessions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProctorSessions_AspNetUsers_CandidateId] FOREIGN KEY ([CandidateId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ProctorSessions_Attempts_AttemptId] FOREIGN KEY ([AttemptId]) REFERENCES [Attempts] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ProctorSessions_Exams_ExamId] FOREIGN KEY ([ExamId]) REFERENCES [Exams] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [Results] (
        [Id] int NOT NULL IDENTITY,
        [ExamId] int NOT NULL,
        [AttemptId] int NOT NULL,
        [CandidateId] nvarchar(450) NOT NULL,
        [TotalScore] decimal(10,2) NOT NULL,
        [MaxPossibleScore] decimal(10,2) NOT NULL,
        [PassScore] decimal(10,2) NOT NULL,
        [IsPassed] bit NOT NULL,
        [GradeLabel] nvarchar(50) NULL,
        [IsPublishedToCandidate] bit NOT NULL,
        [PublishedAt] datetime2 NULL,
        [PublishedBy] nvarchar(450) NULL,
        [FinalizedAt] datetime2 NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Results] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Results_AspNetUsers_CandidateId] FOREIGN KEY ([CandidateId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Results_Attempts_AttemptId] FOREIGN KEY ([AttemptId]) REFERENCES [Attempts] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Results_Exams_ExamId] FOREIGN KEY ([ExamId]) REFERENCES [Exams] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [AttemptQuestions] (
        [Id] int NOT NULL IDENTITY,
        [AttemptId] int NOT NULL,
        [QuestionId] int NOT NULL,
        [Order] int NOT NULL,
        [Points] decimal(10,2) NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AttemptQuestions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AttemptQuestions_Attempts_AttemptId] FOREIGN KEY ([AttemptId]) REFERENCES [Attempts] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AttemptQuestions_Questions_QuestionId] FOREIGN KEY ([QuestionId]) REFERENCES [Questions] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [ExamQuestions] (
        [Id] int NOT NULL IDENTITY,
        [ExamId] int NOT NULL,
        [ExamSectionId] int NOT NULL,
        [QuestionId] int NOT NULL,
        [Order] int NOT NULL,
        [Points] decimal(10,2) NOT NULL,
        [IsRequired] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ExamQuestions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ExamQuestions_ExamSections_ExamSectionId] FOREIGN KEY ([ExamSectionId]) REFERENCES [ExamSections] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ExamQuestions_Exams_ExamId] FOREIGN KEY ([ExamId]) REFERENCES [Exams] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ExamQuestions_Questions_QuestionId] FOREIGN KEY ([QuestionId]) REFERENCES [Questions] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [QuestionAnswerKeys] (
        [Id] int NOT NULL IDENTITY,
        [QuestionId] int NOT NULL,
        [AcceptedAnswersJson] nvarchar(max) NULL,
        [CaseSensitive] bit NOT NULL DEFAULT CAST(0 AS bit),
        [TrimSpaces] bit NOT NULL DEFAULT CAST(1 AS bit),
        [NormalizeWhitespace] bit NOT NULL DEFAULT CAST(1 AS bit),
        [RubricTextEn] nvarchar(max) NULL,
        [RubricTextAr] nvarchar(max) NULL,
        [NumericAnswer] decimal(18,6) NULL,
        [Tolerance] decimal(18,6) NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_QuestionAnswerKeys] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_QuestionAnswerKeys_Questions_QuestionId] FOREIGN KEY ([QuestionId]) REFERENCES [Questions] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [QuestionAttachments] (
        [Id] int NOT NULL IDENTITY,
        [QuestionId] int NOT NULL,
        [FileName] nvarchar(255) NOT NULL,
        [FilePath] nvarchar(1000) NOT NULL,
        [FileType] nvarchar(50) NOT NULL,
        [FileSize] bigint NOT NULL,
        [IsPrimary] bit NOT NULL DEFAULT CAST(0 AS bit),
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_QuestionAttachments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_QuestionAttachments_Questions_QuestionId] FOREIGN KEY ([QuestionId]) REFERENCES [Questions] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [QuestionOptions] (
        [Id] int NOT NULL IDENTITY,
        [QuestionId] int NOT NULL,
        [Text] nvarchar(1000) NOT NULL,
        [IsCorrect] bit NOT NULL DEFAULT CAST(0 AS bit),
        [Order] int NOT NULL DEFAULT 0,
        [AttachmentPath] nvarchar(1000) NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_QuestionOptions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_QuestionOptions_Questions_QuestionId] FOREIGN KEY ([QuestionId]) REFERENCES [Questions] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [QuestionPerformanceReports] (
        [Id] int NOT NULL IDENTITY,
        [ExamId] int NOT NULL,
        [QuestionId] int NOT NULL,
        [TotalAnswers] int NOT NULL,
        [CorrectAnswers] int NOT NULL,
        [IncorrectAnswers] int NOT NULL,
        [UnansweredCount] int NOT NULL,
        [CorrectRate] decimal(5,4) NOT NULL,
        [AverageScore] decimal(10,2) NOT NULL,
        [MaxPoints] decimal(10,2) NOT NULL,
        [DifficultyIndex] decimal(5,4) NOT NULL,
        [GeneratedAt] datetime2 NOT NULL,
        [GeneratedBy] nvarchar(450) NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_QuestionPerformanceReports] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_QuestionPerformanceReports_Exams_ExamId] FOREIGN KEY ([ExamId]) REFERENCES [Exams] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_QuestionPerformanceReports_Questions_QuestionId] FOREIGN KEY ([QuestionId]) REFERENCES [Questions] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [GradedAnswers] (
        [Id] int NOT NULL IDENTITY,
        [GradingSessionId] int NOT NULL,
        [AttemptId] int NOT NULL,
        [QuestionId] int NOT NULL,
        [SelectedOptionIdsJson] nvarchar(1000) NULL,
        [TextAnswer] nvarchar(max) NULL,
        [Score] decimal(10,2) NOT NULL,
        [IsCorrect] bit NOT NULL,
        [IsManuallyGraded] bit NOT NULL,
        [GraderComment] nvarchar(2000) NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_GradedAnswers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_GradedAnswers_GradingSessions_GradingSessionId] FOREIGN KEY ([GradingSessionId]) REFERENCES [GradingSessions] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_GradedAnswers_Questions_QuestionId] FOREIGN KEY ([QuestionId]) REFERENCES [Questions] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [IncidentCases] (
        [Id] int NOT NULL IDENTITY,
        [ExamId] int NOT NULL,
        [AttemptId] int NOT NULL,
        [CandidateId] nvarchar(450) NOT NULL,
        [ProctorSessionId] int NULL,
        [CaseNumber] nvarchar(50) NOT NULL,
        [Status] tinyint NOT NULL,
        [Severity] tinyint NOT NULL,
        [Source] tinyint NOT NULL,
        [TitleEn] nvarchar(500) NOT NULL,
        [TitleAr] nvarchar(500) NOT NULL,
        [SummaryEn] nvarchar(4000) NULL,
        [SummaryAr] nvarchar(4000) NULL,
        [RiskScoreAtCreate] decimal(5,2) NULL,
        [TotalViolationsAtCreate] int NULL,
        [AssignedTo] nvarchar(450) NULL,
        [AssignedAt] datetime2 NULL,
        [Outcome] tinyint NULL,
        [ResolutionNoteEn] nvarchar(4000) NULL,
        [ResolutionNoteAr] nvarchar(4000) NULL,
        [ResolvedBy] nvarchar(450) NULL,
        [ResolvedAt] datetime2 NULL,
        [ClosedBy] nvarchar(450) NULL,
        [ClosedAt] datetime2 NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_IncidentCases] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_IncidentCases_AspNetUsers_AssignedTo] FOREIGN KEY ([AssignedTo]) REFERENCES [AspNetUsers] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_IncidentCases_AspNetUsers_CandidateId] FOREIGN KEY ([CandidateId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_IncidentCases_Attempts_AttemptId] FOREIGN KEY ([AttemptId]) REFERENCES [Attempts] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_IncidentCases_Exams_ExamId] FOREIGN KEY ([ExamId]) REFERENCES [Exams] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_IncidentCases_ProctorSessions_ProctorSessionId] FOREIGN KEY ([ProctorSessionId]) REFERENCES [ProctorSessions] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [ProctorDecisions] (
        [Id] int NOT NULL IDENTITY,
        [ProctorSessionId] int NOT NULL,
        [AttemptId] int NOT NULL,
        [Status] tinyint NOT NULL,
        [DecisionReasonEn] nvarchar(2000) NULL,
        [DecisionReasonAr] nvarchar(2000) NULL,
        [InternalNotes] nvarchar(4000) NULL,
        [DecidedBy] nvarchar(450) NULL,
        [DecidedAt] datetime2 NULL,
        [PreviousStatus] tinyint NULL,
        [OverriddenBy] nvarchar(450) NULL,
        [OverriddenAt] datetime2 NULL,
        [OverrideReason] nvarchar(2000) NULL,
        [IncidentId] int NULL,
        [IsFinalized] bit NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ProctorDecisions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProctorDecisions_ProctorSessions_ProctorSessionId] FOREIGN KEY ([ProctorSessionId]) REFERENCES [ProctorSessions] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [ProctorEvents] (
        [Id] int NOT NULL IDENTITY,
        [ProctorSessionId] int NOT NULL,
        [AttemptId] int NOT NULL,
        [EventType] tinyint NOT NULL,
        [Severity] tinyint NOT NULL,
        [IsViolation] bit NOT NULL,
        [MetadataJson] nvarchar(4000) NULL,
        [ClientTimestamp] datetime2 NOT NULL,
        [OccurredAt] datetime2 NOT NULL,
        [SequenceNumber] int NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ProctorEvents] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProctorEvents_ProctorSessions_ProctorSessionId] FOREIGN KEY ([ProctorSessionId]) REFERENCES [ProctorSessions] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [ProctorEvidence] (
        [Id] int NOT NULL IDENTITY,
        [ProctorSessionId] int NOT NULL,
        [AttemptId] int NOT NULL,
        [Type] tinyint NOT NULL,
        [FileName] nvarchar(500) NOT NULL,
        [FilePath] nvarchar(2000) NOT NULL,
        [FileSize] bigint NOT NULL,
        [ContentType] nvarchar(100) NULL,
        [StartAt] datetime2 NULL,
        [EndAt] datetime2 NULL,
        [DurationSeconds] int NULL,
        [Checksum] nvarchar(128) NULL,
        [ChecksumAlgorithm] nvarchar(20) NULL,
        [IsUploaded] bit NOT NULL,
        [UploadedAt] datetime2 NULL,
        [UploadAttempts] int NOT NULL,
        [UploadError] nvarchar(2000) NULL,
        [MetadataJson] nvarchar(4000) NULL,
        [ExpiresAt] datetime2 NULL,
        [IsExpired] bit NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ProctorEvidence] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProctorEvidence_ProctorSessions_ProctorSessionId] FOREIGN KEY ([ProctorSessionId]) REFERENCES [ProctorSessions] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [ProctorRiskSnapshots] (
        [Id] int NOT NULL IDENTITY,
        [ProctorSessionId] int NOT NULL,
        [RiskScore] decimal(5,2) NOT NULL,
        [TotalEvents] int NOT NULL,
        [TotalViolations] int NOT NULL,
        [EventBreakdownJson] nvarchar(4000) NULL,
        [TriggeredRulesJson] nvarchar(4000) NULL,
        [CalculatedAt] datetime2 NOT NULL,
        [CalculatedBy] nvarchar(450) NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ProctorRiskSnapshots] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProctorRiskSnapshots_ProctorSessions_ProctorSessionId] FOREIGN KEY ([ProctorSessionId]) REFERENCES [ProctorSessions] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [CandidateExamSummaries] (
        [Id] int NOT NULL IDENTITY,
        [ExamId] int NOT NULL,
        [CandidateId] nvarchar(450) NOT NULL,
        [TotalAttempts] int NOT NULL,
        [BestAttemptId] int NULL,
        [BestResultId] int NULL,
        [BestScore] decimal(10,2) NULL,
        [BestIsPassed] bit NULL,
        [LatestAttemptId] int NULL,
        [LastAttemptAt] datetime2 NULL,
        [LatestScore] decimal(10,2) NULL,
        [LatestIsPassed] bit NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_CandidateExamSummaries] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CandidateExamSummaries_AspNetUsers_CandidateId] FOREIGN KEY ([CandidateId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_CandidateExamSummaries_Attempts_BestAttemptId] FOREIGN KEY ([BestAttemptId]) REFERENCES [Attempts] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_CandidateExamSummaries_Exams_ExamId] FOREIGN KEY ([ExamId]) REFERENCES [Exams] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_CandidateExamSummaries_Results_BestResultId] FOREIGN KEY ([BestResultId]) REFERENCES [Results] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [AttemptAnswers] (
        [Id] int NOT NULL IDENTITY,
        [AttemptId] int NOT NULL,
        [AttemptQuestionId] int NOT NULL,
        [QuestionId] int NOT NULL,
        [SelectedOptionIdsJson] nvarchar(1000) NULL,
        [TextAnswer] nvarchar(max) NULL,
        [IsCorrect] bit NULL,
        [Score] decimal(10,2) NULL,
        [AnsweredAt] datetime2 NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AttemptAnswers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AttemptAnswers_AttemptQuestions_AttemptQuestionId] FOREIGN KEY ([AttemptQuestionId]) REFERENCES [AttemptQuestions] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AttemptAnswers_Attempts_AttemptId] FOREIGN KEY ([AttemptId]) REFERENCES [Attempts] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [AppealRequests] (
        [Id] int NOT NULL IDENTITY,
        [IncidentCaseId] int NOT NULL,
        [ExamId] int NOT NULL,
        [AttemptId] int NOT NULL,
        [CandidateId] nvarchar(450) NOT NULL,
        [AppealNumber] nvarchar(50) NOT NULL,
        [Status] tinyint NOT NULL,
        [Message] nvarchar(max) NOT NULL,
        [SupportingInfo] nvarchar(max) NULL,
        [SubmittedAt] datetime2 NOT NULL,
        [ReviewedBy] nvarchar(450) NULL,
        [ReviewedAt] datetime2 NULL,
        [DecisionNoteEn] nvarchar(4000) NULL,
        [DecisionNoteAr] nvarchar(4000) NULL,
        [InternalNotes] nvarchar(4000) NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AppealRequests] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AppealRequests_AspNetUsers_CandidateId] FOREIGN KEY ([CandidateId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_AppealRequests_AspNetUsers_ReviewedBy] FOREIGN KEY ([ReviewedBy]) REFERENCES [AspNetUsers] ([Id]),
        CONSTRAINT [FK_AppealRequests_Attempts_AttemptId] FOREIGN KEY ([AttemptId]) REFERENCES [Attempts] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_AppealRequests_Exams_ExamId] FOREIGN KEY ([ExamId]) REFERENCES [Exams] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_AppealRequests_IncidentCases_IncidentCaseId] FOREIGN KEY ([IncidentCaseId]) REFERENCES [IncidentCases] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [IncidentComments] (
        [Id] int NOT NULL IDENTITY,
        [IncidentCaseId] int NOT NULL,
        [AuthorId] nvarchar(450) NOT NULL,
        [AuthorName] nvarchar(200) NULL,
        [Body] nvarchar(max) NOT NULL,
        [IsVisibleToCandidate] bit NOT NULL,
        [IsEdited] bit NOT NULL,
        [EditedAt] datetime2 NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_IncidentComments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_IncidentComments_AspNetUsers_AuthorId] FOREIGN KEY ([AuthorId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_IncidentComments_IncidentCases_IncidentCaseId] FOREIGN KEY ([IncidentCaseId]) REFERENCES [IncidentCases] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [IncidentTimelineEvents] (
        [Id] int NOT NULL IDENTITY,
        [IncidentCaseId] int NOT NULL,
        [EventType] tinyint NOT NULL,
        [ActorId] nvarchar(450) NULL,
        [ActorName] nvarchar(200) NULL,
        [DescriptionEn] nvarchar(1000) NULL,
        [DescriptionAr] nvarchar(1000) NULL,
        [MetadataJson] nvarchar(4000) NULL,
        [OccurredAt] datetime2 NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_IncidentTimelineEvents] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_IncidentTimelineEvents_IncidentCases_IncidentCaseId] FOREIGN KEY ([IncidentCaseId]) REFERENCES [IncidentCases] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [IncidentEvidenceLinks] (
        [Id] int NOT NULL IDENTITY,
        [IncidentCaseId] int NOT NULL,
        [ProctorEvidenceId] int NULL,
        [ProctorEventId] int NULL,
        [NoteEn] nvarchar(2000) NULL,
        [NoteAr] nvarchar(2000) NULL,
        [Order] int NOT NULL,
        [LinkedBy] nvarchar(450) NULL,
        [LinkedAt] datetime2 NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_IncidentEvidenceLinks] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_IncidentEvidenceLinks_IncidentCases_IncidentCaseId] FOREIGN KEY ([IncidentCaseId]) REFERENCES [IncidentCases] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_IncidentEvidenceLinks_ProctorEvents_ProctorEventId] FOREIGN KEY ([ProctorEventId]) REFERENCES [ProctorEvents] ([Id]),
        CONSTRAINT [FK_IncidentEvidenceLinks_ProctorEvidence_ProctorEvidenceId] FOREIGN KEY ([ProctorEvidenceId]) REFERENCES [ProctorEvidence] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE TABLE [IncidentDecisionHistory] (
        [Id] int NOT NULL IDENTITY,
        [IncidentCaseId] int NOT NULL,
        [Outcome] tinyint NOT NULL,
        [ReasonEn] nvarchar(4000) NULL,
        [ReasonAr] nvarchar(4000) NULL,
        [InternalNotes] nvarchar(4000) NULL,
        [DecidedBy] nvarchar(450) NOT NULL,
        [DecidedAt] datetime2 NOT NULL,
        [RiskScoreAtDecision] decimal(5,2) NULL,
        [IsAppealDecision] bit NOT NULL,
        [AppealRequestId] int NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_IncidentDecisionHistory] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_IncidentDecisionHistory_AppealRequests_AppealRequestId] FOREIGN KEY ([AppealRequestId]) REFERENCES [AppealRequests] ([Id]),
        CONSTRAINT [FK_IncidentDecisionHistory_IncidentCases_IncidentCaseId] FOREIGN KEY ([IncidentCaseId]) REFERENCES [IncidentCases] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDate', N'DeletedBy', N'IsDeleted', N'NameAr', N'NameEn', N'UpdatedBy', N'UpdatedDate') AND [object_id] = OBJECT_ID(N'[QuestionTypes]'))
        SET IDENTITY_INSERT [QuestionTypes] ON;
    EXEC(N'INSERT INTO [QuestionTypes] ([Id], [CreatedBy], [CreatedDate], [DeletedBy], [IsDeleted], [NameAr], [NameEn], [UpdatedBy], [UpdatedDate])
    VALUES (1, N''System'', ''2024-01-01T00:00:00.0000000Z'', NULL, CAST(0 AS bit), N''?????? ?? ????? (????? ?????)'', N''MCQ_Single'', NULL, NULL),
    (2, N''System'', ''2024-01-01T00:00:00.0000000Z'', NULL, CAST(0 AS bit), N''?????? ?? ????? (???? ?? ?????)'', N''MCQ_Multi'', NULL, NULL),
    (3, N''System'', ''2024-01-01T00:00:00.0000000Z'', NULL, CAST(0 AS bit), N''??/???'', N''TrueFalse'', NULL, NULL),
    (4, N''System'', ''2024-01-01T00:00:00.0000000Z'', NULL, CAST(0 AS bit), N''????? ?????'', N''ShortAnswer'', NULL, NULL)');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDate', N'DeletedBy', N'IsDeleted', N'NameAr', N'NameEn', N'UpdatedBy', N'UpdatedDate') AND [object_id] = OBJECT_ID(N'[QuestionTypes]'))
        SET IDENTITY_INSERT [QuestionTypes] OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_AppealRequests_AppealNumber_Unique] ON [AppealRequests] ([AppealNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AppealRequests_AttemptId] ON [AppealRequests] ([AttemptId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AppealRequests_CandidateId] ON [AppealRequests] ([CandidateId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AppealRequests_ExamId] ON [AppealRequests] ([ExamId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AppealRequests_IncidentCaseId] ON [AppealRequests] ([IncidentCaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AppealRequests_ReviewedBy] ON [AppealRequests] ([ReviewedBy]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AppealRequests_Status] ON [AppealRequests] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AppealRequests_SubmittedAt] ON [AppealRequests] ([SubmittedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AspNetRoleClaims_RoleId] ON [AspNetRoleClaims] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [RoleNameIndex] ON [AspNetRoles] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AspNetUserClaims_UserId] ON [AspNetUserClaims] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AspNetUserLogins_UserId] ON [AspNetUserLogins] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AspNetUserRoles_RoleId] ON [AspNetUserRoles] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [EmailIndex] ON [AspNetUsers] ([NormalizedEmail]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AspNetUsers_Email] ON [AspNetUsers] ([Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AspNetUsers_IsDeleted] ON [AspNetUsers] ([IsDeleted]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UserNameIndex] ON [AspNetUsers] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AttemptAnswers_AttemptId] ON [AttemptAnswers] ([AttemptId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_AttemptAnswers_AttemptId_QuestionId] ON [AttemptAnswers] ([AttemptId], [QuestionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AttemptAnswers_AttemptQuestionId] ON [AttemptAnswers] ([AttemptQuestionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AttemptEvents_AttemptId] ON [AttemptEvents] ([AttemptId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AttemptEvents_AttemptId_OccurredAt] ON [AttemptEvents] ([AttemptId], [OccurredAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AttemptEvents_EventType] ON [AttemptEvents] ([EventType]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AttemptQuestions_AttemptId] ON [AttemptQuestions] ([AttemptId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_AttemptQuestions_AttemptId_QuestionId] ON [AttemptQuestions] ([AttemptId], [QuestionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AttemptQuestions_Order] ON [AttemptQuestions] ([Order]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AttemptQuestions_QuestionId] ON [AttemptQuestions] ([QuestionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Attempts_CandidateId] ON [Attempts] ([CandidateId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Attempts_ExamId_CandidateId] ON [Attempts] ([ExamId], [CandidateId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Attempts_ExamId_CandidateId_AttemptNumber] ON [Attempts] ([ExamId], [CandidateId], [AttemptNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Attempts_ExpiresAt] ON [Attempts] ([ExpiresAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Attempts_StartedAt] ON [Attempts] ([StartedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Attempts_Status] ON [Attempts] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AuditExportJobs_RequestedAt] ON [AuditExportJobs] ([RequestedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AuditExportJobs_RequestedBy] ON [AuditExportJobs] ([RequestedBy]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AuditExportJobs_Status] ON [AuditExportJobs] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AuditExportJobs_Status_RequestedAt] ON [AuditExportJobs] ([Status], [RequestedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_Action_Outcome] ON [AuditLogs] ([Action], [Outcome]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_ActorId_OccurredAt] ON [AuditLogs] ([ActorId], [OccurredAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_Channel] ON [AuditLogs] ([Channel]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_CorrelationId] ON [AuditLogs] ([CorrelationId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_EntityName_EntityId] ON [AuditLogs] ([EntityName], [EntityId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_OccurredAt] ON [AuditLogs] ([OccurredAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_Outcome] ON [AuditLogs] ([Outcome]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_Retention] ON [AuditLogs] ([EntityName], [Action], [OccurredAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_Source] ON [AuditLogs] ([Source]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AuditRetentionPolicies_EntityName] ON [AuditRetentionPolicies] ([EntityName]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AuditRetentionPolicies_IsActive] ON [AuditRetentionPolicies] ([IsActive]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AuditRetentionPolicies_IsDefault] ON [AuditRetentionPolicies] ([IsDefault]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_AuditRetentionPolicies_Priority] ON [AuditRetentionPolicies] ([Priority]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_CandidateExamSummaries_BestAttemptId] ON [CandidateExamSummaries] ([BestAttemptId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_CandidateExamSummaries_BestResultId] ON [CandidateExamSummaries] ([BestResultId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_CandidateExamSummaries_CandidateId] ON [CandidateExamSummaries] ([CandidateId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_CandidateExamSummaries_ExamId] ON [CandidateExamSummaries] ([ExamId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CandidateExamSummaries_ExamId_CandidateId_Unique] ON [CandidateExamSummaries] ([ExamId], [CandidateId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ExamAccessPolicies_ExamId] ON [ExamAccessPolicies] ([ExamId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ExamInstructions_ExamId] ON [ExamInstructions] ([ExamId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ExamInstructions_ExamId_Order] ON [ExamInstructions] ([ExamId], [Order]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ExamQuestions_ExamId] ON [ExamQuestions] ([ExamId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ExamQuestions_ExamId_QuestionId] ON [ExamQuestions] ([ExamId], [QuestionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ExamQuestions_ExamSectionId] ON [ExamQuestions] ([ExamSectionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ExamQuestions_QuestionId] ON [ExamQuestions] ([QuestionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ExamQuestions_SectionId_Order] ON [ExamQuestions] ([ExamSectionId], [Order]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ExamReports_ExamId_GeneratedAt] ON [ExamReports] ([ExamId], [GeneratedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ExamReports_GeneratedAt] ON [ExamReports] ([GeneratedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Exams_CreatedDate] ON [Exams] ([CreatedDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Exams_IsActive] ON [Exams] ([IsActive]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Exams_IsPublished] ON [Exams] ([IsPublished]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Exams_StartAt] ON [Exams] ([StartAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Exams_TitleEn] ON [Exams] ([TitleEn]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ExamSections_ExamId] ON [ExamSections] ([ExamId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ExamSections_ExamId_Order] ON [ExamSections] ([ExamId], [Order]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_GradedAnswers_AttemptId] ON [GradedAnswers] ([AttemptId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_GradedAnswers_GradingSessionId] ON [GradedAnswers] ([GradingSessionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_GradedAnswers_GradingSessionId_QuestionId] ON [GradedAnswers] ([GradingSessionId], [QuestionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_GradedAnswers_IsManuallyGraded] ON [GradedAnswers] ([IsManuallyGraded]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_GradedAnswers_QuestionId] ON [GradedAnswers] ([QuestionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_GradingSessions_AttemptId_Unique] ON [GradingSessions] ([AttemptId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_GradingSessions_GradedAt] ON [GradingSessions] ([GradedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_GradingSessions_GradedBy] ON [GradingSessions] ([GradedBy]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_GradingSessions_Status] ON [GradingSessions] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentCases_AssignedTo] ON [IncidentCases] ([AssignedTo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentCases_AttemptId] ON [IncidentCases] ([AttemptId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentCases_CandidateId] ON [IncidentCases] ([CandidateId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_IncidentCases_CaseNumber_Unique] ON [IncidentCases] ([CaseNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentCases_CreatedDate] ON [IncidentCases] ([CreatedDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentCases_ExamId_CandidateId] ON [IncidentCases] ([ExamId], [CandidateId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentCases_ProctorSessionId] ON [IncidentCases] ([ProctorSessionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentCases_Severity] ON [IncidentCases] ([Severity]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentCases_Status] ON [IncidentCases] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentCases_Status_Severity_AssignedTo] ON [IncidentCases] ([Status], [Severity], [AssignedTo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentComments_AuthorId] ON [IncidentComments] ([AuthorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentComments_CreatedDate] ON [IncidentComments] ([CreatedDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentComments_IncidentCaseId] ON [IncidentComments] ([IncidentCaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentDecisionHistory_AppealRequestId] ON [IncidentDecisionHistory] ([AppealRequestId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentDecisionHistory_DecidedAt] ON [IncidentDecisionHistory] ([DecidedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentDecisionHistory_IncidentCaseId] ON [IncidentDecisionHistory] ([IncidentCaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentDecisionHistory_Outcome] ON [IncidentDecisionHistory] ([Outcome]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentEvidenceLinks_IncidentCaseId] ON [IncidentEvidenceLinks] ([IncidentCaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentEvidenceLinks_ProctorEventId] ON [IncidentEvidenceLinks] ([ProctorEventId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentEvidenceLinks_ProctorEvidenceId] ON [IncidentEvidenceLinks] ([ProctorEvidenceId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentTimelineEvents_EventType] ON [IncidentTimelineEvents] ([EventType]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentTimelineEvents_IncidentCaseId] ON [IncidentTimelineEvents] ([IncidentCaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_IncidentTimelineEvents_OccurredAt] ON [IncidentTimelineEvents] ([OccurredAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_MediaFiles_CreatedDate] ON [MediaFiles] ([CreatedDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_MediaFiles_Folder] ON [MediaFiles] ([Folder]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_MediaFiles_IsDeleted] ON [MediaFiles] ([IsDeleted]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_MediaFiles_MediaType] ON [MediaFiles] ([MediaType]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorDecisions_AttemptId] ON [ProctorDecisions] ([AttemptId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorDecisions_DecidedAt] ON [ProctorDecisions] ([DecidedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorDecisions_IsFinalized] ON [ProctorDecisions] ([IsFinalized]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ProctorDecisions_ProctorSessionId_Unique] ON [ProctorDecisions] ([ProctorSessionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorDecisions_Status] ON [ProctorDecisions] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorEvents_AttemptId] ON [ProctorEvents] ([AttemptId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorEvents_EventType] ON [ProctorEvents] ([EventType]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorEvents_IsViolation] ON [ProctorEvents] ([IsViolation]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorEvents_OccurredAt] ON [ProctorEvents] ([OccurredAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorEvents_ProctorSessionId] ON [ProctorEvents] ([ProctorSessionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorEvents_Session_Type_Time] ON [ProctorEvents] ([ProctorSessionId], [EventType], [OccurredAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorEvidence_AttemptId] ON [ProctorEvidence] ([AttemptId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorEvidence_ExpiresAt] ON [ProctorEvidence] ([ExpiresAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorEvidence_IsUploaded] ON [ProctorEvidence] ([IsUploaded]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorEvidence_ProctorSessionId] ON [ProctorEvidence] ([ProctorSessionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorEvidence_Type] ON [ProctorEvidence] ([Type]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorRiskRules_EventType] ON [ProctorRiskRules] ([EventType]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorRiskRules_IsActive] ON [ProctorRiskRules] ([IsActive]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorRiskRules_Priority] ON [ProctorRiskRules] ([Priority]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorRiskSnapshots_CalculatedAt] ON [ProctorRiskSnapshots] ([CalculatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorRiskSnapshots_ProctorSessionId] ON [ProctorRiskSnapshots] ([ProctorSessionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorRiskSnapshots_RiskScore] ON [ProctorRiskSnapshots] ([RiskScore]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorSessions_AttemptId] ON [ProctorSessions] ([AttemptId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ProctorSessions_AttemptId_Mode_Unique] ON [ProctorSessions] ([AttemptId], [Mode]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorSessions_CandidateId] ON [ProctorSessions] ([CandidateId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorSessions_ExamId] ON [ProctorSessions] ([ExamId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorSessions_RiskScore] ON [ProctorSessions] ([RiskScore]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorSessions_StartedAt] ON [ProctorSessions] ([StartedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ProctorSessions_Status] ON [ProctorSessions] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_QuestionAnswerKeys_QuestionId] ON [QuestionAnswerKeys] ([QuestionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_QuestionAttachments_QuestionId] ON [QuestionAttachments] ([QuestionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_QuestionAttachments_QuestionId_IsPrimary] ON [QuestionAttachments] ([QuestionId], [IsPrimary]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_QuestionCategories_NameAr] ON [QuestionCategories] ([NameAr]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_QuestionCategories_NameEn] ON [QuestionCategories] ([NameEn]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_QuestionOptions_QuestionId] ON [QuestionOptions] ([QuestionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_QuestionOptions_QuestionId_IsCorrect] ON [QuestionOptions] ([QuestionId], [IsCorrect]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_QuestionOptions_QuestionId_Order] ON [QuestionOptions] ([QuestionId], [Order]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_QuestionPerformanceReports_ExamId] ON [QuestionPerformanceReports] ([ExamId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_QuestionPerformanceReports_ExamId_QuestionId] ON [QuestionPerformanceReports] ([ExamId], [QuestionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_QuestionPerformanceReports_GeneratedAt] ON [QuestionPerformanceReports] ([GeneratedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_QuestionPerformanceReports_QuestionId] ON [QuestionPerformanceReports] ([QuestionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Questions_CreatedDate] ON [Questions] ([CreatedDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Questions_DifficultyLevel] ON [Questions] ([DifficultyLevel]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Questions_IsActive] ON [Questions] ([IsActive]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Questions_QuestionCategoryId] ON [Questions] ([QuestionCategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Questions_QuestionTypeId] ON [Questions] ([QuestionTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_QuestionTypes_NameAr] ON [QuestionTypes] ([NameAr]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_QuestionTypes_NameEn] ON [QuestionTypes] ([NameEn]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ResultExportJobs_ExamId_Status_RequestedAt] ON [ResultExportJobs] ([ExamId], [Status], [RequestedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ResultExportJobs_RequestedAt] ON [ResultExportJobs] ([RequestedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ResultExportJobs_RequestedBy] ON [ResultExportJobs] ([RequestedBy]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_ResultExportJobs_Status] ON [ResultExportJobs] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Results_AttemptId_Unique] ON [Results] ([AttemptId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Results_CandidateId] ON [Results] ([CandidateId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Results_ExamId_CandidateId] ON [Results] ([ExamId], [CandidateId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Results_ExamId_IsPassed] ON [Results] ([ExamId], [IsPassed]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Results_FinalizedAt] ON [Results] ([FinalizedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Results_IsPublishedToCandidate] ON [Results] ([IsPublishedToCandidate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111183852_InitialMigration'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260111183852_InitialMigration', N'9.0.0');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    ALTER TABLE [Exams] ADD [DepartmentId] int NOT NULL DEFAULT 0;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    ALTER TABLE [Exams] ADD [ExamType] tinyint NOT NULL DEFAULT CAST(0 AS tinyint);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    ALTER TABLE [ExamQuestions] ADD [ExamTopicId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    ALTER TABLE [AspNetUsers] ADD [DepartmentId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    CREATE TABLE [Departments] (
        [Id] int NOT NULL IDENTITY,
        [NameEn] nvarchar(300) NOT NULL,
        [NameAr] nvarchar(300) NOT NULL,
        [DescriptionEn] nvarchar(2000) NULL,
        [DescriptionAr] nvarchar(2000) NULL,
        [Code] nvarchar(50) NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Departments] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    CREATE TABLE [ExamTopics] (
        [Id] int NOT NULL IDENTITY,
        [ExamSectionId] int NOT NULL,
        [TitleEn] nvarchar(500) NOT NULL,
        [TitleAr] nvarchar(500) NOT NULL,
        [DescriptionEn] nvarchar(2000) NULL,
        [DescriptionAr] nvarchar(2000) NULL,
        [Order] int NOT NULL,
        [CreatedDate] datetime2 NOT NULL,
        [UpdatedDate] datetime2 NULL,
        [CreatedBy] nvarchar(450) NULL,
        [UpdatedBy] nvarchar(450) NULL,
        [DeletedBy] nvarchar(450) NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ExamTopics] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ExamTopics_ExamSections_ExamSectionId] FOREIGN KEY ([ExamSectionId]) REFERENCES [ExamSections] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDate', N'DeletedBy', N'IsDeleted', N'NameAr', N'NameEn', N'UpdatedBy', N'UpdatedDate') AND [object_id] = OBJECT_ID(N'[QuestionTypes]'))
        SET IDENTITY_INSERT [QuestionTypes] ON;
    EXEC(N'INSERT INTO [QuestionTypes] ([Id], [CreatedBy], [CreatedDate], [DeletedBy], [IsDeleted], [NameAr], [NameEn], [UpdatedBy], [UpdatedDate])
    VALUES (5, N''System'', ''2024-01-01T00:00:00.0000000Z'', NULL, CAST(0 AS bit), N''?????'', N''Essay'', NULL, NULL),
    (6, N''System'', ''2024-01-01T00:00:00.0000000Z'', NULL, CAST(0 AS bit), N''????'', N''Numeric'', NULL, NULL)');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDate', N'DeletedBy', N'IsDeleted', N'NameAr', N'NameEn', N'UpdatedBy', N'UpdatedDate') AND [object_id] = OBJECT_ID(N'[QuestionTypes]'))
        SET IDENTITY_INSERT [QuestionTypes] OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    CREATE INDEX [IX_Exams_DepartmentId] ON [Exams] ([DepartmentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    CREATE INDEX [IX_Exams_ExamType] ON [Exams] ([ExamType]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    CREATE INDEX [IX_ExamQuestions_ExamTopicId] ON [ExamQuestions] ([ExamTopicId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    CREATE INDEX [IX_AspNetUsers_DepartmentId] ON [AspNetUsers] ([DepartmentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Departments_Code] ON [Departments] ([Code]) WHERE [Code] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    CREATE INDEX [IX_Departments_IsActive] ON [Departments] ([IsActive]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Departments_NameAr] ON [Departments] ([NameAr]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Departments_NameEn] ON [Departments] ([NameEn]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    CREATE INDEX [IX_ExamTopics_ExamSectionId] ON [ExamTopics] ([ExamSectionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ExamTopics_SectionId_Order] ON [ExamTopics] ([ExamSectionId], [Order]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    ALTER TABLE [AspNetUsers] ADD CONSTRAINT [FK_AspNetUsers_Departments_DepartmentId] FOREIGN KEY ([DepartmentId]) REFERENCES [Departments] ([Id]) ON DELETE SET NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    ALTER TABLE [ExamQuestions] ADD CONSTRAINT [FK_ExamQuestions_ExamTopics_ExamTopicId] FOREIGN KEY ([ExamTopicId]) REFERENCES [ExamTopics] ([Id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    ALTER TABLE [Exams] ADD CONSTRAINT [FK_Exams_Departments_DepartmentId] FOREIGN KEY ([DepartmentId]) REFERENCES [Departments] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117032303_AddDepartmentAndExamStructure'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260117032303_AddDepartmentAndExamStructure', N'9.0.0');
END;

COMMIT;
GO

