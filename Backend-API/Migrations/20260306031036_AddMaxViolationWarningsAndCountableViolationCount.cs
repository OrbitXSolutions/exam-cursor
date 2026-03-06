using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Core.Migrations
{
    /// <inheritdoc />
    public partial class AddMaxViolationWarningsAndCountableViolationCount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CountableViolationCount",
                table: "ProctorSessions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxViolationWarnings",
                table: "Exams",
                type: "int",
                nullable: false,
                defaultValue: 10);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CountableViolationCount",
                table: "ProctorSessions");

            migrationBuilder.DropColumn(
                name: "MaxViolationWarnings",
                table: "Exams");
        }
    }
}
