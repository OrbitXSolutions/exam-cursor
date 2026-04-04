using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Core.Migrations
{
    /// <inheritdoc />
    public partial class SeedBurstRiskRules : Migration
    {
        // ProctorEventType byte values (from ProctorEnums.cs)
        // TabSwitched=2, WindowBlurred=3, FullscreenExited=4, CopyAttempt=5
        // FaceNotDetected=52, CameraBlocked=54
        //
        // These burst rules fire with 3× the points of the equivalent session-total rule
        // when the same violation count occurs within a 120-second window.
        // No code changes needed — the existing rule engine supports WindowSeconds.

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var now = "2026-04-04 09:41:48";
            var seedUser = "migration";

            migrationBuilder.Sql($@"
                INSERT INTO ProctorRiskRules
                    (NameEn, NameAr, DescriptionEn, DescriptionAr, IsActive, EventType,
                     ThresholdCount, WindowSeconds, RiskPoints, MinSeverity, MaxTriggers,
                     Priority, RuleConfigJson, CreatedDate, CreatedBy, IsDeleted)
                VALUES
                -- Tab Switch burst: 3 switches in 2 minutes → high intent to cheat
                ('Tab Switch Burst', 'اندفاع تبديل التبويب',
                 'Triggered when 3+ tab switches occur within a 120-second window',
                 'يتم تفعيله عند تبديل 3 تبويبات أو أكثر خلال 120 ثانية',
                 1, 2, 3, 120, 25.0, NULL, 2, 100,
                 NULL, '{now}', '{seedUser}', 0),

                -- Window Blur burst: 3 window focus losses in 2 minutes
                ('Window Blur Burst', 'اندفاع فقدان التركيز',
                 'Triggered when window loses focus 3+ times within a 120-second window',
                 'يتم تفعيله عند فقدان التركيز 3 مرات أو أكثر خلال 120 ثانية',
                 1, 3, 3, 120, 20.0, NULL, 2, 110,
                 NULL, '{now}', '{seedUser}', 0),

                -- Copy/Paste burst: 2 copy attempts in 2 minutes
                ('Copy Attempt Burst', 'اندفاع محاولة النسخ',
                 'Triggered when 2+ copy attempts occur within a 120-second window',
                 'يتم تفعيله عند محاولتين أو أكثر للنسخ خلال 120 ثانية',
                 1, 5, 2, 120, 20.0, NULL, 2, 120,
                 NULL, '{now}', '{seedUser}', 0),

                -- Face Not Detected burst: 3 events in 2 minutes (camera cover attempt)
                ('Face Absent Burst', 'اندفاع غياب الوجه',
                 'Triggered when face is absent 3+ times within a 120-second window',
                 'يتم تفعيله عند غياب الوجه 3 مرات أو أكثر خلال 120 ثانية',
                 1, 52, 3, 120, 30.0, NULL, 1, 130,
                 NULL, '{now}', '{seedUser}', 0),

                -- Camera Blocked burst: 2 blocks in 90 seconds (repeated deliberate blocking)
                ('Camera Blocked Burst', 'اندفاع حجب الكاميرا',
                 'Triggered when camera is blocked 2+ times within a 90-second window',
                 'يتم تفعيله عند حجب الكاميرا مرتين أو أكثر خلال 90 ثانية',
                 1, 54, 2, 90, 35.0, NULL, 1, 140,
                 NULL, '{now}', '{seedUser}', 0)
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DELETE FROM ProctorRiskRules
                WHERE NameEn IN (
                    'Tab Switch Burst',
                    'Window Blur Burst',
                    'Copy Attempt Burst',
                    'Face Absent Burst',
                    'Camera Blocked Burst'
                )
            ");
        }
    }
}

