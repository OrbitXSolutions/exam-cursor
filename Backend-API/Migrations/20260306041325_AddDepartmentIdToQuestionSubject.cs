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

            // Assign all existing subjects to IT Department (first department)
            migrationBuilder.Sql(@"
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
