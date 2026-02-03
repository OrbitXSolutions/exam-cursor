namespace Smart_Core.Application.Interfaces;

public interface ISmsService
{
    Task<bool> SendSmsAsync(string phoneNumber, string message);
    Task<bool> SendVerificationCodeAsync(string phoneNumber, string code);
    Task<bool> SendBulkSmsAsync(List<string> phoneNumbers, string message);
}
