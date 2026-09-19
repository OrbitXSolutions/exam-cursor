using Smart_Core.Domain.Entities.QuestionBank;

namespace Smart_Core.Application.Validators.Candidate;

public static class CandidateAnswerValidation
{
    public static string? Validate(Question question, List<int>? selectedOptionIds, string? textAnswer)
    {
        var selected = selectedOptionIds ?? [];
        if (selected.Distinct().Count() != selected.Count)
            return "An option cannot be selected more than once";
        var validOptions = question.Options.Where(o => !o.IsDeleted).Select(o => o.Id).ToHashSet();
        if (selected.Any(id => !validOptions.Contains(id)))
            return "Invalid option selected";
        var type = question.QuestionType?.NameEn ?? string.Empty;
        if ((type.Contains("single", StringComparison.OrdinalIgnoreCase) ||
             (type.Contains("true", StringComparison.OrdinalIgnoreCase) && type.Contains("false", StringComparison.OrdinalIgnoreCase))) && selected.Count > 1)
            return "This question permits only one selected option";
        if (validOptions.Count > 0 && !string.IsNullOrWhiteSpace(textAnswer))
            return "Choice questions cannot have text answers";
        // Empty selections/text intentionally clear an answer.
        return null;
    }
}
