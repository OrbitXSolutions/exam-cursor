using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Core.Migrations
{
    /// <inheritdoc />
    public partial class AddVideoRetentionDays : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "VideoRetentionDays",
                table: "SystemSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VideoRetentionDays",
                table: "SystemSettings");
        }
    }
}
