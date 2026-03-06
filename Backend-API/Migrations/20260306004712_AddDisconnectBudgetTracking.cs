using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Core.Migrations
{
    /// <inheritdoc />
    public partial class AddDisconnectBudgetTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DisconnectDetectedAt",
                table: "Attempts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalDisconnectSeconds",
                table: "Attempts",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DisconnectDetectedAt",
                table: "Attempts");

            migrationBuilder.DropColumn(
                name: "TotalDisconnectSeconds",
                table: "Attempts");
        }
    }
}
