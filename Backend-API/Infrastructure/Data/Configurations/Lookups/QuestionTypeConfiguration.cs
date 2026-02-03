using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_Core.Domain.Entities.Lookups;

namespace Smart_Core.Infrastructure.Data.Configurations.Lookups;

public class QuestionTypeConfiguration : IEntityTypeConfiguration<QuestionType>
{
    public void Configure(EntityTypeBuilder<QuestionType> builder)
 {
        builder.ToTable("QuestionTypes");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
      .ValueGeneratedOnAdd();

       builder.Property(x => x.NameEn)
.IsRequired()
    .HasMaxLength(300);

        builder.Property(x => x.NameAr)
 .IsRequired()
 .HasMaxLength(300);

        builder.Property(x => x.CreatedBy)
.HasMaxLength(450);

        builder.Property(x => x.UpdatedBy)
   .HasMaxLength(450);

        builder.Property(x => x.DeletedBy)
            .HasMaxLength(450);

        // Unique indexes
        builder.HasIndex(x => x.NameEn)
   .IsUnique()
      .HasDatabaseName("IX_QuestionTypes_NameEn");

  builder.HasIndex(x => x.NameAr)
        .IsUnique()
  .HasDatabaseName("IX_QuestionTypes_NameAr");

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);

        // Seed data with fixed IDs
     builder.HasData(
      new QuestionType
      {
     Id = 1,
   NameEn = "MCQ_Single",
      NameAr = "?????? ?? ????? (????? ?????)",
      CreatedDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
      CreatedBy = "System",
      IsDeleted = false
            },
  new QuestionType
     {
    Id = 2,
       NameEn = "MCQ_Multi",
     NameAr = "?????? ?? ????? (???? ?? ?????)",
    CreatedDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
  CreatedBy = "System",
         IsDeleted = false
         },
        new QuestionType
     {
     Id = 3,
                NameEn = "TrueFalse",
     NameAr = "??/???",
    CreatedDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            CreatedBy = "System",
       IsDeleted = false
        },
     new QuestionType
            {
    Id = 4,
     NameEn = "ShortAnswer",
      NameAr = "????? ?????",
          CreatedDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
CreatedBy = "System",
     IsDeleted = false
            },
new QuestionType
   {
       Id = 5,
    NameEn = "Essay",
     NameAr = "?????",
           CreatedDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
      CreatedBy = "System",
 IsDeleted = false
            },
   new QuestionType
            {
      Id = 6,
       NameEn = "Numeric",
                NameAr = "????",
      CreatedDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
 CreatedBy = "System",
     IsDeleted = false
     }
        );
}
}
