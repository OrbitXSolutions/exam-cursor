namespace Smart_Core.Application.Interfaces;

public interface IEmailService
{
    Task<bool> SendEmailAsync(string to, string subject, string body, bool isHtml = true);
    Task<bool> SendEmailAsync(List<string> to, string subject, string body, bool isHtml = true);
  Task<bool> SendPasswordResetEmailAsync(string to, string resetLink);
    Task<bool> SendEmailConfirmationAsync(string to, string confirmationLink);
    Task<bool> SendWelcomeEmailAsync(string to, string displayName);
}
