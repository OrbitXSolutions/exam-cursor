using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.ExamResult;

namespace Smart_Core.Infrastructure.Data.Configurations.ExamResult;

public class CertificateConfiguration : IEntityTypeConfiguration<Certificate>
{
    public void Configure(EntityTypeBuilder<Certificate> builder)
    {
        builder.ToTable("Certificates");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedOnAdd();

        builder.Property(x => x.CertificateCode).IsRequired().HasMaxLength(50);
        builder.Property(x => x.CandidateId).IsRequired().HasMaxLength(450);
        builder.Property(x => x.ExamTitleEn).IsRequired().HasMaxLength(500);
        builder.Property(x => x.ExamTitleAr).IsRequired().HasMaxLength(500);
        builder.Property(x => x.CandidateNameEn).HasMaxLength(255);
        builder.Property(x => x.CandidateNameAr).HasMaxLength(255);
        builder.Property(x => x.FilePath).HasMaxLength(1000);
        builder.Property(x => x.FileUrl).HasMaxLength(1000);
        builder.Property(x => x.RevokedBy).HasMaxLength(450);
        builder.Property(x => x.RevokeReason).HasMaxLength(500);
        builder.Property(x => x.Score).HasPrecision(10, 2);
        builder.Property(x => x.MaxScore).HasPrecision(10, 2);
        builder.Property(x => x.PassScore).HasPrecision(10, 2);

        builder.HasOne(x => x.Result).WithMany().HasForeignKey(x => x.ResultId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(x => x.CertificateCode).IsUnique().HasDatabaseName("IX_Certificates_Code_Unique");
        builder.HasIndex(x => x.ResultId).IsUnique().HasDatabaseName("IX_Certificates_ResultId_Unique");
        builder.HasIndex(x => x.CandidateId).HasDatabaseName("IX_Certificates_CandidateId");

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
