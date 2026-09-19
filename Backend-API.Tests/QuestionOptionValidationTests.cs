using Smart_Core.Application.DTOs.QuestionBank;
using Smart_Core.Application.Validators.QuestionBank;
using Smart_Core.Domain.Enums;

namespace Backend_API.Tests;

public sealed class QuestionOptionValidationTests
{
    [Theory]
    [InlineData(0, 0)]
    [InlineData(1, 1)]
    [InlineData(2, 0)]
    [InlineData(2, 2)]
    public void SingleChoiceRejectsIncompleteOrAmbiguousAnswerKey(int count, int correct)
    {
        var dto = Question();
        dto.Options = Enumerable.Range(0, count).Select(i => Option(i < correct)).ToList();
        Assert.False(new CreateQuestionDtoValidator().Validate(dto).IsValid);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(3)]
    public void ValidSingleChoiceAndTrueFalseAreAccepted(int type)
    {
        var dto = Question(); dto.QuestionTypeId = type;
        Assert.True(new CreateQuestionDtoValidator().Validate(dto).IsValid);
    }

    [Fact]
    public void MultipleChoiceSupportsLegacyAndExplicitScoringButRejectsMismatchedTotal()
    {
        var dto = Question(); dto.QuestionTypeId = 2;
        dto.Options = [Option(true), Option(true), Option(false)];
        var validator = new CreateQuestionDtoValidator();
        Assert.True(validator.Validate(dto).IsValid);
        dto.Options[0].Points = 6; dto.Options[1].Points = 4; dto.Options[2].Points = 0;
        Assert.True(validator.Validate(dto).IsValid);
        dto.Options[0].Points = 7;
        Assert.False(validator.Validate(dto).IsValid);
    }

    [Fact]
    public void AtomicUpdateValidatesNewPointsWithNewOptionsAndKeepsMetadataOnlyCompatibility()
    {
        var dto = new UpdateQuestionDto {
            BodyEn="Question", BodyAr="سؤال", QuestionTypeId=2, SubjectId=1,
            Points=20, DifficultyLevel=DifficultyLevel.Medium,
            Options=[new(){Id=1,TextEn="A",TextAr="أ",IsCorrect=true,Points=12},
                new(){Id=2,TextEn="B",TextAr="ب",IsCorrect=true,Points=8}]
        };
        var validator = new UpdateQuestionDtoValidator();
        Assert.True(validator.Validate(dto).IsValid);
        dto.Points = 10;
        Assert.False(validator.Validate(dto).IsValid);
        dto.Options = null;
        Assert.True(validator.Validate(dto).IsValid); // Service checks the persisted options.
    }

    [Fact]
    public void NullOptionsAreRejectedWithoutThrowingAndSubjectiveQuestionsNeedNoOptions()
    {
        var dto=Question(); dto.Options=null!;
        Assert.False(new CreateQuestionDtoValidator().Validate(dto).IsValid);
        dto.QuestionTypeId=4; dto.Options=[];
        Assert.True(new CreateQuestionDtoValidator().Validate(dto).IsValid);
    }

    private static CreateQuestionDto Question() => new() {
        BodyEn="Question",BodyAr="سؤال",QuestionTypeId=1,SubjectId=1,Points=10,
        DifficultyLevel=DifficultyLevel.Medium, Options=[Option(true),Option(false)]
    };
    private static CreateQuestionOptionDto Option(bool correct) => new(){TextEn="Option",TextAr="خيار",IsCorrect=correct};
}
