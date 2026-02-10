using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Core.Migrations
{
    /// <inheritdoc />
    public partial class AddExamSectionBuilderFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PickCount",
                table: "ExamSections",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "QuestionSubjectId",
                table: "ExamSections",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "QuestionTopicId",
                table: "ExamSections",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "SourceType",
                table: "ExamSections",
                type: "tinyint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExamSections_QuestionSubjectId",
                table: "ExamSections",
                column: "QuestionSubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_ExamSections_QuestionTopicId",
                table: "ExamSections",
                column: "QuestionTopicId");

            migrationBuilder.AddForeignKey(
                name: "FK_ExamSections_QuestionSubjects_QuestionSubjectId",
                table: "ExamSections",
                column: "QuestionSubjectId",
                principalTable: "QuestionSubjects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ExamSections_QuestionTopics_QuestionTopicId",
                table: "ExamSections",
                column: "QuestionTopicId",
                principalTable: "QuestionTopics",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ExamSections_QuestionSubjects_QuestionSubjectId",
                table: "ExamSections");

            migrationBuilder.DropForeignKey(
                name: "FK_ExamSections_QuestionTopics_QuestionTopicId",
                table: "ExamSections");

            migrationBuilder.DropIndex(
                name: "IX_ExamSections_QuestionSubjectId",
                table: "ExamSections");

            migrationBuilder.DropIndex(
                name: "IX_ExamSections_QuestionTopicId",
                table: "ExamSections");

            migrationBuilder.DropColumn(
                name: "PickCount",
                table: "ExamSections");

            migrationBuilder.DropColumn(
                name: "QuestionSubjectId",
                table: "ExamSections");

            migrationBuilder.DropColumn(
                name: "QuestionTopicId",
                table: "ExamSections");

            migrationBuilder.DropColumn(
                name: "SourceType",
                table: "ExamSections");
        }
    }
}
