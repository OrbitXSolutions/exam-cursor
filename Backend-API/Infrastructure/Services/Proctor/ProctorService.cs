using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Proctor;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Proctor;
using Smart_Core.Domain.Entities.Proctor;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Proctor;

public class ProctorService : IProctorService
{
    private readonly ApplicationDbContext _context;
    private readonly IMediaStorageService _mediaStorage;
    private const int DefaultHeartbeatIntervalSeconds = 15;
    private const int HeartbeatMissedThresholdSeconds = 45;

    public ProctorService(ApplicationDbContext context, IMediaStorageService mediaStorage)
    {
        _context = context;
        _mediaStorage = mediaStorage;
    }

    #region Session Management

    public async Task<ApiResponse<ProctorSessionCreatedDto>> CreateSessionAsync(
            CreateProctorSessionDto dto, string candidateId, string ipAddress)
    {
        // Validate attempt exists and is in progress
        var attempt = await _context.Attempts
       .Include(a => a.Exam)
         .FirstOrDefaultAsync(a => a.Id == dto.AttemptId);

        if (attempt == null)
        {
            return ApiResponse<ProctorSessionCreatedDto>.FailureResponse("Attempt not found");
        }

        if (attempt.Status != AttemptStatus.InProgress)
        {
            return ApiResponse<ProctorSessionCreatedDto>.FailureResponse(
    $"Cannot start proctoring for attempt with status '{attempt.Status}'");
        }

        if (attempt.CandidateId != candidateId)
        {
            return ApiResponse<ProctorSessionCreatedDto>.FailureResponse("Unauthorized");
        }

        // Check if session already exists for this mode
        var existingSession = await _context.Set<ProctorSession>()
          .FirstOrDefaultAsync(s => s.AttemptId == dto.AttemptId && s.Mode == dto.Mode);

        if (existingSession != null)
        {
            if (existingSession.Status == ProctorSessionStatus.Active)
            {
                return ApiResponse<ProctorSessionCreatedDto>.SuccessResponse(new ProctorSessionCreatedDto
                {
                    ProctorSessionId = existingSession.Id,
                    AttemptId = dto.AttemptId,
                    Mode = dto.Mode,
                    StartedAt = existingSession.StartedAt,
                    HeartbeatIntervalSeconds = DefaultHeartbeatIntervalSeconds,
                    Message = "Existing active session returned"
                });
            }
            return ApiResponse<ProctorSessionCreatedDto>.FailureResponse(
           $"A {dto.Mode} proctor session already exists for this attempt");
        }

        var now = DateTime.UtcNow;

        var session = new ProctorSession
        {
            AttemptId = dto.AttemptId,
            ExamId = attempt.ExamId,
            CandidateId = candidateId,
            Mode = dto.Mode,
            StartedAt = now,
            Status = ProctorSessionStatus.Active,
            DeviceFingerprint = dto.DeviceFingerprint,
            UserAgent = dto.UserAgent,
            IpAddress = ipAddress,
            BrowserName = dto.BrowserName,
            BrowserVersion = dto.BrowserVersion,
            OperatingSystem = dto.OperatingSystem,
            ScreenResolution = dto.ScreenResolution,
            TotalEvents = 0,
            TotalViolations = 0,
            RiskScore = 0,
            LastHeartbeatAt = now,
            CreatedDate = now,
            CreatedBy = candidateId
        };

        _context.Set<ProctorSession>().Add(session);
        await _context.SaveChangesAsync();

        return ApiResponse<ProctorSessionCreatedDto>.SuccessResponse(new ProctorSessionCreatedDto
        {
            ProctorSessionId = session.Id,
            AttemptId = dto.AttemptId,
            Mode = dto.Mode,
            StartedAt = now,
            HeartbeatIntervalSeconds = DefaultHeartbeatIntervalSeconds,
            Message = "Proctor session started successfully"
        });
    }

    public async Task<ApiResponse<ProctorSessionDto>> GetSessionAsync(int sessionId)
    {
        // Handle sample/demo sessions (negative IDs)
        if (sessionId < 0)
        {
            var sample = GetSampleSessionDto(sessionId);
            if (sample != null)
                return ApiResponse<ProctorSessionDto>.SuccessResponse(sample);
            return ApiResponse<ProctorSessionDto>.FailureResponse("Session not found");
        }

        var session = await GetSessionWithIncludesAsync(sessionId);

        if (session == null)
        {
            return ApiResponse<ProctorSessionDto>.FailureResponse("Session not found");
        }

        return ApiResponse<ProctorSessionDto>.SuccessResponse(MapToSessionDto(session));
    }

    public async Task<ApiResponse<ProctorSessionDto>> GetSessionByAttemptAsync(int attemptId, ProctorMode mode)
    {
        var session = await _context.Set<ProctorSession>()
        .Include(s => s.Exam)
   .Include(s => s.Candidate)
       .Include(s => s.Decision)
            .Include(s => s.Events.OrderByDescending(e => e.OccurredAt).Take(10))
        .FirstOrDefaultAsync(s => s.AttemptId == attemptId && s.Mode == mode);

        if (session == null)
        {
            return ApiResponse<ProctorSessionDto>.FailureResponse("Session not found");
        }

        return ApiResponse<ProctorSessionDto>.SuccessResponse(MapToSessionDto(session));
    }

    public async Task<ApiResponse<ProctorSessionDto>> EndSessionAsync(int sessionId, string userId)
    {
        var session = await _context.Set<ProctorSession>()
          .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
        {
            return ApiResponse<ProctorSessionDto>.FailureResponse("Session not found");
        }

        if (session.Status != ProctorSessionStatus.Active)
        {
            return ApiResponse<ProctorSessionDto>.FailureResponse("Session is not active");
        }

        var now = DateTime.UtcNow;
        session.Status = ProctorSessionStatus.Completed;
        session.EndedAt = now;
        session.UpdatedDate = now;
        session.UpdatedBy = userId;

        // Calculate final risk score
        await CalculateRiskScoreInternalAsync(session.Id, userId);

        await _context.SaveChangesAsync();

        return await GetSessionAsync(sessionId);
    }

    public async Task<ApiResponse<bool>> CancelSessionAsync(int sessionId, string adminUserId)
    {
        var session = await _context.Set<ProctorSession>()
         .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
        {
            return ApiResponse<bool>.FailureResponse("Session not found");
        }

        var now = DateTime.UtcNow;
        session.Status = ProctorSessionStatus.Cancelled;
        session.EndedAt = now;
        session.UpdatedDate = now;
        session.UpdatedBy = adminUserId;

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Session cancelled");
    }

    public async Task<ApiResponse<PaginatedResponse<ProctorSessionListDto>>> GetSessionsAsync(
        ProctorSessionSearchDto searchDto)
    {
        var query = _context.Set<ProctorSession>()
       .Include(s => s.Exam)
      .Include(s => s.Candidate)
                  .Include(s => s.Decision)
                  .Include(s => s.EvidenceItems)
                  .AsQueryable();

        query = ApplySessionFilters(query, searchDto);
        query = query.OrderByDescending(s => s.StartedAt);

        var totalCount = await query.CountAsync();
        var activeCount = await query.CountAsync(s => s.Status == ProctorSessionStatus.Active);
        var items = await query
            .Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
  .Take(searchDto.PageSize)
    .ToListAsync();

        var dtoItems = items.Select(MapToSessionListDto).ToList();

        // Sample sessions fallback: if requested and no real active sessions exist
        if (searchDto.IncludeSamples && activeCount == 0)
        {
            var samples = GenerateSampleSessions();
            dtoItems.AddRange(samples);
            totalCount += samples.Count;
        }

        return ApiResponse<PaginatedResponse<ProctorSessionListDto>>.SuccessResponse(
    new PaginatedResponse<ProctorSessionListDto>
    {
        Items = dtoItems,
        PageNumber = searchDto.PageNumber,
        PageSize = searchDto.PageSize,
        TotalCount = totalCount
    });
    }

    public async Task<ApiResponse<PaginatedResponse<ProctorSessionListDto>>> GetExamSessionsAsync(
  int examId, ProctorSessionSearchDto searchDto)
    {
        searchDto.ExamId = examId;
        return await GetSessionsAsync(searchDto);
    }

