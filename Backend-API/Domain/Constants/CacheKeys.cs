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

    // ── Candidates ────────────────────────────────────────────
    public const string CandidatesPrefix = "candidates:";
    public static string CandidateDashboard(string userId) => $"candidates:{userId}:dashboard";
    public static string CandidateAvailableExams(string userId) => $"candidates:{userId}:available";
}
