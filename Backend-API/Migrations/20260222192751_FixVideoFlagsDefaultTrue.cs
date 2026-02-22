using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Core.Migrations
{
    /// <inheritdoc />
    public partial class FixVideoFlagsDefaultTrue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Fix: the original migration added EnableLiveVideo and EnableVideoRecording
            // with defaultValue: false. Existing rows got false. Set them to true.
            migrationBuilder.Sql("UPDATE SystemSettings SET EnableLiveVideo = 1, EnableVideoRecording = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
