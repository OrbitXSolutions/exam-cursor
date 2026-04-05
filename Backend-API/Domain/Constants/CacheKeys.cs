namespace Smart_Core.Domain.Constants;

/// <summary>
/// Centralized cache key constants and prefix builders.
/// Each prefix ends with ':' for consistent key composition.
/// </summary>
public static class CacheKeys
{
    // ── TTL Defaults ──────────────────────────────────────────
    public static readonly TimeSpan Short = TimeSpan.FromMinutes(2);
    public static readonly TimeSpan Medium = TimeSpan.FromMinutes(5);
    public static readonly TimeSpan Long = TimeSpan.FromMinutes(10);
    public static readonly TimeSpan Thirty = TimeSpan.FromMinutes(30);
    public static readonly TimeSpan VeryLong = TimeSpan.FromHours(5);

    // ── Department ────────────────────────────────────────────
    public const string DepartmentsAll = "departments:all";
    public const string DepartmentsAllInactive = "departments:all_inactive";
    public static string DepartmentById(int id) => $"departments:{id}";
    public static string DepartmentUsers(int id) => $"departments:{id}:users";
    public const string DepartmentsPrefix = "departments:";

    // ── Users ─────────────────────────────────────────────────
    public static string UserDepartmentId(string userId) => $"users:{userId}:dept";
    public const string UsersPrefix = "users:";

    // ── Roles ─────────────────────────────────────────────────
    public const string RolesAll = "roles:all";
    public static string RoleById(string id) => $"roles:{id}";
    public static string UsersInRole(string roleName) => $"roles:users:{roleName}";
    public const string RolesPrefix = "roles:";

    // ── Lookups: Subjects ─────────────────────────────────────
    public const string SubjectsPrefix = "subjects:";

    // ── Lookups: Topics ───────────────────────────────────────
    public const string TopicsPrefix = "topics:";

    // ── Lookups: Categories ───────────────────────────────────
    public const string CategoriesPrefix = "categories:";

    // ── Lookups: QuestionTypes ─────────────────────────────────
    public const string QuestionTypesPrefix = "questiontypes:";

    // ── Questions ─────────────────────────────────────────────
    public const string QuestionsPrefix = "questions:";

    // ── Exams ─────────────────────────────────────────────────
    public const string ExamsPrefix = "exams:";
    public const string ExamsDropdown = "exams:dropdown";
    public static string ExamById(int id) => $"exams:{id}";
    public static string ExamSectionsByExam(int examId) => $"exams:{examId}:sections";
    public static string ExamSectionById(int sectionId) => $"exams:sections:{sectionId}";
    public static string ExamSectionQuestions(int sectionId) => $"exams:sections:{sectionId}:questions";
    public static string ExamDropdownByDept(int? deptId) => $"exams:dropdown:{(deptId.HasValue ? deptId.Value.ToString() : "all")}";

    // ── Candidates ────────────────────────────────────────────
    public const string CandidatesPrefix = "candidates:";
    public static string CandidateDashboard(string userId) => $"candidates:{userId}:dashboard";
    public static string CandidateAvailableExams(string userId) => $"candidates:{userId}:available";

    // ── Batches ───────────────────────────────────────────────
    public const string BatchesPrefix = "batches:";

    // ── Results ────────────────────────────────────────────────
    public const string ResultsPrefix = "results:";
    public static string ResultById(int id) => $"results:{id}";
    public static string ResultByAttempt(int attemptId) => $"results:attempt:{attemptId}";
    public static string CandidateResultAll(string candidateId) => $"results:candidate:{candidateId}:all";
    public static string CandidateResultByAttempt(string candidateId, int attemptId) => $"results:candidate:{candidateId}:attempt:{attemptId}";
    public static string ResultsList(string deptScope, string filterJson) => $"results:list:{deptScope}:{filterJson}";
    public static string ResultsCandidateExamSummary(int examId, string candidateId) => $"results:summary:{examId}:{candidateId}";
    public static string ResultsSummaries(string examScope, int page, int size) => $"results:summaries:{examScope}:{page}:{size}";
    public static string ResultsReport(int examId) => $"results:report:{examId}";
    public static string ResultsQuestionPerf(int examId) => $"results:qperf:{examId}";
    public static string ResultsDashboard(int examId) => $"results:dashboard:{examId}";
    public static string ResultsCandidateList(string examScope, string deptScope, int page, int size, string statusKey) => $"results:clist:{examScope}:{deptScope}:{page}:{size}:{statusKey}";

