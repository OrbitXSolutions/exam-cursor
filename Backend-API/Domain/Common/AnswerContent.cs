using System.Linq.Expressions;
using Smart_Core.Domain.Entities.Attempt;

namespace Smart_Core.Domain.Common;

public static class AnswerContent
{
    // Selected options are persisted by JsonSerializer as compact arrays.
    public static readonly Expression<Func<AttemptAnswer, bool>> Predicate = answer =>
        !answer.IsDeleted &&
        ((!string.IsNullOrWhiteSpace(answer.TextAnswer)) ||
         (answer.SelectedOptionIdsJson != null && answer.SelectedOptionIdsJson != "" &&
          answer.SelectedOptionIdsJson != "[]" && answer.SelectedOptionIdsJson != "null"));

    public static readonly Func<AttemptAnswer, bool> HasContent = Predicate.Compile();
}
