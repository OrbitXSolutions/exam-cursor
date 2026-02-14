using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Core.Migrations
{
    /// <inheritdoc />
    public partial class AddProctorSessionFlags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFlagged",
                table: "ProctorSessions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTerminatedByProctor",
                table: "ProctorSessions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PendingWarningMessage",
                table: "ProctorSessions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TerminationReason",
                table: "ProctorSessions",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsFlagged",
                table: "ProctorSessions");

            migrationBuilder.DropColumn(
                name: "IsTerminatedByProctor",
                table: "ProctorSessions");

            migrationBuilder.DropColumn(
                name: "PendingWarningMessage",
                table: "ProctorSessions");

            migrationBuilder.DropColumn(
                name: "TerminationReason",
                table: "ProctorSessions");
        }
    }
}