    // ── Grading ────────────────────────────────────────────────
    public const string GradingPrefix = "grading:";
    public static string GradingSessionById(int id) => $"grading:session:{id}";
    public static string GradingSessionByAttempt(int attemptId) => $"grading:session:attempt:{attemptId}";
    public static string GradingQueueById(int gradingSessionId) => $"grading:queue:{gradingSessionId}";
    public static string GradingStats(int examId) => $"grading:stats:{examId}";
    public static string GradingQuestionStats(int examId) => $"grading:qstats:{examId}";
    public static string GradingList(string deptScope, string filterJson) => $"grading:list:{deptScope}:{filterJson}";
    public static string GradingIsComplete(int attemptId) => $"grading:complete:{attemptId}";
    public static string GradingCandidateResult(int attemptId) => $"grading:candidate-result:{attemptId}";

    // ── ExamAssignment ────────────────────────────────────────
    public const string ExamAssignmentPrefix = "exam-assignments:";
    public static string ExamAssignmentCandidates(int examId, string filterJson) => $"exam-assignments:{examId}:{filterJson}";

    // ── ExamOperations ─────────────────────────────────────────
    public const string ExamOpsPrefix = "exam-ops:";
    public static string ExamOpsCandidates(int? examId, string filterJson) => $"exam-ops:{(examId.HasValue ? examId.Value.ToString() : "0")}:{filterJson}";

    // ── Attempts ──────────────────────────────────────────────
    public const string AttemptsPrefix = "attempts:";
    public static string AttemptById(int id) => $"attempts:{id}";
    public static string AttemptDetailById(int id) => $"attempts:detail:{id}";
    public static string AttemptsList(string filterJson) => $"attempts:list:{filterJson}";
    public static string AttemptsByExamCandidate(int examId, string candidateId) => $"attempts:exam:{examId}:candidate:{candidateId}";

    // ── Incidents ─────────────────────────────────────────────
    public const string IncidentsPrefix = "incidents:";
    public static string IncidentCaseById(int id) => $"incidents:case:{id}";
    public static string IncidentCaseByAttempt(int attemptId) => $"incidents:attempt:{attemptId}";
    public static string IncidentCasesList(string filterJson) => $"incidents:list:{filterJson}";
    public static string IncidentEvidence(int caseId) => $"incidents:evidence:{caseId}";
    public static string IncidentDecisions(int caseId) => $"incidents:decisions:{caseId}";
    public static string IncidentComments(int caseId) => $"incidents:comments:{caseId}";

    // ── Certificates ──────────────────────────────────────────
    public const string CertificatesPrefix = "certs:";
    public static string CertificateById(int id) => $"certs:{id}";
    public static string CertificateByResult(int resultId) => $"certs:result:{resultId}";
    public static string CertificateByCode(string code) => $"certs:code:{code}";
    public static string CertificatesByCandidate(string candidateId) => $"certs:candidate:{candidateId}";

    // ── ExamShare ─────────────────────────────────────────────
    public const string ExamSharePrefix = "share:";
    public static string ShareLinkByExam(int examId) => $"share:exam:{examId}";
    public static string ShareByToken(string token) => $"share:token:{token}";

    // ── Audit Retention Policies ──────────────────────────────
    public const string AuditPoliciesPrefix = "audit:policies:";
    public const string AuditPoliciesAll = "audit:policies:all";
    public static string AuditPolicyById(int id) => $"audit:policies:{id}";

    // ── CandidateExamDetails ──────────────────────────────────
    public const string CandidateExamDetailsPrefix = "ced:";
    public static string CandidateExamDetails(string candidateId, int examId, int? attemptId) => $"ced:{candidateId}:{examId}:{attemptId ?? 0}";
    public static string CandidateExamsList(string candidateId) => $"ced:list:{candidateId}";
}
