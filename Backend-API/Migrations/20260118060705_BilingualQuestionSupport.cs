using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Core.Migrations
{
    /// <inheritdoc />
    public partial class BilingualQuestionSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Body",
                table: "Questions",
                newName: "BodyEn");

            migrationBuilder.RenameColumn(
                name: "Text",
                table: "QuestionOptions",
                newName: "TextEn");

            migrationBuilder.RenameColumn(
                name: "AcceptedAnswersJson",
                table: "QuestionAnswerKeys",
                newName: "AcceptedAnswersJsonEn");

            migrationBuilder.AddColumn<string>(
                name: "BodyAr",
                table: "Questions",
                type: "nvarchar(max)",
                maxLength: 5000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ExplanationAr",
                table: "Questions",
                type: "nvarchar(max)",
                maxLength: 5000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExplanationEn",
                table: "Questions",
                type: "nvarchar(max)",
                maxLength: 5000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TextAr",
                table: "QuestionOptions",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AcceptedAnswersJsonAr",
                table: "QuestionAnswerKeys",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BodyAr",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "ExplanationAr",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "ExplanationEn",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "TextAr",
                table: "QuestionOptions");

            migrationBuilder.DropColumn(
                name: "AcceptedAnswersJsonAr",
                table: "QuestionAnswerKeys");

            migrationBuilder.RenameColumn(
                name: "BodyEn",
                table: "Questions",
                newName: "Body");

            migrationBuilder.RenameColumn(
                name: "TextEn",
                table: "QuestionOptions",
                newName: "Text");

            migrationBuilder.RenameColumn(
                name: "AcceptedAnswersJsonEn",
                table: "QuestionAnswerKeys",
                newName: "AcceptedAnswersJson");
        }
    }
}
