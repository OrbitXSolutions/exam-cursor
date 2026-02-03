using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Core.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaintenanceMode = table.Column<bool>(type: "bit", nullable: false),
                    AllowRegistration = table.Column<bool>(type: "bit", nullable: false),
                    DefaultProctorMode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MaxFileUploadMb = table.Column<int>(type: "int", nullable: false),
                    SessionTimeoutMinutes = table.Column<int>(type: "int", nullable: false),
                    PasswordPolicyMinLength = table.Column<int>(type: "int", nullable: false),
                    PasswordPolicyRequireUppercase = table.Column<bool>(type: "bit", nullable: false),
                    PasswordPolicyRequireNumbers = table.Column<bool>(type: "bit", nullable: false),
                    PasswordPolicyRequireSpecialChars = table.Column<bool>(type: "bit", nullable: false),
                    LogoUrl = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    BrandName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    FooterText = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    SupportEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    SupportUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PrimaryColor = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SystemSettings");
        }
    }
}
