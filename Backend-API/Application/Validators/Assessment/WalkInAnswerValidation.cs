using System.Globalization;
using Smart_Core.Application.DTOs.Assessment;
using Smart_Core.Domain.Entities.Assessment;

namespace Smart_Core.Application.Validators.Assessment;

public static class WalkInAnswerValidation
{
    public static string? Validate(IEnumerable<WalkInRegistrationField> configuredFields, List<WalkInFieldAnswerInputDto>? answers)
    {
        var fields = configuredFields.ToDictionary(f => f.Id);
        var submitted = answers ?? [];
        if (submitted.Select(a => a.FieldId).Distinct().Count() != submitted.Count)
            return "A registration field cannot be submitted more than once";
        if (submitted.Any(a => !fields.ContainsKey(a.FieldId)))
            return "Invalid registration field";
        var values = submitted.ToDictionary(a => a.FieldId, a => a.Value?.Trim() ?? string.Empty);
        foreach (var field in fields.Values)
        {
            values.TryGetValue(field.Id, out var value);
            if (string.IsNullOrWhiteSpace(value))
            {
                if (field.IsRequired) return $"{field.LabelEn} is required";
                continue;
            }
            if (value.Length > 500) return $"{field.LabelEn} cannot exceed 500 characters";
            if (field.FieldType == WalkInFieldType.Number &&
                (!double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var number) || !double.IsFinite(number)))
                return $"{field.LabelEn} must be a valid number";
        }
        return null;
    }
}
