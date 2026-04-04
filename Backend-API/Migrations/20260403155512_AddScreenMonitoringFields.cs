using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Core.Migrations
{
    /// <inheritdoc />
    public partial class AddScreenMonitoringFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EnableScreenMonitoring",
                table: "Exams",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<byte>(
                name: "ScreenMonitoringMode",
                table: "Exams",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<int>(
                name: "ScreenShareGracePeriod",
                table: "Exams",
                type: "int",
                nullable: false,
                defaultValue: 20);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EnableScreenMonitoring",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "ScreenMonitoringMode",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "ScreenShareGracePeriod",
                table: "Exams");
        }
    }
}
