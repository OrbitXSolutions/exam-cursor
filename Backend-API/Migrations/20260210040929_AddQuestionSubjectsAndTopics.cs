using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Core.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestionSubjectsAndTopics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Create QuestionSubjects table first
            migrationBuilder.CreateTable(
                name: "QuestionSubjects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NameEn = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    NameAr = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionSubjects", x => x.Id);
                });

            // 2. Seed default "General" subject
            migrationBuilder.Sql(@"
                SET IDENTITY_INSERT [QuestionSubjects] ON;
                INSERT INTO [QuestionSubjects] ([Id], [NameEn], [NameAr], [CreatedDate], [IsDeleted])
                VALUES (1, 'General', N'عام', GETUTCDATE(), 0);
                SET IDENTITY_INSERT [QuestionSubjects] OFF;
            ");

            // 3. Create QuestionTopics table
            migrationBuilder.CreateTable(
                name: "QuestionTopics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NameEn = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    NameAr = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    SubjectId = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionTopics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuestionTopics_QuestionSubjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "QuestionSubjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            // 4. Add SubjectId column with default value of 1 (General subject)
            migrationBuilder.AddColumn<int>(
                name: "SubjectId",
                table: "Questions",
                type: "int",
                nullable: false,
                defaultValue: 1);

            // 5. Add TopicId column (nullable)
            migrationBuilder.AddColumn<int>(
                name: "TopicId",
                table: "Questions",
                type: "int",
                nullable: true);

            // 6. Create indexes
            migrationBuilder.CreateIndex(
                name: "IX_Questions_SubjectId",
                table: "Questions",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_TopicId",
                table: "Questions",
                column: "TopicId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionSubjects_NameAr",
                table: "QuestionSubjects",
                column: "NameAr",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuestionSubjects_NameEn",
                table: "QuestionSubjects",
                column: "NameEn",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuestionTopics_SubjectId",
                table: "QuestionTopics",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionTopics_SubjectId_NameAr",
                table: "QuestionTopics",
                columns: new[] { "SubjectId", "NameAr" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuestionTopics_SubjectId_NameEn",
                table: "QuestionTopics",
                columns: new[] { "SubjectId", "NameEn" },
                unique: true);

            // 7. Add foreign key constraints
            migrationBuilder.AddForeignKey(
                name: "FK_Questions_QuestionSubjects_SubjectId",
                table: "Questions",
                column: "SubjectId",
                principalTable: "QuestionSubjects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Questions_QuestionTopics_TopicId",
                table: "Questions",
                column: "TopicId",
                principalTable: "QuestionTopics",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Questions_QuestionSubjects_SubjectId",
                table: "Questions");

            migrationBuilder.DropForeignKey(
                name: "FK_Questions_QuestionTopics_TopicId",
                table: "Questions");

            migrationBuilder.DropTable(
                name: "QuestionTopics");

            migrationBuilder.DropTable(
                name: "QuestionSubjects");

            migrationBuilder.DropIndex(
                name: "IX_Questions_SubjectId",
                table: "Questions");

            migrationBuilder.DropIndex(
                name: "IX_Questions_TopicId",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "SubjectId",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "TopicId",
                table: "Questions");
        }
    }
}
