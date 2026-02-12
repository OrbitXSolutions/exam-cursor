using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Entities.Attempt;
using Smart_Core.Domain.Entities.Grading;
using Smart_Core.Domain.Entities.ExamResult;
using Smart_Core.Domain.Entities.Proctor;
using Smart_Core.Domain.Entities.Incident;
using Smart_Core.Domain.Entities.Audit;
using Smart_Core.Domain.Entities.Lookups;
using Smart_Core.Domain.Entities.QuestionBank;
using Smart_Core.Domain.Entities.Batch;

namespace Smart_Core.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Core Entities
    public DbSet<Department> Departments { get; set; } = null!;
    public DbSet<MediaFile> MediaFiles { get; set; } = null!;

    // Lookups
    public DbSet<QuestionCategory> QuestionCategories { get; set; } = null!;
    public DbSet<QuestionType> QuestionTypes { get; set; } = null!;
    public DbSet<QuestionSubject> QuestionSubjects { get; set; } = null!;
    public DbSet<QuestionTopic> QuestionTopics { get; set; } = null!;

    // QuestionBank
    public DbSet<Question> Questions { get; set; } = null!;
    public DbSet<QuestionOption> QuestionOptions { get; set; } = null!;
    public DbSet<QuestionAttachment> QuestionAttachments { get; set; } = null!;
    public DbSet<QuestionAnswerKey> QuestionAnswerKeys { get; set; } = null!;

    // Assessment
    public DbSet<Exam> Exams { get; set; } = null!;
    public DbSet<ExamSection> ExamSections { get; set; } = null!;
    public DbSet<ExamTopic> ExamTopics { get; set; } = null!;
    public DbSet<ExamQuestion> ExamQuestions { get; set; } = null!;
    public DbSet<ExamAccessPolicy> ExamAccessPolicies { get; set; } = null!;
    public DbSet<ExamInstruction> ExamInstructions { get; set; } = null!;

    // Attempt
    public DbSet<Domain.Entities.Attempt.Attempt> Attempts { get; set; } = null!;
    public DbSet<AttemptQuestion> AttemptQuestions { get; set; } = null!;
    public DbSet<AttemptAnswer> AttemptAnswers { get; set; } = null!;
    public DbSet<AttemptEvent> AttemptEvents { get; set; } = null!;

    // Grading
    public DbSet<GradingSession> GradingSessions { get; set; } = null!;
    public DbSet<GradedAnswer> GradedAnswers { get; set; } = null!;

    // ExamResult
    public DbSet<Result> Results { get; set; } = null!;
    public DbSet<ExamReport> ExamReports { get; set; } = null!;
    public DbSet<QuestionPerformanceReport> QuestionPerformanceReports { get; set; } = null!;
    public DbSet<CandidateExamSummary> CandidateExamSummaries { get; set; } = null!;
    public DbSet<ResultExportJob> ResultExportJobs { get; set; } = null!;
    public DbSet<Certificate> Certificates { get; set; } = null!;

    // Proctor
    public DbSet<ProctorSession> ProctorSessions { get; set; } = null!;
    public DbSet<ProctorEvent> ProctorEvents { get; set; } = null!;
    public DbSet<ProctorRiskRule> ProctorRiskRules { get; set; } = null!;
    public DbSet<ProctorRiskSnapshot> ProctorRiskSnapshots { get; set; } = null!;
    public DbSet<ProctorEvidence> ProctorEvidence { get; set; } = null!;
    public DbSet<ProctorDecision> ProctorDecisions { get; set; } = null!;

    // Incident
    public DbSet<IncidentCase> IncidentCases { get; set; } = null!;
    public DbSet<IncidentTimelineEvent> IncidentTimelineEvents { get; set; } = null!;
    public DbSet<IncidentEvidenceLink> IncidentEvidenceLinks { get; set; } = null!;
    public DbSet<IncidentDecisionHistory> IncidentDecisionHistory { get; set; } = null!;
    public DbSet<IncidentComment> IncidentComments { get; set; } = null!;
    public DbSet<AppealRequest> AppealRequests { get; set; } = null!;

    // Audit
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;
    public DbSet<AuditRetentionPolicy> AuditRetentionPolicies { get; set; } = null!;
    public DbSet<AuditExportJob> AuditExportJobs { get; set; } = null!;

    // Settings (global + brand)
    public DbSet<SystemSettings> SystemSettings { get; set; } = null!;

    // Batch
    public DbSet<Batch> Batches { get; set; } = null!;
    public DbSet<BatchCandidate> BatchCandidates { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Apply all configurations from the current assembly
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Auto-update timestamps for entities
        foreach (var entry in ChangeTracker.Entries<ApplicationUser>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedDate = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedDate = DateTime.UtcNow;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