    #endregion

    #region Events

    public async Task<ApiResponse<ProctorEventDto>> LogEventAsync(LogProctorEventDto dto, string candidateId)
    {
        var session = await _context.Set<ProctorSession>()
      .FirstOrDefaultAsync(s => s.Id == dto.ProctorSessionId);

        if (session == null)
        {
            return ApiResponse<ProctorEventDto>.FailureResponse("Session not found");
        }

        if (session.Status != ProctorSessionStatus.Active)
        {
            return ApiResponse<ProctorEventDto>.FailureResponse("Session is not active");
        }

        if (session.CandidateId != candidateId)
        {
            return ApiResponse<ProctorEventDto>.FailureResponse("Unauthorized");
        }

        var now = DateTime.UtcNow;
        var isViolation = IsViolationEvent(dto.EventType, dto.Severity);

        var proctorEvent = new ProctorEvent
        {
            ProctorSessionId = dto.ProctorSessionId,
            AttemptId = session.AttemptId,
            EventType = dto.EventType,
            Severity = dto.Severity,
            IsViolation = isViolation,
            MetadataJson = dto.MetadataJson,
            ClientTimestamp = dto.ClientTimestamp ?? now,
            OccurredAt = now,
            SequenceNumber = session.TotalEvents + 1,
            CreatedDate = now,
            CreatedBy = candidateId
        };

        _context.Set<ProctorEvent>().Add(proctorEvent);

        // Update session counters
        session.TotalEvents++;
        if (isViolation)
        {
            session.TotalViolations++;
        }

        await _context.SaveChangesAsync();

        return ApiResponse<ProctorEventDto>.SuccessResponse(MapToEventDto(proctorEvent));
    }

    public async Task<ApiResponse<int>> BulkLogEventsAsync(BulkLogProctorEventsDto dto, string candidateId)
    {
        var session = await _context.Set<ProctorSession>()
            .FirstOrDefaultAsync(s => s.Id == dto.ProctorSessionId);

        if (session == null)
        {
            return ApiResponse<int>.FailureResponse("Session not found");
        }

        if (session.Status != ProctorSessionStatus.Active)
        {
            return ApiResponse<int>.FailureResponse("Session is not active");
        }

        if (session.CandidateId != candidateId)
        {
            return ApiResponse<int>.FailureResponse("Unauthorized");
        }

        var now = DateTime.UtcNow;
        var events = new List<ProctorEvent>();
        var sequenceNumber = session.TotalEvents;

        foreach (var eventDto in dto.Events)
        {
            sequenceNumber++;
            var isViolation = IsViolationEvent(eventDto.EventType, eventDto.Severity);

            events.Add(new ProctorEvent
            {
                ProctorSessionId = dto.ProctorSessionId,
                AttemptId = session.AttemptId,
                EventType = eventDto.EventType,
                Severity = eventDto.Severity,
                IsViolation = isViolation,
                MetadataJson = eventDto.MetadataJson,
                ClientTimestamp = eventDto.ClientTimestamp ?? now,
                OccurredAt = now,
                SequenceNumber = sequenceNumber,
                CreatedDate = now,
                CreatedBy = candidateId
            });

            if (isViolation)
            {
                session.TotalViolations++;
            }
        }

        _context.Set<ProctorEvent>().AddRange(events);
        session.TotalEvents = sequenceNumber;

        await _context.SaveChangesAsync();

        return ApiResponse<int>.SuccessResponse(events.Count, $"{events.Count} events logged");
    }

    public async Task<ApiResponse<HeartbeatResponseDto>> ProcessHeartbeatAsync(HeartbeatDto dto, string candidateId)
    {
        var session = await _context.Set<ProctorSession>()
                 .FirstOrDefaultAsync(s => s.Id == dto.ProctorSessionId);

        if (session == null)
        {
            return ApiResponse<HeartbeatResponseDto>.FailureResponse("Session not found");
        }

        if (session.CandidateId != candidateId)
        {
            return ApiResponse<HeartbeatResponseDto>.FailureResponse("Unauthorized");
        }

        var now = DateTime.UtcNow;

        // Log heartbeat event
        var heartbeatEvent = new ProctorEvent
        {
            ProctorSessionId = dto.ProctorSessionId,
            AttemptId = session.AttemptId,
            EventType = ProctorEventType.Heartbeat,
            Severity = 0,
            IsViolation = false,
            MetadataJson = dto.MetadataJson,
            ClientTimestamp = dto.ClientTimestamp ?? now,
            OccurredAt = now,
            SequenceNumber = session.TotalEvents + 1,
            CreatedDate = now,
            CreatedBy = candidateId
        };

        _context.Set<ProctorEvent>().Add(heartbeatEvent);

        session.LastHeartbeatAt = now;
        session.TotalEvents++;

        await _context.SaveChangesAsync();

        // Check if there are warnings to show
        var hasWarning = session.TotalViolations > 5 || (session.RiskScore ?? 0) > 50;
        string? warningMessage = null;
        if (hasWarning)
        {
            warningMessage = session.TotalViolations > 10
              ? "Multiple violations detected. Your exam may be flagged for review."
         : "Please stay focused on your exam.";
        }

        return ApiResponse<HeartbeatResponseDto>.SuccessResponse(new HeartbeatResponseDto
        {
            Success = true,
            ServerTime = now,
            CurrentRiskScore = session.RiskScore,
            TotalViolations = session.TotalViolations,
            HasWarning = hasWarning,
            WarningMessage = warningMessage
        });
    }

    public async Task<ApiResponse<List<ProctorEventDto>>> GetSessionEventsAsync(int sessionId)
    {
        var events = await _context.Set<ProctorEvent>()
     .Where(e => e.ProctorSessionId == sessionId)
            .OrderByDescending(e => e.OccurredAt)
      .ToListAsync();

        return ApiResponse<List<ProctorEventDto>>.SuccessResponse(
        events.Select(MapToEventDto).ToList());
    }

    public async Task<ApiResponse<List<ProctorEventDto>>> GetEventsByTypeAsync(
    int sessionId, ProctorEventType eventType)
    {
        var events = await _context.Set<ProctorEvent>()
     .Where(e => e.ProctorSessionId == sessionId && e.EventType == eventType)
          .OrderByDescending(e => e.OccurredAt)
            .ToListAsync();

        return ApiResponse<List<ProctorEventDto>>.SuccessResponse(
            events.Select(MapToEventDto).ToList());
    }

    #endregion

    #region Risk Management

    public async Task<ApiResponse<RiskCalculationResultDto>> CalculateRiskScoreAsync(
        int sessionId, string calculatedBy)
    {
        return await CalculateRiskScoreInternalAsync(sessionId, calculatedBy);
    }

