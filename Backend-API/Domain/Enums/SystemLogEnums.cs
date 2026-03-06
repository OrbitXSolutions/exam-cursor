namespace Smart_Core.Domain.Enums;

public enum LogCategory : byte
{
    Candidate = 1,
    Proctor = 2,
    User = 3,
    Developer = 4
}

public enum SystemLogLevel : byte
{
    Info = 1,
    Warning = 2,
    Error = 3,
    Critical = 4
}
