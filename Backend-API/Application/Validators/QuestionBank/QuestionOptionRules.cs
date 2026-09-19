namespace Smart_Core.Application.Validators.QuestionBank;

public static class QuestionOptionRules
{
    public static string? Validate(int questionTypeId, decimal points,
        IEnumerable<(bool IsCorrect, decimal? Points)> source)
    {
        var options = source.ToList();
        // These IDs identify the built-in choice types in the existing question contract.
        if (questionTypeId is not (1 or 2 or 3)) return null;
        if (options.Count < 2) return "At least two options are required for a choice question.";
        if (questionTypeId == 3 && options.Count != 2)
            return "True/false questions require exactly two options.";
        var correctCount = options.Count(o => o.IsCorrect);
        if (questionTypeId is 1 or 3 && correctCount != 1)
            return "Single-choice and true/false questions require exactly one correct option.";
        if (questionTypeId == 2 && correctCount == 0)
            return "At least one option must be marked as correct.";
        if (options.Any(o => o.Points < 0)) return "Option points must be 0 or greater.";
        if (questionTypeId == 2 && options.Any(o => o.Points.HasValue) &&
            Math.Abs(options.Sum(o => o.Points ?? 0) - points) >= 0.01m)
            return "Sum of option points must equal the question total points.";
        return null;
    }
}
