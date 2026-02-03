using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Core.Migrations
{
    /// <inheritdoc />
    public partial class AddExamSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AllowReview",
                table: "Exams",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "BrowserLockdown",
                table: "Exams",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PreventCopyPaste",
                table: "Exams",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PreventScreenCapture",
                table: "Exams",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "RequireFullscreen",
                table: "Exams",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "RequireIdVerification",
                table: "Exams",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "RequireProctoring",
                table: "Exams",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "RequireWebcam",
                table: "Exams",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ShowCorrectAnswers",
                table: "Exams",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ShowResults",
                table: "Exams",
                type: "bit",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllowReview",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "BrowserLockdown",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "PreventCopyPaste",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "PreventScreenCapture",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "RequireFullscreen",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "RequireIdVerification",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "RequireProctoring",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "RequireWebcam",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "ShowCorrectAnswers",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "ShowResults",
                table: "Exams");
        }
    }
}
