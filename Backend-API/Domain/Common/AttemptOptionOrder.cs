using System.Security.Cryptography;
using System.Text;

namespace Smart_Core.Domain.Common;

public static class AttemptOptionOrder
{
    // Stable on reload/reconnect, with a separate ordering for each attempt and question.
    public static string Key(int attemptId, int questionId, int optionId) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{attemptId}:{questionId}:{optionId}")));
}
