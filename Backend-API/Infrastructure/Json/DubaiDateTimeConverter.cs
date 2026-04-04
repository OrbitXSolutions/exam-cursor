using System.Text.Json;
using System.Text.Json.Serialization;

namespace Smart_Core.Infrastructure.Json;

/// <summary>
/// Converts all DateTime values to Dubai timezone (UTC+4) on serialization.
/// Internal logic continues to use UTC; only the API output is shifted.
/// </summary>
public class DubaiDateTimeConverter : JsonConverter<DateTime>
{
    private static readonly TimeZoneInfo DubaiTimeZone =
        TimeZoneInfo.FindSystemTimeZoneById("Arabian Standard Time");

    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.GetDateTime();
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        // Convert UTC → Dubai time for output
        var dubaiTime = value.Kind == DateTimeKind.Utc
            ? TimeZoneInfo.ConvertTimeFromUtc(value, DubaiTimeZone)
            : value.Kind == DateTimeKind.Unspecified
                ? TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(value, DateTimeKind.Utc), DubaiTimeZone)
                : value;

        writer.WriteStringValue(dubaiTime.ToString("yyyy-MM-ddTHH:mm:ss"));
    }
}

/// <summary>
/// Handles nullable DateTime? with the same Dubai conversion.
/// </summary>
public class DubaiNullableDateTimeConverter : JsonConverter<DateTime?>
{
    private static readonly TimeZoneInfo DubaiTimeZone =
        TimeZoneInfo.FindSystemTimeZoneById("Arabian Standard Time");

    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
            return null;
        return reader.GetDateTime();
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (!value.HasValue)
        {
            writer.WriteNullValue();
            return;
        }

        var dt = value.Value;
        var dubaiTime = dt.Kind == DateTimeKind.Utc
            ? TimeZoneInfo.ConvertTimeFromUtc(dt, DubaiTimeZone)
            : dt.Kind == DateTimeKind.Unspecified
                ? TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(dt, DateTimeKind.Utc), DubaiTimeZone)
                : dt;

        writer.WriteStringValue(dubaiTime.ToString("yyyy-MM-ddTHH:mm:ss"));
    }
}
