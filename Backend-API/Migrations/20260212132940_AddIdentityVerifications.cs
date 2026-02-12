using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Core.Migrations
{
    /// <inheritdoc />
    public partial class AddIdentityVerifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IdentityVerifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProctorSessionId = table.Column<int>(type: "int", nullable: false),
                    AttemptId = table.Column<int>(type: "int", nullable: false),
                    ExamId = table.Column<int>(type: "int", nullable: false),
                    CandidateId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    IdDocumentUploaded = table.Column<bool>(type: "bit", nullable: false),
                    IdDocumentPath = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    IdDocumentType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    SelfiePath = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    FaceMatchScore = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    LivenessResult = table.Column<int>(type: "int", nullable: false),
                    RiskScore = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ReviewedBy = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReviewNotes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    AssignedProctorId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    DeviceInfo = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewerId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IdentityVerifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IdentityVerifications_AspNetUsers_AssignedProctorId",
                        column: x => x.AssignedProctorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_IdentityVerifications_AspNetUsers_CandidateId",
                        column: x => x.CandidateId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_IdentityVerifications_AspNetUsers_ReviewerId",
                        column: x => x.ReviewerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_IdentityVerifications_ProctorSessions_ProctorSessionId",
                        column: x => x.ProctorSessionId,
                        principalTable: "ProctorSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IdentityVerifications_AssignedProctorId",
                table: "IdentityVerifications",
                column: "AssignedProctorId");

            migrationBuilder.CreateIndex(
                name: "IX_IdentityVerifications_CandidateId",
                table: "IdentityVerifications",
                column: "CandidateId");

            migrationBuilder.CreateIndex(
                name: "IX_IdentityVerifications_ExamId",
                table: "IdentityVerifications",
                column: "ExamId");

            migrationBuilder.CreateIndex(
                name: "IX_IdentityVerifications_ProctorSessionId",
                table: "IdentityVerifications",
                column: "ProctorSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_IdentityVerifications_ReviewerId",
                table: "IdentityVerifications",
                column: "ReviewerId");

            migrationBuilder.CreateIndex(
                name: "IX_IdentityVerifications_Status",
                table: "IdentityVerifications",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_IdentityVerifications_SubmittedAt",
                table: "IdentityVerifications",
                column: "SubmittedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IdentityVerifications");
        }
    }
}
