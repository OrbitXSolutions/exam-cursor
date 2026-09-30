using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Core.Migrations;

/// <summary>Update legacy brand defaults using the existing settings tables; retain customer overrides.</summary>
public partial class ApplyDigitalDubaiBranding : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            UPDATE SystemSettings SET BrandName = N'Digital Dubai Exams'
                WHERE LTRIM(RTRIM(BrandName)) IN (N'', N'SmartExam', N'Smart-Exam');
            UPDATE SystemSettings SET LogoUrl = N'/branding/digital-dubai.png' WHERE LTRIM(RTRIM(LogoUrl)) = N'';
            UPDATE SystemSettings SET FooterText = N'Digital Dubai · Dubai Data and Statistics Establishment'
                WHERE LTRIM(RTRIM(FooterText)) IN (N'', N'© SmartExam. All rights reserved.');
            UPDATE SystemSettings SET PrimaryColor = N'#0076a8'
                WHERE LOWER(LTRIM(RTRIM(PrimaryColor))) IN (N'', N'#0d9488', N'#10b981');

            UPDATE OrganizationSettings SET Name = N'Digital Dubai Exams'
                WHERE LTRIM(RTRIM(Name)) IN (N'SmartExam', N'Smart-Exam');
            UPDATE OrganizationSettings SET PrimaryColor = N'#0076a8'
                WHERE LOWER(LTRIM(RTRIM(PrimaryColor))) IN (N'#0d9488', N'#10b981');
            UPDATE OrganizationSettings SET FooterText = N'Digital Dubai · Dubai Data and Statistics Establishment'
                WHERE LTRIM(RTRIM(FooterText)) = N'© SmartExam. All rights reserved.';

            IF NOT EXISTS (SELECT 1 FROM SystemSettings)
            BEGIN
                INSERT INTO SystemSettings
                    (MaintenanceMode, AllowRegistration, DefaultProctorMode, MaxFileUploadMb,
                     SessionTimeoutMinutes, PasswordPolicyMinLength, PasswordPolicyRequireUppercase,
                     PasswordPolicyRequireNumbers, PasswordPolicyRequireSpecialChars, LogoUrl,
                     BrandName, FooterText, SupportEmail, SupportUrl, PrimaryColor, CreatedDate,
                     VideoRetentionDays, EnableLiveVideo, EnableVideoRecording, EnableSmartMonitoring)
                VALUES
                    (0, 1, N'Soft', 10, 120, 8, 1, 1, 0, N'/branding/digital-dubai.png',
                     N'Digital Dubai Exams', N'Digital Dubai · Dubai Data and Statistics Establishment',
                     N'', N'', N'#0076a8', SYSDATETIMEOFFSET(), 30, 1, 1, 1);
            END
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // A data-only branding update is compatible with the previous schema. Deliberately
        // retain current settings: rollback cannot distinguish migrated values from later
        // administrator edits, and must not overwrite those edits or delete a settings row.
    }
}
