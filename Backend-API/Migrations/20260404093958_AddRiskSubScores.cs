using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Core.Migrations
{
    /// <inheritdoc />
    public partial class AddRiskSubScores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "BehaviorScore",
                table: "ProctorSessions",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EnvironmentScore",
                table: "ProctorSessions",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EyeScore",
                table: "ProctorSessions",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FaceScore",
                table: "ProctorSessions",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BehaviorScore",
                table: "ProctorRiskSnapshots",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EnvironmentScore",
                table: "ProctorRiskSnapshots",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EyeScore",
                table: "ProctorRiskSnapshots",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FaceScore",
                table: "ProctorRiskSnapshots",
                type: "decimal(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BehaviorScore",
                table: "ProctorSessions");

            migrationBuilder.DropColumn(
                name: "EnvironmentScore",
                table: "ProctorSessions");

            migrationBuilder.DropColumn(
                name: "EyeScore",
                table: "ProctorSessions");

            migrationBuilder.DropColumn(
                name: "FaceScore",
                table: "ProctorSessions");

            migrationBuilder.DropColumn(
                name: "BehaviorScore",
                table: "ProctorRiskSnapshots");

            migrationBuilder.DropColumn(
                name: "EnvironmentScore",
                table: "ProctorRiskSnapshots");

            migrationBuilder.DropColumn(
                name: "EyeScore",
                table: "ProctorRiskSnapshots");

            migrationBuilder.DropColumn(
                name: "FaceScore",
                table: "ProctorRiskSnapshots");
        }
    }
}
