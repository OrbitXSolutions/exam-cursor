using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Core.Migrations
{
    /// <inheritdoc />
    public partial class AddAttemptControlFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DeviceInfo",
                table: "Attempts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExtraTimeSeconds",
                table: "Attempts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ForceSubmittedAt",
                table: "Attempts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ForceSubmittedBy",
                table: "Attempts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IPAddress",
                table: "Attempts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastActivityAt",
                table: "Attempts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ResumeCount",
                table: "Attempts",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeviceInfo",
                table: "Attempts");

            migrationBuilder.DropColumn(
                name: "ExtraTimeSeconds",
                table: "Attempts");

            migrationBuilder.DropColumn(
                name: "ForceSubmittedAt",
                table: "Attempts");

            migrationBuilder.DropColumn(
                name: "ForceSubmittedBy",
                table: "Attempts");

            migrationBuilder.DropColumn(
                name: "IPAddress",
                table: "Attempts");

            migrationBuilder.DropColumn(
                name: "LastActivityAt",
                table: "Attempts");

            migrationBuilder.DropColumn(
                name: "ResumeCount",
                table: "Attempts");
        }
    }
}