    private async Task<ApiResponse<RiskCalculationResultDto>> CalculateRiskScoreInternalAsync(
  int sessionId, string calculatedBy)
    {
        var session = await _context.Set<ProctorSession>()
           .Include(s => s.Events)
         .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
        {
            return ApiResponse<RiskCalculationResultDto>.FailureResponse("Session not found");
        }

        var rules = await _context.Set<ProctorRiskRule>()
            .Where(r => r.IsActive)
            .OrderBy(r => r.Priority)
            .ToListAsync();

        var now = DateTime.UtcNow;
        decimal totalRiskPoints = 0;
        var triggeredRules = new List<TriggeredRuleDto>();
        var eventBreakdown = new Dictionary<string, int>();

        // Count events by type
        foreach (var eventGroup in session.Events.GroupBy(e => e.EventType))
        {
            eventBreakdown[eventGroup.Key.ToString()] = eventGroup.Count();
        }

        // Evaluate each rule
        foreach (var rule in rules)
        {
            var relevantEvents = session.Events
                   .Where(e => e.EventType == rule.EventType)
                    .Where(e => !rule.MinSeverity.HasValue || e.Severity >= rule.MinSeverity.Value);

            if (rule.WindowSeconds > 0)
            {
                var windowStart = now.AddSeconds(-rule.WindowSeconds);
                relevantEvents = relevantEvents.Where(e => e.OccurredAt >= windowStart);
            }

            var eventCount = relevantEvents.Count();
            var triggerCount = eventCount / rule.ThresholdCount;

            if (rule.MaxTriggers.HasValue)
            {
                triggerCount = Math.Min(triggerCount, rule.MaxTriggers.Value);
            }

            if (triggerCount > 0)
            {
                var points = triggerCount * rule.RiskPoints;
                totalRiskPoints += points;

                triggeredRules.Add(new TriggeredRuleDto
                {
                    RuleId = rule.Id,
                    RuleName = rule.NameEn,
                    RiskPoints = points,
                    TriggerCount = triggerCount
                });
            }
        }

        // Cap at 100
        var riskScore = Math.Min(totalRiskPoints, 100);

        // Update session
        session.RiskScore = riskScore;
        session.UpdatedDate = now;

        // Create snapshot
        var snapshot = new ProctorRiskSnapshot
        {
            ProctorSessionId = sessionId,
            RiskScore = riskScore,
            TotalEvents = session.TotalEvents,
            TotalViolations = session.TotalViolations,
            EventBreakdownJson = JsonSerializer.Serialize(eventBreakdown),
            TriggeredRulesJson = JsonSerializer.Serialize(triggeredRules),
            CalculatedAt = now,
            CalculatedBy = calculatedBy,
            CreatedDate = now,
            CreatedBy = calculatedBy
        };

        _context.Set<ProctorRiskSnapshot>().Add(snapshot);
        await _context.SaveChangesAsync();

        return ApiResponse<RiskCalculationResultDto>.SuccessResponse(new RiskCalculationResultDto
        {
            ProctorSessionId = sessionId,
            RiskScore = riskScore,
            RiskLevel = GetRiskLevel(riskScore),
            TotalEvents = session.TotalEvents,
            TotalViolations = session.TotalViolations,
            TriggeredRules = triggeredRules,
            EventBreakdown = eventBreakdown,
            CalculatedAt = now
        });
    }

    public async Task<ApiResponse<List<ProctorRiskRuleDto>>> GetRiskRulesAsync(bool activeOnly = true)
    {
        var query = _context.Set<ProctorRiskRule>().AsQueryable();

        if (activeOnly)
        {
            query = query.Where(r => r.IsActive);
        }

        var rules = await query.OrderBy(r => r.Priority).ToListAsync();

        return ApiResponse<List<ProctorRiskRuleDto>>.SuccessResponse(
    rules.Select(MapToRiskRuleDto).ToList());
    }

    public async Task<ApiResponse<ProctorRiskRuleDto>> CreateRiskRuleAsync(
    SaveProctorRiskRuleDto dto, string userId)
    {
        var now = DateTime.UtcNow;

        var rule = new ProctorRiskRule
        {
            NameEn = dto.NameEn,
            NameAr = dto.NameAr,
            DescriptionEn = dto.DescriptionEn,
            DescriptionAr = dto.DescriptionAr,
            IsActive = dto.IsActive,
            EventType = dto.EventType,
            ThresholdCount = dto.ThresholdCount,
            WindowSeconds = dto.WindowSeconds,
            RiskPoints = dto.RiskPoints,
            MinSeverity = dto.MinSeverity,
            MaxTriggers = dto.MaxTriggers,
            Priority = dto.Priority,
            CreatedDate = now,
            CreatedBy = userId
        };

        _context.Set<ProctorRiskRule>().Add(rule);
        await _context.SaveChangesAsync();

        return ApiResponse<ProctorRiskRuleDto>.SuccessResponse(MapToRiskRuleDto(rule));
    }

    public async Task<ApiResponse<ProctorRiskRuleDto>> UpdateRiskRuleAsync(
        int ruleId, SaveProctorRiskRuleDto dto, string userId)
    {
        var rule = await _context.Set<ProctorRiskRule>()
              .FirstOrDefaultAsync(r => r.Id == ruleId);

        if (rule == null)
        {
            return ApiResponse<ProctorRiskRuleDto>.FailureResponse("Rule not found");
        }

        var now = DateTime.UtcNow;

        rule.NameEn = dto.NameEn;
        rule.NameAr = dto.NameAr;
        rule.DescriptionEn = dto.DescriptionEn;
        rule.DescriptionAr = dto.DescriptionAr;
        rule.IsActive = dto.IsActive;
        rule.EventType = dto.EventType;
        rule.ThresholdCount = dto.ThresholdCount;
        rule.WindowSeconds = dto.WindowSeconds;
        rule.RiskPoints = dto.RiskPoints;
        rule.MinSeverity = dto.MinSeverity;
        rule.MaxTriggers = dto.MaxTriggers;
        rule.Priority = dto.Priority;
        rule.UpdatedDate = now;
        rule.UpdatedBy = userId;

        await _context.SaveChangesAsync();

        return ApiResponse<ProctorRiskRuleDto>.SuccessResponse(MapToRiskRuleDto(rule));
    }

    public async Task<ApiResponse<bool>> DeleteRiskRuleAsync(int ruleId, string userId)
    {
        var rule = await _context.Set<ProctorRiskRule>()
   .FirstOrDefaultAsync(r => r.Id == ruleId);

        if (rule == null)
        {
            return ApiResponse<bool>.FailureResponse("Rule not found");
        }

        rule.IsDeleted = true;
        rule.DeletedBy = userId;
        rule.UpdatedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Rule deleted");
    }

    public async Task<ApiResponse<ProctorRiskRuleDto>> ToggleRiskRuleAsync(int ruleId, string userId)
    {
        var rule = await _context.Set<ProctorRiskRule>()
    .FirstOrDefaultAsync(r => r.Id == ruleId);

        if (rule == null)
        {
            return ApiResponse<ProctorRiskRuleDto>.FailureResponse("Rule not found");
        }

        rule.IsActive = !rule.IsActive;
        rule.UpdatedDate = DateTime.UtcNow;
        rule.UpdatedBy = userId;

        await _context.SaveChangesAsync();

        return ApiResponse<ProctorRiskRuleDto>.SuccessResponse(MapToRiskRuleDto(rule));
    }

    #endregion

    #region Evidence

    public async Task<ApiResponse<ProctorEvidenceDto>> UploadSnapshotAsync(int attemptId, IFormFile file, string candidateId)
    {
        var attempt = await _context.Attempts
            .Include(a => a.Exam)
            .FirstOrDefaultAsync(a => a.Id == attemptId);

        if (attempt == null)
            return ApiResponse<ProctorEvidenceDto>.FailureResponse("Attempt not found");
        if (attempt.CandidateId != candidateId)
            return ApiResponse<ProctorEvidenceDto>.FailureResponse("Unauthorized");
        if (attempt.Status != AttemptStatus.Started && attempt.Status != AttemptStatus.InProgress)
            return ApiResponse<ProctorEvidenceDto>.FailureResponse("Attempt is not in progress");

        if (file.Length > 5 * 1024 * 1024) // 5MB max
            return ApiResponse<ProctorEvidenceDto>.FailureResponse("File too large (max 5MB)");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext is not (".jpg" or ".jpeg" or ".png" or ".webp"))
            return ApiResponse<ProctorEvidenceDto>.FailureResponse("Only image files allowed");

        var session = await _context.Set<ProctorSession>()
            .FirstOrDefaultAsync(s => s.AttemptId == attemptId && s.Mode == ProctorMode.Soft);

        if (session == null)
        {
            session = new ProctorSession
            {
                AttemptId = attemptId,
                ExamId = attempt.ExamId,
                CandidateId = candidateId,
                Mode = ProctorMode.Soft,
                StartedAt = DateTime.UtcNow,
                Status = ProctorSessionStatus.Active,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = candidateId
            };
            _context.Set<ProctorSession>().Add(session);
            await _context.SaveChangesAsync();
        }

        var uploadResult = await _mediaStorage.UploadAsync(file, "proctor-snapshots", candidateId);
        if (!uploadResult.Success || uploadResult.File == null)
            return ApiResponse<ProctorEvidenceDto>.FailureResponse(uploadResult.Message ?? "Upload failed");

