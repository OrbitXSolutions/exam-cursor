using FluentValidation;
using Smart_Core.Application.DTOs.QuestionBank;

namespace Smart_Core.Application.Validators.QuestionBank;

public class CreateQuestionAttachmentDtoValidator : AbstractValidator<CreateQuestionAttachmentDto>
{
    private static readonly string[] AllowedFileTypes = { "Image", "PDF", "image", "pdf" };

    public CreateQuestionAttachmentDtoValidator()
    {
        RuleFor(x => x.QuestionId)
        .GreaterThan(0).WithMessage("Question ID is required");

        RuleFor(x => x.FileName)
          .NotEmpty().WithMessage("File name is required")
 .MaximumLength(255).WithMessage("File name cannot exceed 255 characters");

        RuleFor(x => x.FilePath)
       .NotEmpty().WithMessage("File path is required")
            .MaximumLength(1000).WithMessage("File path cannot exceed 1000 characters");

RuleFor(x => x.FileType)
.NotEmpty().WithMessage("File type is required")
       .Must(x => AllowedFileTypes.Contains(x))
   .WithMessage("File type must be 'Image' or 'PDF'");

        RuleFor(x => x.FileSize)
     .GreaterThan(0).WithMessage("File size must be greater than 0")
 .LessThanOrEqualTo(50 * 1024 * 1024).WithMessage("File size cannot exceed 50MB");
  }
}

public class UpdateQuestionAttachmentDtoValidator : AbstractValidator<UpdateQuestionAttachmentDto>
{
    private static readonly string[] AllowedFileTypes = { "Image", "PDF", "image", "pdf" };

    public UpdateQuestionAttachmentDtoValidator()
    {
        RuleFor(x => x.FileName)
      .NotEmpty().WithMessage("File name is required")
   .MaximumLength(255).WithMessage("File name cannot exceed 255 characters");

   RuleFor(x => x.FilePath)
            .NotEmpty().WithMessage("File path is required")
.MaximumLength(1000).WithMessage("File path cannot exceed 1000 characters");

    RuleFor(x => x.FileType)
            .NotEmpty().WithMessage("File type is required")
 .Must(x => AllowedFileTypes.Contains(x))
    .WithMessage("File type must be 'Image' or 'PDF'");

        RuleFor(x => x.FileSize)
       .GreaterThan(0).WithMessage("File size must be greater than 0")
      .LessThanOrEqualTo(50 * 1024 * 1024).WithMessage("File size cannot exceed 50MB");
    }
}
