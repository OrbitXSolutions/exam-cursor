namespace Smart_Core.Domain.Constants;

public static class AppRoles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string Admin = "Admin";
    public const string Instructor = "Instructor";
    public const string Candidate = "Candidate";
    public const string Examiner = "Examiner";
    public const string Proctor = "Proctor";

    public static readonly string[] AllRoles = { SuperAdmin, Admin, Instructor, Candidate, Examiner, Proctor };
}

public static class ProtectedUsers
{
    public const string SuperAdminEmail = "super-admin@smartexam.local";
}
