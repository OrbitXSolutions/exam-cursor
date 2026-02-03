using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Lookups;

namespace Smart_Core.Infrastructure.Data;

public class DatabaseSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;

    public DatabaseSeeder(
    ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public async Task<(bool Success, List<string> Messages)> SeedAsync()
    {
     var messages = new List<string>();

        // Seed Roles
        foreach (var roleName in AppRoles.AllRoles)
        {
    if (!await _roleManager.RoleExistsAsync(roleName))
       {
                var role = new ApplicationRole
       {
  Name = roleName,
 Description = $"{roleName} role",
        CreatedDate = DateTime.UtcNow,
        CreatedBy = "System"
     };

     var result = await _roleManager.CreateAsync(role);
     if (result.Succeeded)
    {
         messages.Add($"Role '{roleName}' created successfully.");
    }
     else
      {
     messages.Add($"Failed to create role '{roleName}': {string.Join(", ", result.Errors.Select(e => e.Description))}");
 }
     }
   else
    {
             messages.Add($"Role '{roleName}' already exists.");
            }
        }

        // Seed SuperDev User
      var superDevEmail = ProtectedUsers.SuperDevEmail;
        var existingUser = await _userManager.FindByEmailAsync(superDevEmail);

  if (existingUser == null)
     {
    var superDevUser = new ApplicationUser
        {
        UserName = superDevEmail,
    Email = superDevEmail,
         EmailConfirmed = true,
             DisplayName = "Rowyda",
  FullName = "Rowyda Super Developer",
                Status = UserStatus.Active,
    CreatedDate = DateTime.UtcNow,
                CreatedBy = "System"
      };

     var createResult = await _userManager.CreateAsync(superDevUser, "13579@Rowyda");
      if (createResult.Succeeded)
            {
      messages.Add($"SuperDev user '{superDevEmail}' created successfully.");

      var roleResult = await _userManager.AddToRoleAsync(superDevUser, AppRoles.SuperDev);
      if (roleResult.Succeeded)
      {
         messages.Add($"SuperDev user assigned to '{AppRoles.SuperDev}' role successfully.");
       }
          else
         {
          messages.Add($"Failed to assign SuperDev role: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
     }
            }
            else
  {
  messages.Add($"Failed to create SuperDev user: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
return (false, messages);
       }
        }
        else
        {
    messages.Add($"SuperDev user '{superDevEmail}' already exists.");

 // Ensure user is in SuperDev role
 if (!await _userManager.IsInRoleAsync(existingUser, AppRoles.SuperDev))
       {
          await _userManager.AddToRoleAsync(existingUser, AppRoles.SuperDev);
    messages.Add($"SuperDev user added to '{AppRoles.SuperDev}' role.");
     }
        }

        return (true, messages);
    }

 /// <summary>
  /// Seeds demo data including departments, users, question categories, and question types
    /// </summary>
    public async Task<(bool Success, List<string> Messages)> SeedDemoDataAsync()
  {
        var messages = new List<string>();

    try
        {
      // 1. Seed Roles (if not exist)
      await SeedRolesAsync(messages);

     // 2. Seed Departments
            var departments = await SeedDepartmentsAsync(messages);

            // 3. Seed Users
  await SeedUsersAsync(messages, departments);

            // 4. Seed Question Categories
            await SeedQuestionCategoriesAsync(messages);

         // 5. Seed Question Types (if not seeded via configuration)
     await SeedQuestionTypesAsync(messages);

  return (true, messages);
        }
        catch (Exception ex)
        {
      messages.Add($"Error seeding demo data: {ex.Message}");
return (false, messages);
      }
    }

    private async Task SeedRolesAsync(List<string> messages)
    {
        var rolesToSeed = new[]
        {
   (Name: AppRoles.Admin, Description: "Administrator with full access to department resources"),
      (Name: AppRoles.Instructor, Description: "Instructor who can create and manage exams"),
     (Name: AppRoles.Candidate, Description: "Candidate who can take exams")
        };

   foreach (var roleInfo in rolesToSeed)
        {
      if (!await _roleManager.RoleExistsAsync(roleInfo.Name))
            {
         var role = new ApplicationRole
                {
  Name = roleInfo.Name,
    Description = roleInfo.Description,
          CreatedDate = DateTime.UtcNow,
       CreatedBy = "DemoSeeder"
                };

          var result = await _roleManager.CreateAsync(role);
            if (result.Succeeded)
      {
   messages.Add($"? Role '{roleInfo.Name}' created.");
 }
            else
 {
            messages.Add($"? Failed to create role '{roleInfo.Name}': {string.Join(", ", result.Errors.Select(e => e.Description))}");
    }
      }
       else
            {
           messages.Add($"? Role '{roleInfo.Name}' already exists.");
  }
        }
    }

    private async Task<Dictionary<string, int>> SeedDepartmentsAsync(List<string> messages)
    {
      var departmentIds = new Dictionary<string, int>();

        var departmentsToSeed = new[]
        {
     new { Code = "IT", NameEn = "IT Department", NameAr = "??? ????? ?????????", DescriptionEn = "Information Technology Department", DescriptionAr = "??? ????? ????????? ?????? ?????" },
     new { Code = "HR", NameEn = "HR Department", NameAr = "??? ??????? ???????", DescriptionEn = "Human Resources Department", DescriptionAr = "??? ??????? ??????? ????? ????????" },
 new { Code = "FIN", NameEn = "Finance Department", NameAr = "??? ???????", DescriptionEn = "Finance and Accounting Department", DescriptionAr = "??? ??????? ?????????" }
        };

        foreach (var deptInfo in departmentsToSeed)
        {
            var existingDept = await _context.Departments
      .FirstOrDefaultAsync(d => d.Code == deptInfo.Code);

          if (existingDept == null)
    {
           var department = new Department
         {
       Code = deptInfo.Code,
  NameEn = deptInfo.NameEn,
         NameAr = deptInfo.NameAr,
     DescriptionEn = deptInfo.DescriptionEn,
              DescriptionAr = deptInfo.DescriptionAr,
               IsActive = true,
              CreatedDate = DateTime.UtcNow,
 CreatedBy = "DemoSeeder"
      };

                _context.Departments.Add(department);
       await _context.SaveChangesAsync();
        departmentIds[deptInfo.Code] = department.Id;
messages.Add($"? Department '{deptInfo.NameEn}' created.");
      }
            else
            {
      departmentIds[deptInfo.Code] = existingDept.Id;
     messages.Add($"? Department '{deptInfo.NameEn}' already exists.");
            }
        }

      return departmentIds;
    }

    private async Task SeedUsersAsync(List<string> messages, Dictionary<string, int> departments)
    {
        const string defaultPassword = "Demo@123456";

        var usersToSeed = new[]
        {
      // IT Department - Admin & Instructor
  new { Email = "ahmed.it.admin@examcore.com", DisplayName = "Ahmed Hassan", FullName = "Ahmed Hassan", Role = AppRoles.Admin, DepartmentCode = "IT" },
 new { Email = "sara.it.instructor@examcore.com", DisplayName = "Sara Khaled", FullName = "Sara Khaled", Role = AppRoles.Instructor, DepartmentCode = "IT" },

     // HR Department - Admin & Instructor
   new { Email = "mona.hr.admin@examcore.com", DisplayName = "Mona Youssef", FullName = "Mona Youssef", Role = AppRoles.Admin, DepartmentCode = "HR" },
 new { Email = "huda.hr.instructor@examcore.com", DisplayName = "Huda Samir", FullName = "Huda Samir", Role = AppRoles.Instructor, DepartmentCode = "HR" },

            // Finance Department - Admin & Instructor
     new { Email = "tarek.finance.admin@examcore.com", DisplayName = "Tarek Ibrahim", FullName = "Tarek Ibrahim", Role = AppRoles.Admin, DepartmentCode = "FIN" },
        new { Email = "dina.finance.instructor@examcore.com", DisplayName = "Dina Mostafa", FullName = "Dina Mostafa", Role = AppRoles.Instructor, DepartmentCode = "FIN" },

   // Candidates (no department assignment - can take any exam)
   new { Email = "ali.it.candidate@examcore.com", DisplayName = "Ali Mahmoud", FullName = "Ali Mahmoud", Role = AppRoles.Candidate, DepartmentCode = (string?)null },
 new { Email = "nour.it.candidate@examcore.com", DisplayName = "Nour Ahmed", FullName = "Nour Ahmed", Role = AppRoles.Candidate, DepartmentCode = (string?)null },
            new { Email = "youssef.finance.candidate@examcore.com", DisplayName = "Youssef Adel", FullName = "Youssef Adel", Role = AppRoles.Candidate, DepartmentCode = (string?)null },
     new { Email = "ahmed.hr.candidate@examcore.com", DisplayName = "Ahmed Nabil", FullName = "Ahmed Nabil", Role = AppRoles.Candidate, DepartmentCode = (string?)null },
            new { Email = "salma.hr.candidate@examcore.com", DisplayName = "Salma Hussein", FullName = "Salma Hussein", Role = AppRoles.Candidate, DepartmentCode = (string?)null }
        };

        foreach (var userInfo in usersToSeed)
        {
     var existingUser = await _userManager.FindByEmailAsync(userInfo.Email);

      if (existingUser == null)
  {
     int? departmentId = null;
    if (!string.IsNullOrEmpty(userInfo.DepartmentCode) && departments.ContainsKey(userInfo.DepartmentCode))
   {
     departmentId = departments[userInfo.DepartmentCode];
           }

    var user = new ApplicationUser
             {
         UserName = userInfo.Email,
          Email = userInfo.Email,
      EmailConfirmed = true,
             DisplayName = userInfo.DisplayName,
      FullName = userInfo.FullName,
        DepartmentId = departmentId,
      Status = UserStatus.Active,
        CreatedDate = DateTime.UtcNow,
       CreatedBy = "DemoSeeder"
      };

          var createResult = await _userManager.CreateAsync(user, defaultPassword);
      if (createResult.Succeeded)
                {
           var roleResult = await _userManager.AddToRoleAsync(user, userInfo.Role);
         if (roleResult.Succeeded)
        {
        var deptName = string.IsNullOrEmpty(userInfo.DepartmentCode) ? "No Department" : userInfo.DepartmentCode;
    messages.Add($"? User '{userInfo.DisplayName}' ({userInfo.Email}) created as {userInfo.Role} in {deptName}.");
          }
             else
         {
   messages.Add($"? Failed to assign role to '{userInfo.Email}': {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
          }
    }
  else
 {
       messages.Add($"? Failed to create user '{userInfo.Email}': {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
    }
    }
            else
      {
 messages.Add($"? User '{userInfo.Email}' already exists.");
  }
     }

        messages.Add($"? Default password for all demo users: {defaultPassword}");
    }

private async Task SeedQuestionCategoriesAsync(List<string> messages)
    {
        var categoriesToSeed = new[]
        {
      // IT Categories
            new { NameEn = "Programming Fundamentals", NameAr = "??????? ???????" },
            new { NameEn = "Database Management", NameAr = "????? ????? ????????" },
 new { NameEn = "Networking", NameAr = "???????" },
      new { NameEn = "Cybersecurity", NameAr = "????? ?????????" },
  new { NameEn = "Cloud Computing", NameAr = "??????? ????????" },
 new { NameEn = "Software Engineering", NameAr = "????? ?????????" },
       new { NameEn = "Web Development", NameAr = "????? ?????" },
        new { NameEn = "Mobile Development", NameAr = "????? ??????? ??????" },

     // HR Categories
            new { NameEn = "Recruitment & Selection", NameAr = "??????? ?????????" },
     new { NameEn = "Employee Relations", NameAr = "?????? ????????" },
        new { NameEn = "Training & Development", NameAr = "??????? ????????" },
    new { NameEn = "Performance Management", NameAr = "????? ??????" },
 new { NameEn = "Labor Laws & Compliance", NameAr = "?????? ????? ?????????" },
new { NameEn = "Compensation & Benefits", NameAr = "????????? ????????" },

            // Finance Categories
        new { NameEn = "Financial Accounting", NameAr = "???????? ???????" },
    new { NameEn = "Management Accounting", NameAr = "???????? ????????" },
            new { NameEn = "Auditing", NameAr = "???????" },
new { NameEn = "Taxation", NameAr = "???????" },
            new { NameEn = "Financial Analysis", NameAr = "??????? ??????" },
  new { NameEn = "Budgeting & Forecasting", NameAr = "???????? ???????" },
       new { NameEn = "Corporate Finance", NameAr = "????? ???????" },

            // General Categories
          new { NameEn = "General Knowledge", NameAr = "??????? ????" },
      new { NameEn = "Communication Skills", NameAr = "?????? ???????" },
            new { NameEn = "Leadership & Management", NameAr = "??????? ????????" },
  new { NameEn = "Problem Solving", NameAr = "?? ????????" },
            new { NameEn = "Critical Thinking", NameAr = "??????? ??????" }
    };

        foreach (var catInfo in categoriesToSeed)
        {
   var exists = await _context.QuestionCategories
                .AnyAsync(c => c.NameEn == catInfo.NameEn);

 if (!exists)
    {
         var category = new QuestionCategory
      {
  NameEn = catInfo.NameEn,
 NameAr = catInfo.NameAr,
      CreatedDate = DateTime.UtcNow,
             CreatedBy = "DemoSeeder"
    };

       _context.QuestionCategories.Add(category);
         messages.Add($"? Question Category '{catInfo.NameEn}' created.");
        }
     else
   {
            messages.Add($"? Question Category '{catInfo.NameEn}' already exists.");
          }
        }

        await _context.SaveChangesAsync();
    }

    private async Task SeedQuestionTypesAsync(List<string> messages)
    {
        // Question types are seeded via EF configuration, but we verify they exist
        var expectedTypes = new[]
        {
   new { Id = 1, NameEn = "MCQ_Single", NameAr = "?????? ?? ????? (????? ?????)" },
            new { Id = 2, NameEn = "MCQ_Multi", NameAr = "?????? ?? ????? (???? ?? ?????)" },
            new { Id = 3, NameEn = "TrueFalse", NameAr = "??/???" },
 new { Id = 4, NameEn = "ShortAnswer", NameAr = "????? ?????" },
         new { Id = 5, NameEn = "Essay", NameAr = "?????" },
         new { Id = 6, NameEn = "Numeric", NameAr = "????" }
        };

        foreach (var typeInfo in expectedTypes)
        {
  var exists = await _context.QuestionTypes
         .IgnoreQueryFilters()
  .AnyAsync(t => t.Id == typeInfo.Id || t.NameEn == typeInfo.NameEn);

    if (!exists)
            {
         var questionType = new QuestionType
       {
         NameEn = typeInfo.NameEn,
        NameAr = typeInfo.NameAr,
          CreatedDate = DateTime.UtcNow,
         CreatedBy = "DemoSeeder"
    };

             _context.QuestionTypes.Add(questionType);
        messages.Add($"? Question Type '{typeInfo.NameEn}' created.");
      }
            else
            {
       messages.Add($"? Question Type '{typeInfo.NameEn}' already exists.");
       }
        }

  await _context.SaveChangesAsync();
    }
}
