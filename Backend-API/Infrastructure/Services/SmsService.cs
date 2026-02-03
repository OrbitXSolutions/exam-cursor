using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Smart_Core.Application.Interfaces;

namespace Smart_Core.Infrastructure.Services;

public class SmsService : ISmsService
{
  private readonly IConfiguration _configuration;
    private readonly ILogger<SmsService> _logger;

 public SmsService(IConfiguration configuration, ILogger<SmsService> logger)
    {
        _configuration = configuration;
  _logger = logger;
 }

    public async Task<bool> SendSmsAsync(string phoneNumber, string message)
    {
        try
   {
// TODO: Integrate with actual SMS provider (Twilio, Azure Communication Services, etc.)
       // This is a placeholder implementation
          
       var smsSettings = _configuration.GetSection("SmsSettings");
            var provider = smsSettings["Provider"];

            _logger.LogInformation("SMS would be sent to {PhoneNumber}: {Message}", phoneNumber, message);
    
  // Simulate async operation
        await Task.Delay(100);
        
    return true;
     }
     catch (Exception ex)
        {
      _logger.LogError(ex, "Failed to send SMS to {PhoneNumber}", phoneNumber);
   return false;
        }
    }

    public async Task<bool> SendVerificationCodeAsync(string phoneNumber, string code)
    {
        var message = $"Your verification code is: {code}. This code will expire in 10 minutes.";
        return await SendSmsAsync(phoneNumber, message);
    }

    public async Task<bool> SendBulkSmsAsync(List<string> phoneNumbers, string message)
    {
        var results = new List<bool>();
        
        foreach (var phoneNumber in phoneNumbers)
        {
          var result = await SendSmsAsync(phoneNumber, message);
results.Add(result);
   }

        return results.All(r => r);
    }
}
