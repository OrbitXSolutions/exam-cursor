using System.Net;
using System.Net.Mail;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Smart_Core.Application.Interfaces;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly ApplicationDbContext _db;
    private readonly IEncryptionService _encryption;

    public EmailService(
        IConfiguration configuration,
        ILogger<EmailService> logger,
        ApplicationDbContext db,
        IEncryptionService encryption)
    {
        _configuration = configuration;
        _logger = logger;
        _db = db;
        _encryption = encryption;
    }

    private async Task<(string Host, int Port, string Username, string Password, string FromEmail, string FromName, bool EnableSsl)> GetSmtpConfigAsync()
    {
        // Try DB first
        var dbSettings = await _db.NotificationSettings.FirstOrDefaultAsync();
        if (dbSettings != null && !string.IsNullOrWhiteSpace(dbSettings.SmtpHost))
        {
            var password = string.IsNullOrWhiteSpace(dbSettings.SmtpPasswordEncrypted)
                ? string.Empty
                : _encryption.Decrypt(dbSettings.SmtpPasswordEncrypted);

            return (
                dbSettings.SmtpHost,
                dbSettings.SmtpPort,
                dbSettings.SmtpUsername,
                password,
                dbSettings.SmtpFromEmail,
                dbSettings.SmtpFromName,
                dbSettings.SmtpEnableSsl
            );
        }

        // Fallback to appsettings
        var smtpSettings = _configuration.GetSection("SmtpSettings");
        return (
            smtpSettings["Host"] ?? "smtp.gmail.com",
            int.Parse(smtpSettings["Port"] ?? "587"),
            smtpSettings["Username"] ?? "",
            smtpSettings["Password"] ?? "",
            smtpSettings["FromEmail"] ?? "noreply@smartcore.com",
            smtpSettings["FromName"] ?? "Smart Core",
            bool.Parse(smtpSettings["EnableSsl"] ?? "true")
        );
    }

    public async Task<bool> SendEmailAsync(string to, string subject, string body, bool isHtml = true)
    {
        return await SendEmailAsync(new List<string> { to }, subject, body, isHtml);
    }

    public async Task<(bool Success, string? Error)> SendEmailWithDetailAsync(string to, string subject, string body, bool isHtml = true)
    {
        try
        {
            var config = await GetSmtpConfigAsync();

            using var client = new SmtpClient(config.Host, config.Port);
            client.UseDefaultCredentials = false;
            client.Credentials = new NetworkCredential(config.Username, config.Password);
            client.EnableSsl = config.EnableSsl;
            client.DeliveryMethod = SmtpDeliveryMethod.Network;

            using var message = new MailMessage
            {
                From = new MailAddress(config.FromEmail, config.FromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = isHtml
            };
            message.To.Add(to);

            await client.SendMailAsync(message);
            _logger.LogInformation("Test email sent successfully to {Recipient}", to);
            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send test email to {Recipient}", to);
            return (false, ex.Message);
        }
    }

    public async Task<bool> SendEmailAsync(List<string> to, string subject, string body, bool isHtml = true)
    {
        try
        {
            var config = await GetSmtpConfigAsync();

            using var client = new SmtpClient(config.Host, config.Port);
            client.UseDefaultCredentials = false;
            client.Credentials = new NetworkCredential(config.Username, config.Password);
            client.EnableSsl = config.EnableSsl;
            client.DeliveryMethod = SmtpDeliveryMethod.Network;

            using var message = new MailMessage
            {
                From = new MailAddress(config.FromEmail, config.FromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = isHtml
            };

            foreach (var recipient in to)
            {
                message.To.Add(recipient);
            }

            await client.SendMailAsync(message);
            _logger.LogInformation("Email sent successfully to {Recipients}", string.Join(", ", to));
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Recipients}", string.Join(", ", to));
            return false;
        }
    }

    public async Task<bool> SendPasswordResetEmailAsync(string to, string resetLink)
    {
        var subject = "Reset Your Password";
        var body = $@"
         <html>
            <body>
            <h2>Password Reset Request</h2>
     <p>You have requested to reset your password. Click the link below to reset it:</p>
            <p><a href='{resetLink}'>Reset Password</a></p>
       <p>If you did not request this, please ignore this email.</p>
  <p>This link will expire in 24 hours.</p>
 </body>
   </html>";

        return await SendEmailAsync(to, subject, body);
    }

    public async Task<bool> SendEmailConfirmationAsync(string to, string confirmationLink)
    {
        var subject = "Confirm Your Email";
        var body = $@"
      <html>
       <body>
       <h2>Email Confirmation</h2>
    <p>Thank you for registering. Please confirm your email by clicking the link below:</p>
      <p><a href='{confirmationLink}'>Confirm Email</a></p>
        <p>If you did not create an account, please ignore this email.</p>
</body>
            </html>";

        return await SendEmailAsync(to, subject, body);
    }

    public async Task<bool> SendWelcomeEmailAsync(string to, string displayName)
    {
        var subject = "Welcome to Smart Core";
        var body = $@"
            <html>
      <body>
         <h2>Welcome, {displayName}!</h2>
            <p>Thank you for joining Smart Core. We're excited to have you on board.</p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
     </body>
            </html>";

        return await SendEmailAsync(to, subject, body);
    }
}
