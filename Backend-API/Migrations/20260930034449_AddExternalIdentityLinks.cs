using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Core.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalIdentityLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GovernmentIssuer",
                table: "AspNetUsers",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                collation: "Latin1_General_100_BIN2");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "GovernmentLinkedAt",
                table: "AspNetUsers",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GovernmentSubject",
                table: "AspNetUsers",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                collation: "Latin1_General_100_BIN2");

            migrationBuilder.AddColumn<string>(
                name: "UaePassIssuer",
                table: "AspNetUsers",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                collation: "Latin1_General_100_BIN2");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "UaePassLinkedAt",
                table: "AspNetUsers",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UaePassSubject",
                table: "AspNetUsers",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                collation: "Latin1_General_100_BIN2");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_GovernmentIssuer_GovernmentSubject",
                table: "AspNetUsers",
                columns: new[] { "GovernmentIssuer", "GovernmentSubject" },
                unique: true,
                filter: "[GovernmentIssuer] IS NOT NULL AND [GovernmentSubject] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_UaePassIssuer_UaePassSubject",
                table: "AspNetUsers",
                columns: new[] { "UaePassIssuer", "UaePassSubject" },
                unique: true,
                filter: "[UaePassIssuer] IS NOT NULL AND [UaePassSubject] IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "CK_AspNetUsers_GovernmentIdentity",
                table: "AspNetUsers",
                sql: "([GovernmentIssuer] IS NULL AND [GovernmentSubject] IS NULL AND [GovernmentLinkedAt] IS NULL) OR ([GovernmentIssuer] IS NOT NULL AND [GovernmentSubject] IS NOT NULL AND [GovernmentLinkedAt] IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_AspNetUsers_UaePassIdentity",
                table: "AspNetUsers",
                sql: "([UaePassIssuer] IS NULL AND [UaePassSubject] IS NULL AND [UaePassLinkedAt] IS NULL) OR ([UaePassIssuer] IS NOT NULL AND [UaePassSubject] IS NOT NULL AND [UaePassLinkedAt] IS NOT NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_GovernmentIssuer_GovernmentSubject",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_UaePassIssuer_UaePassSubject",
                table: "AspNetUsers");

            migrationBuilder.DropCheckConstraint(
                name: "CK_AspNetUsers_GovernmentIdentity",
                table: "AspNetUsers");

            migrationBuilder.DropCheckConstraint(
                name: "CK_AspNetUsers_UaePassIdentity",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "GovernmentIssuer",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "GovernmentLinkedAt",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "GovernmentSubject",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "UaePassIssuer",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "UaePassLinkedAt",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "UaePassSubject",
                table: "AspNetUsers");
        }
    }
}
