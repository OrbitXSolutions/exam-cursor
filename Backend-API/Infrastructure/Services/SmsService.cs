using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services;

public class SmsService : ISmsService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmsService> _logger;
    private readonly ApplicationDbContext _db;
    private readonly IEncryptionService _encryption;
    private readonly IHttpClientFactory _httpClientFactory;

    public SmsService(
        IConfiguration configuration,
        ILogger<SmsService> logger,
        ApplicationDbContext db,
        IEncryptionService encryption,
        IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _logger = logger;
        _db = db;
        _encryption = encryption;
        _httpClientFactory = httpClientFactory;
    }

    private async Task<(SmsProvider Provider, string AccountSid, string AuthToken, string FromNumber, string? CustomApiUrl, string? CustomApiKey)?> GetSmsConfigAsync()
    {
        var dbSettings = await _db.NotificationSettings.FirstOrDefaultAsync();
        if (dbSettings != null && dbSettings.EnableSms && !string.IsNullOrWhiteSpace(dbSettings.SmsAccountSid))
        {
            var authToken = string.IsNullOrWhiteSpace(dbSettings.SmsAuthTokenEncrypted)
                ? string.Empty
                : _encryption.Decrypt(dbSettings.SmsAuthTokenEncrypted);

            return (
                dbSettings.SmsProvider,
                dbSettings.SmsAccountSid,
                authToken,
                dbSettings.SmsFromNumber,
                dbSettings.CustomSmsApiUrl,
                dbSettings.CustomSmsApiKey
            );
        }

        // Fallback to appsettings
        var smsSettings = _configuration.GetSection("SmsSettings");
        var accountSid = smsSettings["AccountSid"];
        if (string.IsNullOrWhiteSpace(accountSid))
            return null;

        return (
            SmsProvider.Twilio,
            accountSid,
            smsSettings["AuthToken"] ?? "",
            smsSettings["FromNumber"] ?? "",
            null,
            null
        );
    }

    public async Task<bool> SendSmsAsync(string phoneNumber, string message)
    {
        try
        {
            var config = await GetSmsConfigAsync();
            if (config == null)
            {
                _logger.LogWarning("SMS not configured. Message to {PhoneNumber} skipped.", phoneNumber);
                return false;
            }

            var (provider, accountSid, authToken, fromNumber, customApiUrl, customApiKey) = config.Value;

            return provider switch
            {
                SmsProvider.Twilio => await SendViaTwilioAsync(accountSid, authToken, fromNumber, phoneNumber, message),
                SmsProvider.Custom => await SendViaCustomApiAsync(customApiUrl!, customApiKey!, phoneNumber, message),
                _ => await SendViaTwilioAsync(accountSid, authToken, fromNumber, phoneNumber, message)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SMS to {PhoneNumber}", phoneNumber);
            return false;
        }
    }

    private async Task<bool> SendViaTwilioAsync(string accountSid, string authToken, string from, string to, string body)
    {
        var client = _httpClientFactory.CreateClient();
        var url = $"https://api.twilio.com/2010-04-01/Accounts/{Uri.EscapeDataString(accountSid)}/Messages.json";

        var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{accountSid}:{authToken}"));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

        var content = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("To", to),
            new KeyValuePair<string, string>("From", from),
            new KeyValuePair<string, string>("Body", body)
        });

        var response = await client.PostAsync(url, content);

        if (response.IsSuccessStatusCode)
        {
            _logger.LogInformation("SMS sent via Twilio to {PhoneNumber}", to);
            return true;
        }

        var responseBody = await response.Content.ReadAsStringAsync();
        _logger.LogError("Twilio SMS failed. Status: {Status}, Response: {Body}", response.StatusCode, responseBody);
        return false;
    }

    private async Task<bool> SendViaCustomApiAsync(string apiUrl, string apiKey, string to, string body)
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("X-API-Key", apiKey);

        var payload = JsonSerializer.Serialize(new { to, message = body });
        var content = new StringContent(payload, Encoding.UTF8, "application/json");

        var response = await client.PostAsync(apiUrl, content);

        if (response.IsSuccessStatusCode)
        {
            _logger.LogInformation("SMS sent via Custom API to {PhoneNumber}", to);
            return true;
        }

        var responseBody = await response.Content.ReadAsStringAsync();
        _logger.LogError("Custom SMS API failed. Status: {Status}, Response: {Body}", response.StatusCode, responseBody);
        return false;
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