        var now = DateTime.UtcNow;
        var evidence = new ProctorEvidence
        {
            ProctorSessionId = session.Id,
            AttemptId = attemptId,
            Type = EvidenceType.Image,
            FileName = uploadResult.File.OriginalFileName,
            FilePath = uploadResult.File.Path,
            FileSize = uploadResult.File.SizeInBytes,
            ContentType = uploadResult.File.ContentType,
            StartAt = now,
            IsUploaded = true,
            UploadedAt = now,
            CreatedDate = now,
            CreatedBy = candidateId
        };
        _context.Set<ProctorEvidence>().Add(evidence);
        await _context.SaveChangesAsync();

        return ApiResponse<ProctorEvidenceDto>.SuccessResponse(MapToEvidenceDto(evidence));
    }

    public async Task<ApiResponse<EvidenceUploadResultDto>> RequestEvidenceUploadAsync(
UploadEvidenceDto dto, string candidateId)
    {
        var session = await _context.Set<ProctorSession>()
            .FirstOrDefaultAsync(s => s.Id == dto.ProctorSessionId);

        if (session == null)
        {
            return ApiResponse<EvidenceUploadResultDto>.FailureResponse("Session not found");
        }

        if (session.Status != ProctorSessionStatus.Active)
        {
            return ApiResponse<EvidenceUploadResultDto>.FailureResponse("Session is not active");
        }

        if (session.CandidateId != candidateId)
        {
            return ApiResponse<EvidenceUploadResultDto>.FailureResponse("Unauthorized");
        }

        var now = DateTime.UtcNow;
        var fileName = $"{session.AttemptId}/{dto.Type}/{now:yyyyMMddHHmmss}_{dto.FileName}";
        var filePath = $"/evidence/{fileName}";

        var evidence = new ProctorEvidence
        {
            ProctorSessionId = dto.ProctorSessionId,
            AttemptId = session.AttemptId,
            Type = dto.Type,
            FileName = dto.FileName,
            FilePath = filePath,
            FileSize = 0,
            ContentType = dto.ContentType,
            StartAt = dto.StartAt,
            EndAt = dto.EndAt,
            DurationSeconds = dto.DurationSeconds,
            IsUploaded = false,
            UploadAttempts = 0,
            MetadataJson = dto.MetadataJson,
            ExpiresAt = now.AddDays(90), // 90-day retention
            CreatedDate = now,
            CreatedBy = candidateId
        };

        _context.Set<ProctorEvidence>().Add(evidence);
        await _context.SaveChangesAsync();

        // Generate presigned URL (placeholder - implement with actual storage provider)
        var uploadUrl = $"/api/proctor/evidence/{evidence.Id}/upload";
        var expiresAt = now.AddMinutes(30);

        return ApiResponse<EvidenceUploadResultDto>.SuccessResponse(new EvidenceUploadResultDto
        {
            EvidenceId = evidence.Id,
            UploadUrl = uploadUrl,
            ExpiresAt = expiresAt
        });
    }

    public async Task<ApiResponse<ProctorEvidenceDto>> ConfirmEvidenceUploadAsync(
    int evidenceId, long fileSize, string? checksum)
    {
        var evidence = await _context.Set<ProctorEvidence>()
            .FirstOrDefaultAsync(e => e.Id == evidenceId);

        if (evidence == null)
        {
            return ApiResponse<ProctorEvidenceDto>.FailureResponse("Evidence not found");
        }

        var now = DateTime.UtcNow;

        evidence.IsUploaded = true;
        evidence.UploadedAt = now;
        evidence.FileSize = fileSize;
        evidence.Checksum = checksum;
        evidence.ChecksumAlgorithm = checksum != null ? "SHA256" : null;
        evidence.UpdatedDate = now;

        await _context.SaveChangesAsync();

        return ApiResponse<ProctorEvidenceDto>.SuccessResponse(MapToEvidenceDto(evidence));
    }

    public async Task<ApiResponse<List<ProctorEvidenceDto>>> GetSessionEvidenceAsync(int sessionId)
    {
        var evidence = await _context.Set<ProctorEvidence>()
 .Where(e => e.ProctorSessionId == sessionId && e.IsUploaded)
            .OrderBy(e => e.StartAt ?? e.CreatedDate)
            .ToListAsync();

        return ApiResponse<List<ProctorEvidenceDto>>.SuccessResponse(
        evidence.Select(MapToEvidenceDto).ToList());
    }

    public async Task<ApiResponse<string>> GetEvidenceDownloadUrlAsync(int evidenceId, string userId)
    {
        var evidence = await _context.Set<ProctorEvidence>()
              .FirstOrDefaultAsync(e => e.Id == evidenceId);

        if (evidence == null)
        {
            return ApiResponse<string>.FailureResponse("Evidence not found");
        }

        if (!evidence.IsUploaded)
        {
            return ApiResponse<string>.FailureResponse("Evidence not yet uploaded");
        }

        // Generate secure, time-limited URL (placeholder)
        var downloadUrl = $"/api/proctor/evidence/{evidenceId}/download?token={Guid.NewGuid()}";

        return ApiResponse<string>.SuccessResponse(downloadUrl);
    }

    #endregion

    #region Decisions

    public async Task<ApiResponse<ProctorDecisionDto>> MakeDecisionAsync(
      MakeDecisionDto dto, string reviewerId)
    {
        var session = await _context.Set<ProctorSession>()
   .Include(s => s.Attempt)
            .Include(s => s.Decision)
            .FirstOrDefaultAsync(s => s.Id == dto.ProctorSessionId);

        if (session == null)
        {
            return ApiResponse<ProctorDecisionDto>.FailureResponse("Session not found");
        }

        // Validate attempt is submitted or expired
        if (session.Attempt.Status != AttemptStatus.Submitted &&
 session.Attempt.Status != AttemptStatus.Expired)
        {
            return ApiResponse<ProctorDecisionDto>.FailureResponse(
                   "Decisions can only be made after attempt is submitted or expired");
        }

        var now = DateTime.UtcNow;

        if (session.Decision != null)
        {
            if (session.Decision.IsFinalized)
            {
                return ApiResponse<ProctorDecisionDto>.FailureResponse(
              "Decision is finalized. Use override to change.");
            }

            // Update existing decision
            session.Decision.Status = dto.Status;
            session.Decision.DecisionReasonEn = dto.DecisionReasonEn;
            session.Decision.DecisionReasonAr = dto.DecisionReasonAr;
            session.Decision.InternalNotes = dto.InternalNotes;
            session.Decision.DecidedBy = reviewerId;
            session.Decision.DecidedAt = now;
            session.Decision.IsFinalized = dto.Finalize;
            session.Decision.UpdatedDate = now;
            session.Decision.UpdatedBy = reviewerId;
        }
        else
        {
            // Create new decision
            var decision = new ProctorDecision
            {
                ProctorSessionId = dto.ProctorSessionId,
                AttemptId = session.AttemptId,
                Status = dto.Status,
                DecisionReasonEn = dto.DecisionReasonEn,
                DecisionReasonAr = dto.DecisionReasonAr,
                InternalNotes = dto.InternalNotes,
                DecidedBy = reviewerId,
                DecidedAt = now,
                IsFinalized = dto.Finalize,
                CreatedDate = now,
                CreatedBy = reviewerId
            };

            _context.Set<ProctorDecision>().Add(decision);
        }

        await _context.SaveChangesAsync();

        return await GetDecisionAsync(dto.ProctorSessionId);
    }

    public async Task<ApiResponse<ProctorDecisionDto>> OverrideDecisionAsync(
           OverrideDecisionDto dto, string adminUserId)
    {
        var decision = await _context.Set<ProctorDecision>()
            .FirstOrDefaultAsync(d => d.Id == dto.DecisionId);

        if (decision == null)
        {
            return ApiResponse<ProctorDecisionDto>.FailureResponse("Decision not found");
        }

        var now = DateTime.UtcNow;

        decision.PreviousStatus = decision.Status;
        decision.Status = dto.NewStatus;
        decision.OverriddenBy = adminUserId;
        decision.OverriddenAt = now;
        decision.OverrideReason = dto.OverrideReason;

        if (!string.IsNullOrEmpty(dto.DecisionReasonEn))
        {
            decision.DecisionReasonEn = dto.DecisionReasonEn;
        }
        if (!string.IsNullOrEmpty(dto.DecisionReasonAr))
        {
            decision.DecisionReasonAr = dto.DecisionReasonAr;
        }

        decision.UpdatedDate = now;
        decision.UpdatedBy = adminUserId;

        await _context.SaveChangesAsync();

        return await GetDecisionAsync(decision.ProctorSessionId);
    }

    public async Task<ApiResponse<ProctorDecisionDto>> GetDecisionAsync(int sessionId)
    {
        var decision = await _context.Set<ProctorDecision>()
       .FirstOrDefaultAsync(d => d.ProctorSessionId == sessionId);

        if (decision == null)
        {
            return ApiResponse<ProctorDecisionDto>.FailureResponse("No decision found");
        }

        return ApiResponse<ProctorDecisionDto>.SuccessResponse(MapToDecisionDto(decision));
    }

    public async Task<ApiResponse<PaginatedResponse<ProctorSessionListDto>>> GetPendingReviewAsync(
  ProctorSessionSearchDto searchDto)
    {
        searchDto.RequiresReview = true;
        return await GetSessionsAsync(searchDto);
    }

    #endregion

    #region Dashboard & Monitoring

    public async Task<ApiResponse<ProctorDashboardDto>> GetDashboardAsync(int examId)
    {
        var exam = await _context.Exams.FirstOrDefaultAsync(e => e.Id == examId);
        if (exam == null)
        {
            return ApiResponse<ProctorDashboardDto>.FailureResponse("Exam not found");
        }

        var sessions = await _context.Set<ProctorSession>()
        .Include(s => s.Decision)
            .Include(s => s.Events)
            .Where(s => s.ExamId == examId)
            .ToListAsync();

        var violationCounts = sessions
  .SelectMany(s => s.Events)
    .Where(e => e.IsViolation)
     .GroupBy(e => e.EventType)
  .Select(g => new EventTypeCountDto
  {
      EventType = g.Key,
      Count = g.Count()
  })
            .OrderByDescending(x => x.Count)
      .Take(10)
       .ToList();

        var riskScores = sessions.Where(s => s.RiskScore.HasValue).Select(s => s.RiskScore!.Value).ToList();

        var dashboard = new ProctorDashboardDto
        {
            ExamId = examId,
            ExamTitleEn = exam.TitleEn,
            TotalSessions = sessions.Count,
            ActiveSessions = sessions.Count(s => s.Status == ProctorSessionStatus.Active),
            CompletedSessions = sessions.Count(s => s.Status == ProctorSessionStatus.Completed),
            HighRiskCount = sessions.Count(s => s.RiskScore >= 50),
            PendingReviewCount = sessions.Count(s => s.Decision == null || s.Decision.Status == ProctorDecisionStatus.Pending),
            ClearedCount = sessions.Count(s => s.Decision?.Status == ProctorDecisionStatus.Cleared),
            InvalidatedCount = sessions.Count(s => s.Decision?.Status == ProctorDecisionStatus.Invalidated),
            AverageRiskScore = riskScores.Any() ? riskScores.Average() : 0,
            TopViolations = violationCounts,
            RiskDistribution = CalculateRiskDistribution(sessions)
        };

        return ApiResponse<ProctorDashboardDto>.SuccessResponse(dashboard);
    }

    public async Task<ApiResponse<List<LiveMonitoringDto>>> GetLiveMonitoringAsync(int examId)
    {
        var now = DateTime.UtcNow;
        var offlineThreshold = now.AddSeconds(-HeartbeatMissedThresholdSeconds);

        var activeSessions = await _context.Set<ProctorSession>()
      .Include(s => s.Candidate)
       .Include(s => s.Events.OrderByDescending(e => e.OccurredAt).Take(1))
 .Where(s => s.ExamId == examId && s.Status == ProctorSessionStatus.Active)
            .ToListAsync();

        var monitoring = activeSessions.Select(s => new LiveMonitoringDto
        {
            ProctorSessionId = s.Id,
            AttemptId = s.AttemptId,
            CandidateName = s.Candidate?.FullName ?? s.Candidate?.DisplayName ?? "",
            Status = s.Status,
            RiskScore = s.RiskScore,
            TotalViolations = s.TotalViolations,
            LastHeartbeatAt = s.LastHeartbeatAt,
            IsOnline = s.LastHeartbeatAt >= offlineThreshold,
            LastEvent = s.Events.Any() ? MapToEventDto(s.Events.First()) : null
        }).ToList();

        return ApiResponse<List<LiveMonitoringDto>>.SuccessResponse(monitoring);
    }

    public async Task<int> CheckMissedHeartbeatsAsync(int thresholdSeconds)
    {
        var now = DateTime.UtcNow;
        var threshold = now.AddSeconds(-thresholdSeconds);

        var missedSessions = await _context.Set<ProctorSession>()
                  .Where(s => s.Status == ProctorSessionStatus.Active &&
          s.LastHeartbeatAt < threshold)
                  .ToListAsync();

        foreach (var session in missedSessions)
        {
            session.HeartbeatMissedCount++;

            // Log network disconnected event
            var disconnectEvent = new ProctorEvent
            {
                ProctorSessionId = session.Id,
                AttemptId = session.AttemptId,
                EventType = ProctorEventType.NetworkDisconnected,
                Severity = 3,
                IsViolation = true,
                MetadataJson = JsonSerializer.Serialize(new
                {
                    lastHeartbeat = session.LastHeartbeatAt,
                    missedCount = session.HeartbeatMissedCount
                }),
                ClientTimestamp = now,
                OccurredAt = now,
                SequenceNumber = session.TotalEvents + 1,
                CreatedDate = now,
                CreatedBy = "System"
            };

            _context.Set<ProctorEvent>().Add(disconnectEvent);
            session.TotalEvents++;
            session.TotalViolations++;
        }

        await _context.SaveChangesAsync();

        return missedSessions.Count;
    }

    /// <inheritdoc />
    public async Task<ApiResponse<List<TriageRecommendationDto>>> GetTriageRecommendationsAsync(int top = 5, bool includeSample = true)
    {
        var now = DateTime.UtcNow;
        var windowStart = now.AddMinutes(-5); // recent events window

        // Get active sessions ordered by risk score descending
        var sessions = await _context.Set<ProctorSession>()
            .Where(s => s.Status == ProctorSessionStatus.Active && s.RiskScore > 0)
            .OrderByDescending(s => s.RiskScore)
            .ThenByDescending(s => s.TotalViolations)
            .Take(top)
            .Select(s => new
            {
                s.Id,
                CandidateName = s.Candidate != null ? (s.Candidate.FullName ?? s.Candidate.DisplayName ?? "") : "",
                ExamTitle = s.Exam != null ? s.Exam.TitleEn : "",
                s.RiskScore,
                s.TotalViolations,
                // Count recent events by type (last 5 minutes)
                RecentEvents = s.Events
                    .Where(e => e.OccurredAt >= windowStart)
                    .GroupBy(e => e.EventType)
                    .Select(g => new { EventType = g.Key, Count = g.Count() })
                    .ToList()
            })
            .ToListAsync();

        // Include sample sessions if not enough real data
        var recommendations = new List<TriageRecommendationDto>();

        foreach (var s in sessions)
        {
            var reasons = BuildTriageReasons(s.RecentEvents?.ToDictionary(e => e.EventType, e => e.Count)
                ?? new Dictionary<ProctorEventType, int>(), s.TotalViolations);

            recommendations.Add(new TriageRecommendationDto
            {
                SessionId = s.Id,
                CandidateName = s.CandidateName ?? "",
                ExamTitle = s.ExamTitle ?? "",
                RiskScore = s.RiskScore ?? 0,
                RiskLevel = GetRiskLevel(s.RiskScore ?? 0),
                TotalViolations = s.TotalViolations,
                ReasonEn = reasons.en,
                ReasonAr = reasons.ar
            });
        }

        // If no real sessions and sample flag is on, generate from samples
        if (recommendations.Count == 0 && includeSample)
        {
            recommendations = GenerateSampleTriageRecommendations();
        }

        return ApiResponse<List<TriageRecommendationDto>>.SuccessResponse(recommendations);
    }

    private static (string en, string ar) BuildTriageReasons(
        Dictionary<ProctorEventType, int> recentEvents, int totalViolations)
    {
        var partsEn = new List<string>();
        var partsAr = new List<string>();

        if (recentEvents.TryGetValue(ProctorEventType.MultipleFacesDetected, out var mf) && mf > 0)
        { partsEn.Add($"Multiple faces ({mf})"); partsAr.Add($"وجوه متعددة ({mf})"); }

        if (recentEvents.TryGetValue(ProctorEventType.FaceNotDetected, out var fnd) && fnd > 0)
        { partsEn.Add($"Face not detected ({fnd})"); partsAr.Add($"لم يتم اكتشاف الوجه ({fnd})"); }

        if (recentEvents.TryGetValue(ProctorEventType.TabSwitched, out var ts) && ts > 0)
        { partsEn.Add($"Tab switches ({ts})"); partsAr.Add($"تبديل التبويب ({ts})"); }

        if (recentEvents.TryGetValue(ProctorEventType.CameraBlocked, out var cb) && cb > 0)
        { partsEn.Add($"Camera blocked ({cb})"); partsAr.Add($"الكاميرا محجوبة ({cb})"); }

        if (recentEvents.TryGetValue(ProctorEventType.FullscreenExited, out var fe) && fe > 0)
        { partsEn.Add($"Fullscreen exited ({fe})"); partsAr.Add($"خروج من الشاشة الكاملة ({fe})"); }

        if (recentEvents.TryGetValue(ProctorEventType.CopyAttempt, out var ca) && ca > 0)
        { partsEn.Add($"Copy attempt ({ca})"); partsAr.Add($"محاولة نسخ ({ca})"); }

        if (recentEvents.TryGetValue(ProctorEventType.PasteAttempt, out var pa) && pa > 0)
        { partsEn.Add($"Paste attempt ({pa})"); partsAr.Add($"محاولة لصق ({pa})"); }

        if (recentEvents.TryGetValue(ProctorEventType.DevToolsOpened, out var dt) && dt > 0)
        { partsEn.Add($"DevTools opened ({dt})"); partsAr.Add($"فتح أدوات المطور ({dt})"); }

        if (recentEvents.TryGetValue(ProctorEventType.WindowBlurred, out var wb) && wb > 0)
        { partsEn.Add($"Window blur ({wb})"); partsAr.Add($"فقدان تركيز النافذة ({wb})"); }

        if (recentEvents.TryGetValue(ProctorEventType.FaceOutOfFrame, out var fof) && fof > 0)
        { partsEn.Add($"Face out of frame ({fof})"); partsAr.Add($"الوجه خارج الإطار ({fof})"); }

        if (partsEn.Count == 0)
        {
            partsEn.Add($"Total violations: {totalViolations}");
            partsAr.Add($"إجمالي المخالفات: {totalViolations}");
        }

        return (string.Join(" + ", partsEn), string.Join(" + ", partsAr));
    }

    private static List<TriageRecommendationDto> GenerateSampleTriageRecommendations()
    {
        return new List<TriageRecommendationDto>
        {
            new()
            {
                SessionId = -2,
                CandidateName = "Omar Khalid",
                ExamTitle = "Introduction to Computer Science — Final",
                RiskScore = 68,
                RiskLevel = "High",
                TotalViolations = 8,
                ReasonEn = "Multiple faces (3) + Tab switches (4) + Camera blocked (1)",
                ReasonAr = "وجوه متعددة (3) + تبديل التبويب (4) + الكاميرا محجوبة (1)"
            },
            new()
            {
                SessionId = -3,
                CandidateName = "Ali Mahmoud",
                ExamTitle = "IT Exam App",
                RiskScore = 42,
                RiskLevel = "Medium",
                TotalViolations = 3,
                ReasonEn = "Fullscreen exited (2) + Window blur (1)",
                ReasonAr = "خروج من الشاشة الكاملة (2) + فقدان تركيز النافذة (1)"
            }
        };
    }

    #endregion

    #region Proctor Actions

    public async Task<ApiResponse<bool>> FlagSessionAsync(int sessionId, bool flagged, string proctorUserId)
    {
        // Handle sample/demo sessions
        if (sessionId < 0)
            return ApiResponse<bool>.SuccessResponse(true, flagged ? "Session flagged" : "Session unflagged");

        var session = await _context.Set<ProctorSession>()
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
            return ApiResponse<bool>.FailureResponse("Session not found");

        var now = DateTime.UtcNow;
        session.IsFlagged = flagged;
        session.UpdatedDate = now;
        session.UpdatedBy = proctorUserId;

        // Log the flag/unflag event
        var evt = new ProctorEvent
        {
            ProctorSessionId = sessionId,
            AttemptId = session.AttemptId,
            EventType = flagged ? ProctorEventType.ProctorFlagged : ProctorEventType.ProctorUnflagged,
            Severity = 2,
            IsViolation = false,
            MetadataJson = System.Text.Json.JsonSerializer.Serialize(new { proctorUserId, flagged }),
            ClientTimestamp = now,
            OccurredAt = now,
            SequenceNumber = session.TotalEvents + 1,
            CreatedDate = now,
            CreatedBy = proctorUserId
        };
        _context.Set<ProctorEvent>().Add(evt);
        session.TotalEvents++;

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, flagged ? "Session flagged" : "Session unflagged");
    }

    public async Task<ApiResponse<bool>> SendWarningAsync(int sessionId, string message, string proctorUserId)
    {
        // Handle sample/demo sessions
        if (sessionId < 0)
            return ApiResponse<bool>.SuccessResponse(true, "Warning sent to candidate");

        var session = await _context.Set<ProctorSession>()
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
            return ApiResponse<bool>.FailureResponse("Session not found");

        if (session.Status != ProctorSessionStatus.Active)
            return ApiResponse<bool>.FailureResponse("Session is not active");

        if (string.IsNullOrWhiteSpace(message))
            return ApiResponse<bool>.FailureResponse("Warning message is required");

        var now = DateTime.UtcNow;
        session.PendingWarningMessage = message;
        session.UpdatedDate = now;
        session.UpdatedBy = proctorUserId;

        // Log the warning event
        var evt = new ProctorEvent
        {
            ProctorSessionId = sessionId,
            AttemptId = session.AttemptId,
            EventType = ProctorEventType.ProctorWarning,
            Severity = 3,
            IsViolation = false,
            MetadataJson = System.Text.Json.JsonSerializer.Serialize(new { proctorUserId, message }),
            ClientTimestamp = now,
            OccurredAt = now,
            SequenceNumber = session.TotalEvents + 1,
            CreatedDate = now,
            CreatedBy = proctorUserId
        };
        _context.Set<ProctorEvent>().Add(evt);
        session.TotalEvents++;

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Warning sent to candidate");
    }

    public async Task<ApiResponse<bool>> TerminateSessionAsync(int sessionId, string reason, string proctorUserId)
    {
        // Handle sample/demo sessions
        if (sessionId < 0)
            return ApiResponse<bool>.SuccessResponse(true, "Session terminated");

        var session = await _context.Set<ProctorSession>()
            .Include(s => s.Attempt)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
            return ApiResponse<bool>.FailureResponse("Session not found");

        var now = DateTime.UtcNow;

        // Mark session as cancelled/terminated
        session.Status = ProctorSessionStatus.Cancelled;
        session.EndedAt = now;
        session.IsTerminatedByProctor = true;
        session.TerminationReason = reason;
        session.UpdatedDate = now;
        session.UpdatedBy = proctorUserId;

        // Log the termination event
        var evt = new ProctorEvent
        {
            ProctorSessionId = sessionId,
            AttemptId = session.AttemptId,
            EventType = ProctorEventType.ProctorTerminated,
            Severity = 5,
            IsViolation = true,
            MetadataJson = System.Text.Json.JsonSerializer.Serialize(new { proctorUserId, reason }),
            ClientTimestamp = now,
            OccurredAt = now,
            SequenceNumber = session.TotalEvents + 1,
            CreatedDate = now,
            CreatedBy = proctorUserId
        };
        _context.Set<ProctorEvent>().Add(evt);
        session.TotalEvents++;
        session.TotalViolations++;

        // Force-end the Attempt (same pattern as ExamOperationsService.TerminateAttemptAsync)
        var attempt = session.Attempt;
        if (attempt != null &&
            (attempt.Status == AttemptStatus.InProgress ||
             attempt.Status == AttemptStatus.Started ||
             attempt.Status == AttemptStatus.Paused))
        {
            attempt.Status = AttemptStatus.Terminated;
            attempt.UpdatedDate = now;
            attempt.UpdatedBy = proctorUserId;

            _context.Set<Domain.Entities.Attempt.AttemptEvent>().Add(new Domain.Entities.Attempt.AttemptEvent
            {
                AttemptId = attempt.Id,
                EventType = AttemptEventType.ForceEnded,
                OccurredAt = now,
                MetadataJson = System.Text.Json.JsonSerializer.Serialize(new
                {
                    source = "ProctorTerminate",
                    proctorUserId,
                    reason,
                    proctorSessionId = sessionId
                }),
                CreatedBy = proctorUserId,
                CreatedDate = now
            });
        }

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Session terminated and attempt force-ended");
    }

    public async Task<ApiResponse<CandidateSessionStatusDto>> GetCandidateSessionStatusAsync(int attemptId, string candidateId)
    {
        var session = await _context.Set<ProctorSession>()
            .Where(s => s.AttemptId == attemptId && s.CandidateId == candidateId)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync();

        if (session == null)
        {
            // No proctor session — return safe defaults
            return ApiResponse<CandidateSessionStatusDto>.SuccessResponse(new CandidateSessionStatusDto
            {
                HasWarning = false,
                IsTerminated = false
            });
        }

        var dto = new CandidateSessionStatusDto
        {
            HasWarning = !string.IsNullOrEmpty(session.PendingWarningMessage),
            WarningMessage = session.PendingWarningMessage,
            IsTerminated = session.IsTerminatedByProctor,
            TerminationReason = session.TerminationReason
        };

        // Clear the pending warning after delivery
        if (dto.HasWarning)
        {
            session.PendingWarningMessage = null;
            await _context.SaveChangesAsync();
        }

        return ApiResponse<CandidateSessionStatusDto>.SuccessResponse(dto);
    }

    #endregion

    #region Cleanup

    public async Task<int> CleanupExpiredEvidenceAsync()
    {
        var now = DateTime.UtcNow;

        var expiredEvidence = await _context.Set<ProctorEvidence>()
      .Where(e => e.ExpiresAt < now && !e.IsExpired)
            .ToListAsync();

        foreach (var evidence in expiredEvidence)
        {
            evidence.IsExpired = true;
            evidence.UpdatedDate = now;
            // TODO: Actually delete file from storage
        }

        await _context.SaveChangesAsync();

        return expiredEvidence.Count;
    }

    #endregion

    #region Private Helper Methods

    private async Task<ProctorSession?> GetSessionWithIncludesAsync(int sessionId)
    {
        return await _context.Set<ProctorSession>()
.Include(s => s.Exam)
    .Include(s => s.Candidate)
        .Include(s => s.Decision)
            .Include(s => s.Events.OrderByDescending(e => e.OccurredAt).Take(20))
     .FirstOrDefaultAsync(s => s.Id == sessionId);
    }

    private IQueryable<ProctorSession> ApplySessionFilters(
          IQueryable<ProctorSession> query, ProctorSessionSearchDto searchDto)
    {
        if (searchDto.ExamId.HasValue)
            query = query.Where(s => s.ExamId == searchDto.ExamId.Value);

        if (!string.IsNullOrEmpty(searchDto.CandidateId))
            query = query.Where(s => s.CandidateId == searchDto.CandidateId);

        if (searchDto.Mode.HasValue)
            query = query.Where(s => s.Mode == searchDto.Mode.Value);

        if (searchDto.Status.HasValue)
            query = query.Where(s => s.Status == searchDto.Status.Value);

        if (searchDto.DecisionStatus.HasValue)
            query = query.Where(s => s.Decision != null && s.Decision.Status == searchDto.DecisionStatus.Value);

        if (searchDto.RequiresReview == true)
            query = query.Where(s => s.Decision == null ||
                  s.Decision.Status == ProctorDecisionStatus.Pending);

        if (searchDto.MinRiskScore.HasValue)
            query = query.Where(s => s.RiskScore >= searchDto.MinRiskScore.Value);

        if (searchDto.StartedFrom.HasValue)
            query = query.Where(s => s.StartedAt >= searchDto.StartedFrom.Value);

        if (searchDto.StartedTo.HasValue)
            query = query.Where(s => s.StartedAt <= searchDto.StartedTo.Value);

        return query;
    }

    private bool IsViolationEvent(ProctorEventType eventType, byte severity)
    {
        // Heartbeat is never a violation
        if (eventType == ProctorEventType.Heartbeat)
            return false;

        // High severity events are always violations
        if (severity >= 3)
            return true;

        // Specific event types are violations regardless of severity
        var violationTypes = new[]
           {
     ProctorEventType.TabSwitched,
    ProctorEventType.FullscreenExited,
     ProctorEventType.CopyAttempt,
          ProctorEventType.PasteAttempt,
        ProctorEventType.DevToolsOpened,
            ProctorEventType.FaceNotDetected,
   ProctorEventType.MultipleFacesDetected
        };

        return violationTypes.Contains(eventType);
    }

    /// <summary>
    /// Returns a fake ProctorSessionDto for demo/sample sessions (negative IDs).
    /// </summary>
    private static ProctorSessionDto? GetSampleSessionDto(int sessionId)
    {
        var now = DateTime.UtcNow;
        var samples = new Dictionary<int, ProctorSessionDto>
        {
            [-1] = new()
            {
                Id = -1, AttemptId = -1, ExamId = -1,
                ExamTitleEn = "Introduction to Computer Science \u2014 Final",
                CandidateId = "sample-1", CandidateName = "Sarah Ahmed",
                Mode = ProctorMode.Soft, Status = ProctorSessionStatus.Active,
                StartedAt = now.AddMinutes(-22),
                TotalEvents = 5, TotalViolations = 1,
                RiskScore = 12, IsFlagged = false,
                LastHeartbeatAt = now.AddSeconds(-10),
                HeartbeatMissedCount = 0,
                RecentEvents = new List<ProctorEventDto>()
            },
            [-2] = new()
            {
                Id = -2, AttemptId = -2, ExamId = -1,
                ExamTitleEn = "Introduction to Computer Science \u2014 Final",
                CandidateId = "sample-2", CandidateName = "Omar Khalid",
                Mode = ProctorMode.Soft, Status = ProctorSessionStatus.Active,
                StartedAt = now.AddMinutes(-15),
                TotalEvents = 18, TotalViolations = 8,
                RiskScore = 68, IsFlagged = true,
                LastHeartbeatAt = now.AddSeconds(-5),
                HeartbeatMissedCount = 0,
                RecentEvents = new List<ProctorEventDto>()
            },
            [-3] = new()
            {
                Id = -3, AttemptId = -3, ExamId = -1,
                ExamTitleEn = "IT Exam App",
                CandidateId = "sample-3", CandidateName = "Ali Mahmoud",
                Mode = ProctorMode.Soft, Status = ProctorSessionStatus.Active,
                StartedAt = now.AddMinutes(-10),
                TotalEvents = 10, TotalViolations = 3,
                RiskScore = 42, IsFlagged = false,
                LastHeartbeatAt = now.AddSeconds(-8),
                HeartbeatMissedCount = 0,
                RecentEvents = new List<ProctorEventDto>()
            }
        };
        return samples.GetValueOrDefault(sessionId);
    }

    private static List<ProctorSessionListDto> GenerateSampleSessions()
    {
        var now = DateTime.UtcNow;
        return new List<ProctorSessionListDto>
        {
            new()
            {
                Id = -1,
                AttemptId = -1,
                ExamId = -1,
                ExamTitleEn = "Introduction to Computer Science — Final",
                CandidateId = "sample-1",
                CandidateName = "Sarah Ahmed",
                Mode = ProctorMode.Soft,
                Status = ProctorSessionStatus.Active,
                StartedAt = now.AddMinutes(-22),
                TotalViolations = 1,
                RiskScore = 12,
                RequiresReview = false,
                IsFlagged = false,
                IsSample = true
            },
            new()
            {
                Id = -2,
                AttemptId = -2,
                ExamId = -1,
                ExamTitleEn = "Introduction to Computer Science — Final",
                CandidateId = "sample-2",
                CandidateName = "Omar Khalid",
                Mode = ProctorMode.Soft,
                Status = ProctorSessionStatus.Active,
                StartedAt = now.AddMinutes(-15),
                TotalViolations = 8,
                RiskScore = 68,
                RequiresReview = true,
                IsFlagged = true,
                IsSample = true
            },
            new()
            {
                Id = -3,
                AttemptId = -3,
                ExamId = -1,
                ExamTitleEn = "IT Exam App",
                CandidateId = "sample-3",
                CandidateName = "Ali Mahmoud",
                Mode = ProctorMode.Soft,
                Status = ProctorSessionStatus.Active,
                StartedAt = now.AddMinutes(-10),
                TotalViolations = 3,
                RiskScore = 42,
                RequiresReview = false,
                IsFlagged = false,
                IsSample = true
            }
        };
    }

    private string GetRiskLevel(decimal score) => score switch
    {
        <= 20 => "Low",
        <= 50 => "Medium",
        <= 75 => "High",
        _ => "Critical"
    };

    private List<RiskDistributionDto> CalculateRiskDistribution(List<ProctorSession> sessions)
    {
        var ranges = new[]
        {
        ("0-20 (Low)", 0m, 20m),
            ("21-50 (Medium)", 21m, 50m),
     ("51-75 (High)", 51m, 75m),
       ("76-100 (Critical)", 76m, 100m)
     };

        var total = sessions.Count(s => s.RiskScore.HasValue);

        return ranges.Select(r => new RiskDistributionDto
        {
            Range = r.Item1,
            Count = sessions.Count(s => s.RiskScore >= r.Item2 && s.RiskScore <= r.Item3),
            Percentage = total > 0
                    ? (decimal)sessions.Count(s => s.RiskScore >= r.Item2 && s.RiskScore <= r.Item3) / total * 100
    : 0
        }).ToList();
    }

    private ProctorSessionDto MapToSessionDto(ProctorSession session)
    {
        return new ProctorSessionDto
        {
            Id = session.Id,
            AttemptId = session.AttemptId,
            ExamId = session.ExamId,
            ExamTitleEn = session.Exam?.TitleEn ?? "",
            CandidateId = session.CandidateId,
            CandidateName = session.Candidate?.FullName ?? session.Candidate?.DisplayName ?? "",
            Mode = session.Mode,
            Status = session.Status,
            StartedAt = session.StartedAt,
            EndedAt = session.EndedAt,
            DeviceFingerprint = session.DeviceFingerprint,
            UserAgent = session.UserAgent,
            IpAddress = session.IpAddress,
            BrowserName = session.BrowserName,
            OperatingSystem = session.OperatingSystem,
            TotalEvents = session.TotalEvents,
            TotalViolations = session.TotalViolations,
            RiskScore = session.RiskScore,
            LastHeartbeatAt = session.LastHeartbeatAt,
            HeartbeatMissedCount = session.HeartbeatMissedCount,
            IsFlagged = session.IsFlagged,
            Decision = session.Decision != null ? MapToDecisionDto(session.Decision) : null,
            RecentEvents = session.Events.Select(MapToEventDto).ToList()
        };
    }

    private ProctorSessionListDto MapToSessionListDto(ProctorSession session)
    {
        // Get latest uploaded image evidence for thumbnail
        var imageEvidence = session.EvidenceItems?
            .Where(e => e.IsUploaded && e.Type == EvidenceType.Image)
            .OrderByDescending(e => e.UploadedAt ?? e.CreatedDate)
            .ToList();
        var latest = imageEvidence?.FirstOrDefault();
        var latestUrl = latest != null && !string.IsNullOrWhiteSpace(latest.FilePath)
            ? $"/media/{latest.FilePath.TrimStart('/')}"
            : null;

        return new ProctorSessionListDto
        {
            Id = session.Id,
            AttemptId = session.AttemptId,
            ExamId = session.ExamId,
            ExamTitleEn = session.Exam?.TitleEn ?? "",
            CandidateId = session.CandidateId,
            CandidateName = session.Candidate?.FullName ?? session.Candidate?.DisplayName ?? "",
            Mode = session.Mode,
            Status = session.Status,
            StartedAt = session.StartedAt,
            TotalViolations = session.TotalViolations,
            RiskScore = session.RiskScore,
            DecisionStatus = session.Decision?.Status,
            RequiresReview = session.Decision == null || session.Decision.Status == ProctorDecisionStatus.Pending,
            IsFlagged = session.IsFlagged,
            IsTerminatedByProctor = session.IsTerminatedByProctor,
            TerminationReason = session.TerminationReason,
            LatestSnapshotUrl = latestUrl,
            SnapshotCount = imageEvidence?.Count ?? 0,
            LastSnapshotAt = latest?.UploadedAt ?? latest?.CreatedDate
        };
    }

    private ProctorEventDto MapToEventDto(ProctorEvent e)
    {
        return new ProctorEventDto
        {
            Id = e.Id,
            ProctorSessionId = e.ProctorSessionId,
            EventType = e.EventType,
            Severity = e.Severity,
            IsViolation = e.IsViolation,
            MetadataJson = e.MetadataJson,
            OccurredAt = e.OccurredAt,
            SequenceNumber = e.SequenceNumber
        };
    }

    private ProctorRiskRuleDto MapToRiskRuleDto(ProctorRiskRule rule)
    {
        return new ProctorRiskRuleDto
        {
            Id = rule.Id,
            NameEn = rule.NameEn,
            NameAr = rule.NameAr,
            DescriptionEn = rule.DescriptionEn,
            DescriptionAr = rule.DescriptionAr,
            IsActive = rule.IsActive,
            EventType = rule.EventType,
            ThresholdCount = rule.ThresholdCount,
            WindowSeconds = rule.WindowSeconds,
            RiskPoints = rule.RiskPoints,
            MinSeverity = rule.MinSeverity,
            MaxTriggers = rule.MaxTriggers,
            Priority = rule.Priority
        };
    }

    private ProctorEvidenceDto MapToEvidenceDto(ProctorEvidence evidence)
    {
        var previewUrl = !string.IsNullOrWhiteSpace(evidence.FilePath)
            ? $"/media/{evidence.FilePath.TrimStart('/')}"
            : null;
        var downloadUrl = evidence.IsUploaded
            ? previewUrl ?? $"/api/proctor/evidence/{evidence.Id}/download"
            : null;

        return new ProctorEvidenceDto
        {
            Id = evidence.Id,
            ProctorSessionId = evidence.ProctorSessionId,
            AttemptId = evidence.AttemptId,
            Type = evidence.Type,
            FileName = evidence.FileName,
            FileSize = evidence.FileSize,
            ContentType = evidence.ContentType,
            StartAt = evidence.StartAt,
            EndAt = evidence.EndAt,
            DurationSeconds = evidence.DurationSeconds,
            IsUploaded = evidence.IsUploaded,
            UploadedAt = evidence.UploadedAt,
            PreviewUrl = previewUrl,
            DownloadUrl = downloadUrl
        };
    }

    private ProctorDecisionDto MapToDecisionDto(ProctorDecision decision)
    {
        return new ProctorDecisionDto
        {
            Id = decision.Id,
            ProctorSessionId = decision.ProctorSessionId,
            AttemptId = decision.AttemptId,
            Status = decision.Status,
            DecisionReasonEn = decision.DecisionReasonEn,
            DecisionReasonAr = decision.DecisionReasonAr,
            DecidedBy = decision.DecidedBy,
            DecidedAt = decision.DecidedAt,
            IsFinalized = decision.IsFinalized,
            PreviousStatus = decision.PreviousStatus
        };
    }

    #endregion
}
