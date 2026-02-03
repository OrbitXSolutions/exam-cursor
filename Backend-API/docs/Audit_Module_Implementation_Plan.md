# Audit Module — Implementation Plan & Examples

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Business Rules Implementation](#business-rules-implementation)
6. [Usage Examples](#usage-examples)
7. [Integration Guide](#integration-guide)
8. [Retention Policies](#retention-policies)
9. [Export Jobs](#export-jobs)
10. [Security & Access Control](#security--access-control)
11. [Performance Considerations](#performance-considerations)
12. [Future Enhancements](#future-enhancements)

---

## Overview

The Audit Module provides comprehensive, immutable logging of all critical system and user actions for security, compliance, and troubleshooting.

### Key Features
- **Immutable Audit Logs**: Append-only records of all actions
- **Comprehensive Coverage**: Auth, Assessment, Attempt, Grading, Result, Proctor, Incident modules
- **Data Snapshots**: Before/after state capture for critical changes
- **Correlation Tracking**: End-to-end request tracing
- **Retention Policies**: Configurable log retention with archiving
- **Export Jobs**: Export logs to CSV, Excel, JSON, PDF
- **Dashboard**: Real-time statistics and analytics

### Core Entities
- **AuditLog**: Immutable audit entry
- **AuditRetentionPolicy**: Log retention configuration
- **AuditExportJob**: Export job tracking

---

## Architecture

### File Structure
```
Smart_Core/
??? Domain/
?   ??? Entities/
?   ?   ??? Audit/
?   ?       ??? AuditLog.cs
?   ?   ??? AuditRetentionPolicy.cs
?   ?       ??? AuditExportJob.cs
?   ??? Enums/
?    ??? AuditEnums.cs
??? Application/
?   ??? DTOs/
?   ?   ??? Audit/
?   ?    ??? AuditDtos.cs
?   ??? Interfaces/
?   ? ??? Audit/
?   ?       ??? IAuditService.cs
?   ??? Validators/
?       ??? Audit/
?           ??? AuditValidators.cs
??? Infrastructure/
?   ??? Data/
?   ?   ??? Configurations/
?   ?    ??? Audit/
?   ?           ??? AuditLogConfiguration.cs
?   ?  ??? AuditRetentionPolicyConfiguration.cs
?   ???? AuditExportJobConfiguration.cs
?   ??? Services/
? ??? Audit/
?    ??? AuditService.cs
??? Controllers/
??? Audit/
        ??? AuditController.cs
```

### Dependencies
- All modules can write audit logs
- Background job for export processing
- Background job for retention execution

---

## Database Schema

### Entity Relationships
```
???????????????????????????????????????????????????????????????????
?     AuditLog  ?
???????????????????????????????????????????????????????????????????
? Id (long)      - Auto-increment PK  ?
? ActorId    - Who performed action (nullable for system)?
? ActorType- User/System/Service  ?
? ActorDisplayName  - Display name for UI    ?
? Action     - e.g., "Attempt.Submitted"         ?
? EntityName - e.g., "Attempt"   ?
? EntityId            - Entity identifier (string)            ?
? CorrelationId       - Request trace ID     ?
? TenantId      - Multi-tenant support ?
? Source         - API/BackgroundJob/Scheduler     ?
? Channel   - Web/Mobile/AdminPortal           ?
? IpAddress   - Client IP       ?
? UserAgent    - Client user agent             ?
? BeforeJson          - State before change             ?
? AfterJson           - State after change ?
? MetadataJson        - Additional context             ?
? Outcome         - Success/Failure                ?
? ErrorMessage        - Error details if failed       ?
? OccurredAt          - Timestamp           ?
? DurationMs          - Action duration            ?
???????????????????????????????????????????????????????????????????

???????????????????????????????????????????
?     AuditRetentionPolicy             ?
???????????????????????????????????????????
? Id          ?
? NameEn/NameAr        ?
? IsActive     ?
? IsDefault              ?
? Priority   ?
? RetentionDays           ?
? EntityName (scope filter)               ?
? ActionPrefix (scope filter)  ?
? Channel (scope filter)     ?
? ArchiveBeforeDelete     ?
? ArchiveTarget              ?
???????????????????????????????????????????

???????????????????????????????????????????
?         AuditExportJob     ?
???????????????????????????????????????????
? Id               ?
? FromDate/ToDate     ?
? EntityName/ActionPrefix (filters)       ?
? Format (CSV/Excel/JSON/PDF)     ?
? Status (Pending/Processing/Completed)   ?
? RequestedBy   ?
? FilePath               ?
? TotalRecords        ?
???????????????????????????????????????????
```

### Indexes
```sql
-- Primary query patterns
CREATE INDEX IX_AuditLogs_OccurredAt ON AuditLogs(OccurredAt);
CREATE INDEX IX_AuditLogs_EntityName_EntityId ON AuditLogs(EntityName, EntityId);
CREATE INDEX IX_AuditLogs_ActorId_OccurredAt ON AuditLogs(ActorId, OccurredAt);
CREATE INDEX IX_AuditLogs_CorrelationId ON AuditLogs(CorrelationId);
CREATE INDEX IX_AuditLogs_Action_Outcome ON AuditLogs(Action, Outcome);

-- Retention processing
CREATE INDEX IX_AuditLogs_Retention ON AuditLogs(EntityName, Action, OccurredAt);
```

---

## API Endpoints

### Audit Log Queries

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/audit/log/{logId}` | Get log by ID | Admin, Auditor |
| GET | `/api/audit/logs` | Search logs | Admin, Auditor |
| GET | `/api/audit/entity-history` | Get entity change history | Admin, Auditor |
| GET | `/api/audit/user-activity` | Get user activity | Admin, Auditor |
| GET | `/api/audit/correlation/{id}` | Get logs by correlation ID | Admin, Auditor |
| GET | `/api/audit/failures` | Get recent failures | Admin, Auditor |

### Retention Policies

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/audit/policies` | Get all policies | Admin, Auditor |
| GET | `/api/audit/policy/{id}` | Get policy by ID | Admin, Auditor |
| POST | `/api/audit/policy` | Create policy | Admin |
| PUT | `/api/audit/policy` | Update policy | Admin |
| DELETE | `/api/audit/policy/{id}` | Delete policy | Admin |
| POST | `/api/audit/policy/{id}/set-default` | Set default policy | Admin |
| POST | `/api/audit/policies/execute` | Execute retention | Admin |
| GET | `/api/audit/policy/{id}/preview` | Preview retention | Admin, Auditor |

### Export Jobs

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/audit/export` | Create export job | Admin, Auditor |
| GET | `/api/audit/export/{id}` | Get export job | Admin, Auditor |
| GET | `/api/audit/exports` | Get all export jobs | Admin, Auditor |
| GET | `/api/audit/exports/my` | Get my export jobs | Admin, Auditor |
| POST | `/api/audit/export/{id}/cancel` | Cancel export | Admin, Auditor |
| GET | `/api/audit/export/{id}/download` | Get download URL | Admin, Auditor |

### Dashboard

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/audit/dashboard` | Get dashboard | Admin, Auditor |
| GET | `/api/audit/dashboard/entity/{name}` | Get entity dashboard | Admin, Auditor |

---

## Business Rules Implementation

### 1. Immutability Rule

```csharp
// AuditLog table has no update/delete operations from application
// Only retention jobs can delete after policy period

// Configuration enforces this:
public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        // No soft delete filter - audit logs should not use soft delete
        // builder.HasQueryFilter(x => !x.IsDeleted);
        
        // Note: No UPDATE or DELETE methods exposed in service
    }
}
```

### 2. When to Write Audit Logs

```csharp
// Actions that require audit logging:

// Auth Module
await _auditService.LogSuccessAsync(AuditActions.AuthLogin, "User", userId);
await _auditService.LogFailureAsync(AuditActions.AuthLoginFailed, "User", email, "Invalid password");

// Attempt Module
await _auditService.LogSuccessAsync(AuditActions.AttemptStarted, "Attempt", attemptId.ToString());
await _auditService.LogSuccessAsync(AuditActions.AttemptSubmitted, "Attempt", attemptId.ToString(),
after: new { totalAnswered, submittedAt });

// Result Module
await _auditService.LogSuccessAsync(AuditActions.ResultPublished, "Result", resultId.ToString(),
    before: new { wasPublished = false },
    after: new { isPublished = true, publishedAt });

// Incident Module
await _auditService.LogSuccessAsync(AuditActions.IncidentDecisionMade, "IncidentCase", caseId.ToString(),
    after: new { outcome, decidedBy });
```

### 3. Actor Attribution

```csharp
public async Task LogAsync(CreateAuditLogDto dto)
{
    var auditLog = new AuditLog
    {
     ActorId = dto.ActorId,
     ActorType = string.IsNullOrEmpty(dto.ActorId) 
     ? ActorType.System 
            : dto.ActorType,
        ActorDisplayName = dto.ActorDisplayName ?? _currentUserService.UserName,
        // ... other fields
  };
    
    // For system jobs, ActorType must be System
    if (auditLog.ActorType == ActorType.System)
    {
        auditLog.ActorDisplayName = "System";
    }
}
```

### 4. Data Snapshot Rules

```csharp
// Capture before/after for critical changes
public async Task ChangeRoleAsync(string userId, string newRole)
{
    var user = await GetUserAsync(userId);
    var oldRole = user.Role;
    
    user.Role = newRole;
    await SaveChangesAsync();
    
    // Audit with before/after snapshots
    await _auditService.LogSuccessAsync(
        AuditActions.AuthRoleChanged,
        "User",
        userId,
   before: new { role = oldRole },
 after: new { role = newRole }
    );
}

// Mask sensitive data
private object SanitizeForAudit(object data)
{
    // Remove passwords, tokens, secrets
    // Keep only relevant fields
  return new
    {
    // Safe fields only
    };
}
```

### 5. Non-Blocking Logging

```csharp
public async Task LogAsync(CreateAuditLogDto dto)
{
    try
    {
        var auditLog = MapToAuditLog(dto);
        _context.Set<AuditLog>().Add(auditLog);
        await _context.SaveChangesAsync();
    }
    catch (Exception ex)
    {
     // Audit logging should NOT block business operations
        _logger.LogError(ex, "Failed to write audit log for {Action}", dto.Action);
        // Do not throw - allow business operation to continue
    }
}
```

---

## Usage Examples

### 1. Search Audit Logs

**Request:**
```http
GET /api/audit/logs?entityName=Attempt&outcome=1&fromDate=2024-01-01&pageSize=20
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
    "success": true,
    "data": {
  "items": [
 {
        "id": 1001,
       "actorDisplayName": "John Doe",
    "actorType": 1,
          "action": "Attempt.Submitted",
     "entityName": "Attempt",
       "entityId": "100",
                "outcome": 1,
                "outcomeName": "Success",
         "source": 1,
        "channel": 1,
       "occurredAt": "2024-01-15T10:30:00Z",
    "hasSnapshot": true
      },
            {
           "id": 1000,
                "actorDisplayName": "John Doe",
 "actorType": 1,
        "action": "Attempt.Started",
    "entityName": "Attempt",
    "entityId": "100",
    "outcome": 1,
      "outcomeName": "Success",
    "occurredAt": "2024-01-15T09:00:00Z",
   "hasSnapshot": false
 }
        ],
   "pageNumber": 1,
        "pageSize": 20,
        "totalCount": 2
    }
}
```

### 2. Get Entity History

**Request:**
```http
GET /api/audit/entity-history?entityName=Result&entityId=50
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "items": [
      {
                "id": 2003,
     "action": "Result.Published",
           "actorDisplayName": "Admin User",
      "occurredAt": "2024-01-15T16:00:00Z",
 "beforeJson": "{\"isPublished\":false}",
       "afterJson": "{\"isPublished\":true,\"publishedAt\":\"2024-01-15T16:00:00Z\"}"
            },
    {
                "id": 2002,
                "action": "Result.Finalized",
    "actorDisplayName": "System",
    "actorType": 2,
  "occurredAt": "2024-01-15T14:00:00Z"
            },
            {
    "id": 2001,
    "action": "Result.Created",
  "actorDisplayName": "System",
     "actorType": 2,
     "occurredAt": "2024-01-15T12:00:00Z"
       }
        ],
        "totalCount": 3
}
}
```

### 3. Get User Activity

**Request:**
```http
GET /api/audit/user-activity?userId=user123&fromDate=2024-01-15&toDate=2024-01-16
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "items": [
   {
    "id": 3005,
     "action": "Auth.Logout",
    "entityName": "User",
     "entityId": "user123",
  "occurredAt": "2024-01-15T18:00:00Z"
   },
         {
       "id": 3004,
 "action": "Attempt.Submitted",
      "entityName": "Attempt",
    "entityId": "150",
       "occurredAt": "2024-01-15T12:30:00Z"
         },
            {
"id": 3003,
          "action": "Attempt.Started",
       "entityName": "Attempt",
                "entityId": "150",
     "occurredAt": "2024-01-15T10:00:00Z"
       },
 {
         "id": 3002,
         "action": "Auth.Login",
          "entityName": "User",
            "entityId": "user123",
            "occurredAt": "2024-01-15T09:55:00Z"
     }
        ],
     "totalCount": 4
    }
}
```

### 4. Trace by Correlation ID

**Request:**
```http
GET /api/audit/correlation/req-abc123-def456
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": 4001,
        "action": "Attempt.Submitted",
         "entityName": "Attempt",
   "entityId": "200",
          "occurredAt": "2024-01-15T14:30:00.100Z"
    },
   {
 "id": 4002,
            "action": "Grading.Started",
            "entityName": "GradingSession",
          "entityId": "80",
            "occurredAt": "2024-01-15T14:30:00.200Z"
 },
        {
            "id": 4003,
   "action": "Grading.Completed",
            "entityName": "GradingSession",
            "entityId": "80",
         "occurredAt": "2024-01-15T14:30:00.500Z"
        },
  {
            "id": 4004,
         "action": "Result.Created",
            "entityName": "Result",
            "entityId": "120",
   "occurredAt": "2024-01-15T14:30:00.600Z"
        }
    ]
}
```

### 5. Get Full Audit Log Details

**Request:**
```http
GET /api/audit/log/1001
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 1001,
        "actorId": "user123",
  "actorType": 1,
        "actorTypeName": "User",
        "actorDisplayName": "John Doe",
        "action": "Attempt.Submitted",
        "entityName": "Attempt",
        "entityId": "100",
     "correlationId": "req-abc123",
        "tenantId": null,
        "source": 1,
        "sourceName": "Api",
   "channel": 1,
        "channelName": "Web",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "beforeJson": null,
        "afterJson": "{\"totalAnswered\":45,\"submittedAt\":\"2024-01-15T10:30:00Z\"}",
        "metadataJson": "{\"examId\":1,\"duration\":5400}",
        "outcome": 1,
"outcomeName": "Success",
        "errorMessage": null,
        "occurredAt": "2024-01-15T10:30:00Z",
        "durationMs": 150
    }
}
```

### 6. Create Retention Policy

**Request:**
```http
POST /api/audit/policy
Content-Type: application/json
Authorization: Bearer {admin_token}

{
    "nameEn": "Proctor Events - 90 Days",
    "nameAr": "????? ???????? - 90 ???",
    "descriptionEn": "Retain proctor events for 90 days",
    "isActive": true,
    "priority": 10,
    "retentionDays": 90,
    "entityName": "ProctorEvent",
  "actionPrefix": "Proctor.",
    "archiveBeforeDelete": true,
    "archiveTarget": "S3"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 2,
"nameEn": "Proctor Events - 90 Days",
        "nameAr": "????? ???????? - 90 ???",
   "isActive": true,
        "isDefault": false,
        "priority": 10,
        "retentionDays": 90,
        "entityName": "ProctorEvent",
        "actionPrefix": "Proctor.",
        "archiveBeforeDelete": true,
        "archiveTarget": "S3",
        "createdAt": "2024-01-15T10:00:00Z"
    }
}
```

### 7. Preview Retention Execution

**Request:**
```http
GET /api/audit/policy/2/preview
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
    "success": true,
    "data": 15420,
 "message": "15420 logs would be affected"
}
```

### 8. Execute Retention Policies

**Request:**
```http
POST /api/audit/policies/execute
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
     "policyId": 1,
          "policyName": "Default - 180 Days",
  "logsProcessed": 50000,
    "logsArchived": 50000,
   "logsDeleted": 50000,
 "executedAt": "2024-01-15T02:00:00Z",
   "success": true
        },
     {
 "policyId": 2,
   "policyName": "Proctor Events - 90 Days",
          "logsProcessed": 15420,
        "logsArchived": 15420,
    "logsDeleted": 15420,
"executedAt": "2024-01-15T02:00:30Z",
 "success": true
 }
    ]
}
```

### 9. Create Export Job

**Request:**
```http
POST /api/audit/export
Content-Type: application/json
Authorization: Bearer {admin_token}

{
    "fromDate": "2024-01-01T00:00:00Z",
    "toDate": "2024-01-31T23:59:59Z",
    "entityName": "Incident",
    "actionPrefix": "Incident.",
    "format": 1
}
```

**Response:**
```json
{
"success": true,
    "data": {
        "id": 5,
        "fromDate": "2024-01-01T00:00:00Z",
      "toDate": "2024-01-31T23:59:59Z",
        "entityName": "Incident",
    "actionPrefix": "Incident.",
        "format": 1,
        "formatName": "Csv",
        "status": 1,
   "statusName": "Pending",
        "requestedBy": "admin001",
   "requesterName": "Admin User",
        "requestedAt": "2024-01-15T10:00:00Z"
    }
}
```

### 10. Get Dashboard

**Request:**
```http
GET /api/audit/dashboard?fromDate=2024-01-01&toDate=2024-01-31
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "totalLogs": 125000,
        "logsToday": 4500,
   "logsThisWeek": 28000,
        "logsThisMonth": 125000,
        "successCount": 123500,
"failureCount": 1500,
        "successRate": 98.8,
        "topActions": [
{ "action": "Attempt.Started", "count": 15000, "successCount": 14950, "failureCount": 50 },
            { "action": "Attempt.Submitted", "count": 14800, "successCount": 14800, "failureCount": 0 },
            { "action": "Auth.Login", "count": 12000, "successCount": 11500, "failureCount": 500 },
            { "action": "Proctor.EventRecorded", "count": 45000, "successCount": 45000, "failureCount": 0 }
        ],
        "topEntities": [
    { "entityName": "ProctorEvent", "count": 45000 },
        { "entityName": "Attempt", "count": 30000 },
   { "entityName": "User", "count": 15000 },
     { "entityName": "IncidentCase", "count": 5000 }
],
        "topActors": [
    { "actorId": null, "actorDisplayName": "System", "actorType": 2, "count": 60000 },
            { "actorId": "admin001", "actorDisplayName": "Admin User", "actorType": 1, "count": 5000 }
      ],
    "channelDistribution": [
            { "channel": 1, "channelName": "Web", "count": 80000, "percentage": 64 },
            { "channel": 2, "channelName": "Mobile", "count": 30000, "percentage": 24 },
            { "channel": 5, "channelName": "Internal", "count": 15000, "percentage": 12 }
        ],
        "activeRetentionPolicies": 3,
   "pendingExportJobs": 2
    }
}
```

---

## Integration Guide

### Adding Audit Logging to a Module

```csharp
public class MyService
{
  private readonly IAuditService _auditService;
    
    public MyService(IAuditService auditService)
    {
      _auditService = auditService;
    }
    
    public async Task DoSomethingAsync(int entityId, string userId)
    {
        try
        {
   // Get before state
      var entity = await GetEntityAsync(entityId);
       var before = new { entity.Status, entity.Value };
   
  // Perform operation
       entity.Status = "Updated";
            entity.Value = 100;
        await SaveChangesAsync();
        
            // Log success with before/after
  await _auditService.LogSuccessAsync(
             "MyEntity.Updated",
       "MyEntity",
   entityId.ToString(),
        userId,
                before: before,
    after: new { entity.Status, entity.Value }
            );
        }
catch (Exception ex)
        {
      // Log failure
            await _auditService.LogFailureAsync(
          "MyEntity.Updated",
   "MyEntity",
                entityId.ToString(),
    ex.Message,
              userId
  );
          throw;
        }
    }
}
```

### Standard Action Names

Use the `AuditActions` constants for consistency:

```csharp
public static class AuditActions
{
    // Auth
    public const string AuthLogin = "Auth.Login";
    public const string AuthLogout = "Auth.Logout";
    public const string AuthLoginFailed = "Auth.LoginFailed";
    public const string AuthPasswordChanged = "Auth.PasswordChanged";
    public const string AuthRoleChanged = "Auth.RoleChanged";
    
    // Assessment
    public const string ExamCreated = "Exam.Created";
    public const string ExamPublished = "Exam.Published";
    
    // Attempt
    public const string AttemptStarted = "Attempt.Started";
    public const string AttemptSubmitted = "Attempt.Submitted";
    
    // Grading
    public const string GradingCompleted = "Grading.Completed";
    public const string ManualGradeRecorded = "Grading.ManualGrade";
    
    // Result
    public const string ResultPublished = "Result.Published";
    public const string ResultInvalidated = "Result.Invalidated";
    
    // Proctor
    public const string ProctorSessionStarted = "Proctor.SessionStarted";
    public const string ProctorHighRiskTriggered = "Proctor.HighRiskTriggered";
    
    // Incident
    public const string IncidentCreated = "Incident.Created";
    public const string IncidentDecisionMade = "Incident.DecisionMade";
}
```

---

## Retention Policies

### Policy Evaluation Order

1. Policies are evaluated by Priority (lower = higher priority)
2. First matching policy applies
3. Default policy applies if no specific policy matches

### Example Policy Setup

```
Priority 10: Proctor Events ? 90 days, Archive to S3
Priority 20: Incident Logs ? 365 days, Archive to S3
Priority 30: Auth Failures ? 30 days, No archive
Priority 100: Default ? 180 days, Archive to Blob
```

### Retention Job Schedule

```csharp
// Run retention job daily at 2 AM
builder.Services.AddHostedService<AuditRetentionJob>();

public class AuditRetentionJob : BackgroundService
{
  protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // Check if it's 2 AM
  if (DateTime.UtcNow.Hour == 2)
     {
       await _auditService.ExecuteRetentionAsync("System");
         }
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
      }
    }
}
```

---

## Security & Access Control

### Role-Based Access

| Role | Permissions |
|------|-------------|
| Admin | Full access, create/manage policies |
| SuperAdmin | Full access, create/manage policies |
| Auditor | Read-only, create exports |

### Candidate Restrictions

- Candidates have NO access to audit logs
- Audit endpoints are restricted to admin roles

### Data Protection

```csharp
// Mask sensitive data before logging
private object SanitizeUserData(User user)
{
    return new
    {
 user.Id,
        user.Email,
        user.Role,
        // Exclude: Password, SecurityStamp, Tokens
    };
}
```

---

## Performance Considerations

### High-Volume Logging

For high-volume scenarios, consider:

1. **Async Queue**: Write to queue, background worker processes
2. **Batching**: Batch multiple logs into single DB write
3. **Partitioning**: Partition AuditLogs table by month

```csharp
// Example: Queue-based logging
public class QueuedAuditService : IAuditService
{
    private readonly Channel<CreateAuditLogDto> _channel;
    
    public async Task LogAsync(CreateAuditLogDto dto)
    {
        await _channel.Writer.WriteAsync(dto);
// Background worker processes queue
    }
}
```

### Index Strategy

```sql
-- Essential indexes (already created)
IX_AuditLogs_OccurredAt
IX_AuditLogs_EntityName_EntityId
IX_AuditLogs_ActorId_OccurredAt
IX_AuditLogs_CorrelationId

-- Consider partitioning for very large tables
CREATE PARTITION FUNCTION AuditLogDatePF (datetime2)
AS RANGE RIGHT FOR VALUES ('2024-01-01', '2024-02-01', ...);
```

---

## Migration Command

After adding the entities, run:

```bash
dotnet ef migrations add AddAuditModule
dotnet ef database update
```

---

## Testing Checklist

- [ ] Log success action
- [ ] Log failure action
- [ ] Log system action
- [ ] Search logs with filters
- [ ] Get entity history
- [ ] Get user activity
- [ ] Trace by correlation ID
- [ ] Get recent failures
- [ ] Create retention policy
- [ ] Update retention policy
- [ ] Delete retention policy
- [ ] Set default policy
- [ ] Preview retention execution
- [ ] Execute retention
- [ ] Verify archiving (if configured)
- [ ] Create export job
- [ ] Process export (CSV)
- [ ] Process export (JSON)
- [ ] Download export file
- [ ] Cancel pending export
- [ ] Get dashboard statistics
- [ ] Verify role-based access
- [ ] Verify non-blocking logging on errors
- [ ] Verify sensitive data masking
- [ ] Verify correlation ID propagation
