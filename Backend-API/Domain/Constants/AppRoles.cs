namespace Smart_Core.Domain.Constants;

public static class AppRoles
{
    public const string SuperDev = "SuperDev";
    public const string Admin = "Admin";
    public const string Instructor = "Instructor";
    public const string Candidate = "Candidate";
    public const string Examiner = "Examiner";
    public const string Proctor = "Proctor";
    
    public static readonly string[] AllRoles = { SuperDev, Admin, Instructor, Candidate, Examiner, Proctor };
}

public static class ProtectedUsers
{
    public const string SuperDevEmail = "Rowyda15@gmail.com";
}
