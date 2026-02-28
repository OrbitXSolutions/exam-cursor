namespace Smart_Core.Application.Settings;

/// <summary>
/// Configuration settings for OpenAI integration
/// </summary>
public class OpenAISettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "gpt-4o";
    public int MaxTokens { get; set; } = 1024;
    public double Temperature { get; set; } = 0.3;
}
