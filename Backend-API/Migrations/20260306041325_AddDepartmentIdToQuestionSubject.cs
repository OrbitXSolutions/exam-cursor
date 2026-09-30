using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Core.Migrations
{
    /// <inheritdoc />
    public partial class AddDepartmentIdToQuestionSubject : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_QuestionSubjects_NameAr",
                table: "QuestionSubjects");

            migrationBuilder.DropIndex(
                name: "IX_QuestionSubjects_NameEn",
                table: "QuestionSubjects");

            migrationBuilder.AddColumn<int>(
                name: "DepartmentId",
                table: "QuestionSubjects",
                type: "int",
                nullable: false,
                defaultValue: 0);

            // Fresh databases already contain the General subject, but demo departments
            // are only seeded after migrations. Preserve those subjects with a valid
            // department, without restoring or renaming any archived departments.
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM QuestionSubjects WHERE DepartmentId = 0)
                   AND NOT EXISTS (SELECT 1 FROM Departments WHERE IsDeleted = 0)
                BEGIN
                    DECLARE @NameEn nvarchar(300) = N'General Department';
                    DECLARE @NameAr nvarchar(300) = N'القسم العام';
                    DECLARE @Suffix int = 1;

                    WHILE EXISTS (SELECT 1 FROM Departments WHERE NameEn = @NameEn OR NameAr = @NameAr)
                    BEGIN
                        SET @Suffix = @Suffix + 1;
                        SET @NameEn = N'General Department (' + CAST(@Suffix AS nvarchar(10)) + N')';
                        SET @NameAr = N'القسم العام (' + CAST(@Suffix AS nvarchar(10)) + N')';
                    END;

                    INSERT INTO Departments (NameEn, NameAr, IsActive, CreatedDate, IsDeleted)
                    VALUES (@NameEn, @NameAr, 1, GETUTCDATE(), 0);
                END;

                UPDATE QuestionSubjects
                SET DepartmentId = (SELECT TOP 1 Id FROM Departments WHERE IsDeleted = 0 ORDER BY Id)
                WHERE DepartmentId = 0
            ");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionSubjects_DepartmentId",
                table: "QuestionSubjects",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionSubjects_DepartmentId_NameAr",
                table: "QuestionSubjects",
                columns: new[] { "DepartmentId", "NameAr" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuestionSubjects_DepartmentId_NameEn",
                table: "QuestionSubjects",
                columns: new[] { "DepartmentId", "NameEn" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_QuestionSubjects_Departments_DepartmentId",
                table: "QuestionSubjects",
                column: "DepartmentId",
                principalTable: "Departments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QuestionSubjects_Departments_DepartmentId",
                table: "QuestionSubjects");

            migrationBuilder.DropIndex(
                name: "IX_QuestionSubjects_DepartmentId",
                table: "QuestionSubjects");

            migrationBuilder.DropIndex(
                name: "IX_QuestionSubjects_DepartmentId_NameAr",
                table: "QuestionSubjects");

            migrationBuilder.DropIndex(
                name: "IX_QuestionSubjects_DepartmentId_NameEn",
                table: "QuestionSubjects");

            migrationBuilder.DropColumn(
                name: "DepartmentId",
                table: "QuestionSubjects");

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
        }
    }
}
