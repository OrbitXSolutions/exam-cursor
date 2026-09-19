using Smart_Core.Application.DTOs.Assessment;
using Smart_Core.Application.Validators.Assessment;
using Smart_Core.Application.Validators.Candidate;
using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Entities.Attempt;
using Smart_Core.Domain.Entities.Lookups;
using Smart_Core.Domain.Entities.QuestionBank;

namespace Backend_API.Tests;

public sealed class CandidateInputValidationTests
{
    [Fact]
    public void OptionShuffleIsStableAcrossSourceOrderAndVariesAcrossAttempts()
    {
        var ids = Enumerable.Range(1, 12).ToArray();
        int[] Order(int attempt, IEnumerable<int> source) => source.OrderBy(id => AttemptOptionOrder.Key(attempt, 1, id), StringComparer.Ordinal).ToArray();
        Assert.Equal(Order(1, ids), Order(1, ids.Reverse()));
        Assert.NotEqual(Order(1, ids), Order(2, ids));
        Assert.Equal(ids, Order(1, ids).OrderBy(id=>id));
    }

    [Theory]
    [InlineData("MCQ Single Choice")]
    [InlineData("True / False")]
    public void SingleSelectionAcceptsClearingButRejectsForeignMultipleAndRepeatedOptions(string name)
    {
        var q = new Question { QuestionType = new QuestionType { NameEn = name }, Options = [new(){Id=1},new(){Id=2},new(){Id=3,IsDeleted=true}] };
        Assert.Null(CandidateAnswerValidation.Validate(q, [], null));
        Assert.Null(CandidateAnswerValidation.Validate(q, [1], null));
        Assert.NotNull(CandidateAnswerValidation.Validate(q, [3], null));
        Assert.NotNull(CandidateAnswerValidation.Validate(q, [999], null));
        Assert.NotNull(CandidateAnswerValidation.Validate(q, [1,2], null));
        Assert.NotNull(CandidateAnswerValidation.Validate(q, [1,1], null));
        Assert.NotNull(CandidateAnswerValidation.Validate(q, [], "Injected text"));
    }

    [Theory]
    [InlineData(null,null,false)]
    [InlineData("[]"," ",false)]
    [InlineData("null",null,false)]
    [InlineData("[1]",null,true)]
    [InlineData("[]","Candidate essay",true)]
    public void AnswerProgressRequiresContent(string? options, string? text, bool expected)
    {
        var answer=new AttemptAnswer {SelectedOptionIdsJson=options,TextAnswer=text};
        Assert.Equal(expected,AnswerContent.HasContent(answer));
        answer.IsDeleted=true;
        Assert.False(AnswerContent.HasContent(answer));
    }

    [Fact]
    public void ActualMcqMultiLookupNameCannotBypassOptionValidation()
    {
        var q = new Question { QuestionType = new QuestionType { NameEn = "MCQ_Multi" }, Options = [new(){Id=1},new(){Id=2}] };
        Assert.Null(CandidateAnswerValidation.Validate(q, [1,2], null));
        Assert.NotNull(CandidateAnswerValidation.Validate(q, [999999999], null));
    }

    [Fact]
    public void DynamicRegistrationValidatesRequiredValuesTypesAndFieldOwnership()
    {
        List<WalkInRegistrationField> fields=[new(){Id=1,LabelEn="Organization",IsRequired=true},new(){Id=2,LabelEn="Years",FieldType=WalkInFieldType.Number}];
        Assert.NotNull(WalkInAnswerValidation.Validate(fields,null));
        Assert.NotNull(WalkInAnswerValidation.Validate(fields,[new(){FieldId=1,Value="  "}]));
        Assert.Null(WalkInAnswerValidation.Validate(fields,[new(){FieldId=1,Value="Example"}]));
        Assert.Null(WalkInAnswerValidation.Validate(fields,[new(){FieldId=1,Value="Example"},new(){FieldId=2,Value="2.5"}]));
        foreach(var value in new[]{"abc","NaN","Infinity"})
            Assert.NotNull(WalkInAnswerValidation.Validate(fields,[new(){FieldId=1,Value="Example"},new(){FieldId=2,Value=value}]));
        Assert.NotNull(WalkInAnswerValidation.Validate(fields,[new(){FieldId=1,Value="Example"},new(){FieldId=999,Value="x"}]));
        Assert.NotNull(WalkInAnswerValidation.Validate(fields,[new(){FieldId=1,Value="A"},new(){FieldId=1,Value="B"}]));
        Assert.NotNull(WalkInAnswerValidation.Validate(fields,[new(){FieldId=1,Value=new string('x',501)}]));
        Assert.Null(WalkInAnswerValidation.Validate([],null));
    }
}
