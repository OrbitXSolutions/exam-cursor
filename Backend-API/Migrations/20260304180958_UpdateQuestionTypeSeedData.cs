using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Smart_Core.Migrations
{
    /// <inheritdoc />
    public partial class UpdateQuestionTypeSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // DB may already have 'Subjective' under a different ID (manually added).
            // Step 1: Ensure type 4 is named Subjective (or exists)
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM QuestionTypes WHERE Id = 4)
                    UPDATE QuestionTypes SET NameEn = 'Subjective', NameAr = N'سؤال مقالي' 
                    WHERE Id = 4 AND NameEn != 'Subjective';
            ");

            // Step 2: Find the actual Subjective type and move questions from 5/6 to it
            migrationBuilder.Sql(@"
                DECLARE @targetId INT;
                SET @targetId = ISNULL(
                    (SELECT TOP 1 Id FROM QuestionTypes WHERE NameEn = 'Subjective' AND IsDeleted = 0),
                    (SELECT TOP 1 Id FROM QuestionTypes WHERE Id = 4 AND IsDeleted = 0)
                );
                IF @targetId IS NOT NULL
                BEGIN
                    UPDATE Questions SET QuestionTypeId = @targetId WHERE QuestionTypeId = 5;
                    UPDATE Questions SET QuestionTypeId = @targetId WHERE QuestionTypeId = 6;
                END
            ");

            // Step 3: Delete type 5 if no more questions reference it
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM Questions WHERE QuestionTypeId = 5)
                    DELETE FROM QuestionTypes WHERE Id = 5;
            ");

            // Step 4: Delete type 6 if no more questions reference it
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM Questions WHERE QuestionTypeId = 6)
                    DELETE FROM QuestionTypes WHERE Id = 6;
            ");

            // Step 5: Remove duplicate Subjective entries (keep lowest ID)
            migrationBuilder.Sql(@"
                DECLARE @keepId INT = (SELECT MIN(Id) FROM QuestionTypes WHERE NameEn = 'Subjective' AND IsDeleted = 0);
                IF @keepId IS NOT NULL
                BEGIN
                    UPDATE Questions SET QuestionTypeId = @keepId 
                    WHERE QuestionTypeId IN (SELECT Id FROM QuestionTypes WHERE NameEn = 'Subjective' AND Id != @keepId);
                    DELETE FROM QuestionTypes WHERE NameEn = 'Subjective' AND Id != @keepId;
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "QuestionTypes",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "NameAr", "NameEn" },
                values: new object[] { "????? ?????", "ShortAnswer" });

            migrationBuilder.InsertData(
                table: "QuestionTypes",
                columns: new[] { "Id", "CreatedBy", "CreatedDate", "DeletedBy", "IsDeleted", "NameAr", "NameEn", "UpdatedBy", "UpdatedDate" },
                values: new object[,]
                {
                    { 5, "System", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, false, "?????", "Essay", null, null },
                    { 6, "System", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, false, "????", "Numeric", null, null }
                });
        }
    }
}
