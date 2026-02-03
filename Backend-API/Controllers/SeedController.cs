using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Domain.Constants;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly DatabaseSeeder _seeder;
    private readonly IConfiguration _configuration;

    public SeedController(DatabaseSeeder seeder, IConfiguration configuration)
    {
        _seeder = seeder;
        _configuration = configuration;
    }

    /// <summary>
    /// Seed initial data (roles and SuperDev user)
    /// </summary>
    /// <remarks>
    /// This endpoint seeds:
    /// - Roles: SuperDev, Admin, Instructor, Candidate
    /// - SuperDev User: Rowyda15@gmail.com with password 13579@Rowyda
    /// 
    /// In production, this should be protected or disabled.
    /// </remarks>
    [HttpPost]
    [AllowAnonymous] // Allow anonymous for initial setup, consider securing in production
    [ProducesResponseType(typeof(ApiResponse<SeedResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<SeedResultDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SeedData()
    {
        // Optional: Add a seed key for production security
       var seedKey = _configuration["AppSettings:SeedKey"];
var providedKey = Request.Headers["X-Seed-Key"].FirstOrDefault();
    
    if (!string.IsNullOrEmpty(seedKey) && seedKey != providedKey)
      {
return Unauthorized(ApiResponse<SeedResultDto>.FailureResponse("Invalid seed key."));
        }

        var (success, messages) = await _seeder.SeedAsync();
      
        var result = new SeedResultDto
        {
     Success = success,
            Messages = messages
        };

        if (success)
        {
  return Ok(ApiResponse<SeedResultDto>.SuccessResponse(result, "Database seeded successfully."));
        }
        
        return BadRequest(ApiResponse<SeedResultDto>.FailureResponse("Seeding failed.", messages));
    }

    /// <summary>
    /// Seeds demo data including departments, users, question categories, and question types.
    /// </summary>
    /// <remarks>
    /// Creates the following demo data:
 /// 
    /// **Roles:** Admin, Instructor, Candidate
    /// 
    /// **Departments:**
    /// - IT Department
    /// - HR Department  
    /// - Finance Department
    /// 
    /// **Users (Password: Demo@123456):**
    /// 
    /// *IT Department:*
    /// - Ahmed Hassan (ahmed.it.admin@examcore.com) - Admin
  /// - Sara Khaled (sara.it.instructor@examcore.com) - Instructor
    /// 
    /// *HR Department:*
    /// - Mona Youssef (mona.hr.admin@examcore.com) - Admin
    /// - Huda Samir (huda.hr.instructor@examcore.com) - Instructor
    /// 
    /// *Finance Department:*
    /// - Tarek Ibrahim (tarek.finance.admin@examcore.com) - Admin
    /// - Dina Mostafa (dina.finance.instructor@examcore.com) - Instructor
    /// 
    /// *Candidates (No Department):*
    /// - Ali Mahmoud (ali.it.candidate@examcore.com)
    /// - Nour Ahmed (nour.it.candidate@examcore.com)
 /// - Youssef Adel (youssef.finance.candidate@examcore.com)
    /// - Ahmed Nabil (ahmed.hr.candidate@examcore.com)
    /// - Salma Hussein (salma.hr.candidate@examcore.com)
    /// 
    /// **Question Categories:** 27 categories (IT, HR, Finance, General)
    /// 
    /// **Question Types:** MCQ Single, MCQ Multi, True/False, Short Answer, Essay, Numeric
    /// </remarks>
    [HttpPost("demo-data")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<SeedResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<SeedResultDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SeedDemoData()
    {
      // Optional: Add a seed key for production security
  //   var seedKey = _configuration["AppSettings:SeedKey"];
  //var providedKey = Request.Headers["X-Seed-Key"].FirstOrDefault();
        
  //if (!string.IsNullOrEmpty(seedKey) && seedKey != providedKey)
  //      {
  //        return Unauthorized(ApiResponse<SeedResultDto>.FailureResponse("Invalid seed key."));
  //      }

        var (success, messages) = await _seeder.SeedDemoDataAsync();
  
        var result = new SeedResultDto
  {
            Success = success,
   Messages = messages
        };

        if (success)
        {
            return Ok(ApiResponse<SeedResultDto>.SuccessResponse(result, "Demo data seeded successfully."));
        }
        
        return BadRequest(ApiResponse<SeedResultDto>.FailureResponse("Demo data seeding failed.", messages));
    }

    /// <summary>
    /// Seeds all data (initial + demo)
    /// </summary>
    /// <remarks>
    /// Combines both initial seed (SuperDev) and demo data seed in one call.
    /// </remarks>
    [HttpPost("all")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<SeedResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<SeedResultDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SeedAllData()
    {
 // Optional: Add a seed key for production security
     //var seedKey = _configuration["AppSettings:SeedKey"];
     //   var providedKey = Request.Headers["X-Seed-Key"].FirstOrDefault();
        
     //   if (!string.IsNullOrEmpty(seedKey) && seedKey != providedKey)
     //   {
     // return Unauthorized(ApiResponse<SeedResultDto>.FailureResponse("Invalid seed key."));
     // }

var allMessages = new List<string>();
        
        // Seed initial data first
  allMessages.Add("=== Seeding Initial Data ===");
        var (initialSuccess, initialMessages) = await _seeder.SeedAsync();
        allMessages.AddRange(initialMessages);
      
        if (!initialSuccess)
        {
          var failResult = new SeedResultDto { Success = false, Messages = allMessages };
            return BadRequest(ApiResponse<SeedResultDto>.FailureResponse("Failed to seed initial data.", allMessages));
        }

        // Then seed demo data
        allMessages.Add("");
        allMessages.Add("=== Seeding Demo Data ===");
  var (demoSuccess, demoMessages) = await _seeder.SeedDemoDataAsync();
        allMessages.AddRange(demoMessages);

        var result = new SeedResultDto
        {
     Success = demoSuccess,
  Messages = allMessages
      };

        if (demoSuccess)
        {
          return Ok(ApiResponse<SeedResultDto>.SuccessResponse(result, "All data seeded successfully."));
        }
        
        return BadRequest(ApiResponse<SeedResultDto>.FailureResponse("Failed to seed demo data.", allMessages));
  }
}

/// <summary>
/// Result of a seed operation
/// </summary>
public class SeedResultDto
{
    public bool Success { get; set; }
    public List<string> Messages { get; set; } = new();
    public int TotalMessages => Messages.Count(m => !string.IsNullOrWhiteSpace(m) && !m.StartsWith("==="));
    public int SuccessCount => Messages.Count(m => m.StartsWith("✓"));
    public int SkippedCount => Messages.Count(m => m.StartsWith("○"));
    public int FailedCount => Messages.Count(m => m.StartsWith("✗"));
    public int InfoCount => Messages.Count(m => m.StartsWith("ℹ"));
}
