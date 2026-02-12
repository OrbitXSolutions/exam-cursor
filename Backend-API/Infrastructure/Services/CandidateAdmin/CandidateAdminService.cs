using System.Security.Cryptography;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.CandidateAdmin;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.Interfaces.CandidateAdmin;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.CandidateAdmin;

public class CandidateAdminService : ICandidateAdminService
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;

    public CandidateAdminService(
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager)
    {
        _db = db;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    // ── List ───────────────────────────────────────────────────
    public async Task<ApiResponse<PaginatedResponse<CandidateListDto>>> GetCandidatesAsync(CandidateFilterDto filter)
    {
        // Get all candidate user IDs
        var candidateRole = await _roleManager.FindByNameAsync(AppRoles.Candidate);
        if (candidateRole == null)
            return ApiResponse<PaginatedResponse<CandidateListDto>>.SuccessResponse(
                new PaginatedResponse<CandidateListDto>());

        var candidateUserIds = await _db.UserRoles
            .Where(ur => ur.RoleId == candidateRole.Id)
            .Select(ur => ur.UserId)
            .ToListAsync();

        var query = _db.Users
            .Where(u => candidateUserIds.Contains(u.Id) && !u.IsDeleted);

        // Search
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.ToLower();
            query = query.Where(u =>
                (u.FullName != null && u.FullName.ToLower().Contains(s)) ||
                (u.FullNameAr != null && u.FullNameAr.ToLower().Contains(s)) ||
                u.Email!.ToLower().Contains(s) ||
                (u.RollNo != null && u.RollNo.ToLower().Contains(s)) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(s)));
        }

        // Status filter
        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            if (filter.Status.Equals("Blocked", StringComparison.OrdinalIgnoreCase))
                query = query.Where(u => u.IsBlocked);
            else if (filter.Status.Equals("Active", StringComparison.OrdinalIgnoreCase))
                query = query.Where(u => !u.IsBlocked);
        }

        var totalCount = await query.CountAsync();

        // Sort
        query = (filter.SortBy?.ToLower(), filter.SortDir?.ToLower()) switch
        {
            ("fullname", "asc") => query.OrderBy(u => u.FullName),
            ("fullname", _) => query.OrderByDescending(u => u.FullName),
            ("email", "asc") => query.OrderBy(u => u.Email),
            ("email", _) => query.OrderByDescending(u => u.Email),
            ("rollno", "asc") => query.OrderBy(u => u.RollNo),
            ("rollno", _) => query.OrderByDescending(u => u.RollNo),
            _ => query.OrderByDescending(u => u.CreatedDate),
        };

        var users = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        // Resolve CreatedBy names in batch
        var creatorIds = users.Where(u => u.CreatedBy != null).Select(u => u.CreatedBy!).Distinct().ToList();
        var creators = await _db.Users
            .Where(u => creatorIds.Contains(u.Id))
            .Select(u => new { u.Id, u.FullName, u.Email })
            .ToDictionaryAsync(u => u.Id);

        var items = users.Select(u => new CandidateListDto
        {
            Id = u.Id,
            FullName = u.FullName,
            FullNameAr = u.FullNameAr,
            Email = u.Email!,
            RollNo = u.RollNo,
            Mobile = u.PhoneNumber,
            Status = u.IsBlocked ? "Blocked" : "Active",
            IsBlocked = u.IsBlocked,
            CreatedDate = u.CreatedDate,
            CreatedBy = u.CreatedBy,
            CreatedByName = u.CreatedBy != null && creators.TryGetValue(u.CreatedBy, out var c)
                ? (c.FullName ?? c.Email) : null
        }).ToList();

        return ApiResponse<PaginatedResponse<CandidateListDto>>.SuccessResponse(
            new PaginatedResponse<CandidateListDto>
            {
                Items = items,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize,
                TotalCount = totalCount
            });
    }

    // ── Get by ID ──────────────────────────────────────────────
    public async Task<ApiResponse<CandidateListDto>> GetCandidateByIdAsync(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null || user.IsDeleted)
            return ApiResponse<CandidateListDto>.FailureResponse("Candidate not found.");

        var roles = await _userManager.GetRolesAsync(user);
        if (!roles.Contains(AppRoles.Candidate))
            return ApiResponse<CandidateListDto>.FailureResponse("User is not a candidate.");

        return ApiResponse<CandidateListDto>.SuccessResponse(MapToDto(user));
    }

    // ── Create ─────────────────────────────────────────────────
    public async Task<ApiResponse<CandidateListDto>> CreateCandidateAsync(CreateCandidateDto dto, string createdBy)
    {
        // Validate email uniqueness
        var existing = await _userManager.FindByEmailAsync(dto.Email);
        if (existing != null)
            return ApiResponse<CandidateListDto>.FailureResponse("A user with this email already exists.");

        // Validate RollNo uniqueness
        if (!string.IsNullOrWhiteSpace(dto.RollNo))
        {
            var rollExists = await _db.Users.AnyAsync(u => u.RollNo == dto.RollNo && !u.IsDeleted);
            if (rollExists)
                return ApiResponse<CandidateListDto>.FailureResponse("A candidate with this Roll No already exists.");
        }

        var password = string.IsNullOrWhiteSpace(dto.Password) ? GeneratePassword() : dto.Password;

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            FullName = dto.FullName,
            FullNameAr = dto.FullNameAr,
            RollNo = dto.RollNo,
            PhoneNumber = dto.Mobile,
            DisplayName = dto.FullName,
            Status = UserStatus.Active,
            IsBlocked = false,
            EmailConfirmed = true,
            CreatedBy = createdBy,
            CreatedDate = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, password);
        if (!result.Succeeded)
            return ApiResponse<CandidateListDto>.FailureResponse(
                "Failed to create candidate.",
                result.Errors.Select(e => e.Description).ToList());

        // Ensure Candidate role exists
        if (!await _roleManager.RoleExistsAsync(AppRoles.Candidate))
            await _roleManager.CreateAsync(new ApplicationRole { Name = AppRoles.Candidate });

        await _userManager.AddToRoleAsync(user, AppRoles.Candidate);

        return ApiResponse<CandidateListDto>.SuccessResponse(MapToDto(user), "Candidate created successfully.");
    }

    // ── Update ─────────────────────────────────────────────────
    public async Task<ApiResponse<CandidateListDto>> UpdateCandidateAsync(string id, UpdateCandidateDto dto, string updatedBy)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null || user.IsDeleted)
            return ApiResponse<CandidateListDto>.FailureResponse("Candidate not found.");

        // Email change → check uniqueness
        if (!string.IsNullOrWhiteSpace(dto.Email) && !dto.Email.Equals(user.Email, StringComparison.OrdinalIgnoreCase))
        {
            var exists = await _userManager.FindByEmailAsync(dto.Email);
            if (exists != null)
                return ApiResponse<CandidateListDto>.FailureResponse("A user with this email already exists.");
            user.Email = dto.Email;
            user.UserName = dto.Email;
            user.NormalizedEmail = dto.Email.ToUpperInvariant();
            user.NormalizedUserName = dto.Email.ToUpperInvariant();
        }

        // RollNo change → check uniqueness
        if (dto.RollNo != null && dto.RollNo != user.RollNo)
        {
            var rollExists = await _db.Users.AnyAsync(u => u.RollNo == dto.RollNo && u.Id != id && !u.IsDeleted);
            if (rollExists)
                return ApiResponse<CandidateListDto>.FailureResponse("A candidate with this Roll No already exists.");
            user.RollNo = dto.RollNo;
        }

        if (dto.FullName != null) { user.FullName = dto.FullName; user.DisplayName = dto.FullName; }
        if (dto.FullNameAr != null) user.FullNameAr = dto.FullNameAr;
        if (dto.Mobile != null) user.PhoneNumber = dto.Mobile;
        user.UpdatedDate = DateTime.UtcNow;
        user.UpdatedBy = updatedBy;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return ApiResponse<CandidateListDto>.FailureResponse("Failed to update candidate.",
                result.Errors.Select(e => e.Description).ToList());

        // Password update
        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var pwResult = await _userManager.ResetPasswordAsync(user, token, dto.Password);
            if (!pwResult.Succeeded)
                return ApiResponse<CandidateListDto>.FailureResponse("Candidate updated but password change failed.",
                    pwResult.Errors.Select(e => e.Description).ToList());
        }

        return ApiResponse<CandidateListDto>.SuccessResponse(MapToDto(user), "Candidate updated successfully.");
    }

    // ── Block / Unblock ────────────────────────────────────────
    public async Task<ApiResponse<bool>> BlockCandidateAsync(string id, string blockedBy)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null || user.IsDeleted)
            return ApiResponse<bool>.FailureResponse("Candidate not found.");

        user.IsBlocked = true;
        user.UpdatedDate = DateTime.UtcNow;
        user.UpdatedBy = blockedBy;
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        await _userManager.UpdateAsync(user);

        return ApiResponse<bool>.SuccessResponse(true, "Candidate blocked successfully.");
    }

    public async Task<ApiResponse<bool>> UnblockCandidateAsync(string id, string updatedBy)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null || user.IsDeleted)
            return ApiResponse<bool>.FailureResponse("Candidate not found.");

        user.IsBlocked = false;
        user.UpdatedDate = DateTime.UtcNow;
        user.UpdatedBy = updatedBy;
        await _userManager.UpdateAsync(user);

        return ApiResponse<bool>.SuccessResponse(true, "Candidate unblocked successfully.");
    }

    // ── Delete (safe) ──────────────────────────────────────────
    public async Task<ApiResponse<bool>> DeleteCandidateAsync(string id, string deletedBy)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null || user.IsDeleted)
            return ApiResponse<bool>.FailureResponse("Candidate not found.");

        // Check for exam attempts
        var hasAttempts = await _db.Set<Domain.Entities.Attempt.Attempt>()
            .AnyAsync(a => a.CandidateId == id && !a.IsDeleted);
        if (hasAttempts)
            return ApiResponse<bool>.FailureResponse(
                "Cannot delete this candidate because they have exam attempts. You can block them instead.");

        // Soft delete
        user.IsDeleted = true;
        user.DeletedBy = deletedBy;
        user.UpdatedDate = DateTime.UtcNow;
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        await _userManager.UpdateAsync(user);

        return ApiResponse<bool>.SuccessResponse(true, "Candidate deleted successfully.");
    }

    // ── Export Excel ───────────────────────────────────────────
    public async Task<byte[]> ExportCandidatesAsync(CandidateFilterDto filter)
    {
        // Remove pagination for export
        filter.PageNumber = 1;
        filter.PageSize = 100_000;
        var response = await GetCandidatesAsync(filter);
        var candidates = response.Data?.Items ?? new List<CandidateListDto>();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Candidates");

        // Headers
        var headers = new[] { "FullName", "FullNameAr", "Email", "RollNo", "Mobile", "Status", "CreatedAt" };
        for (int i = 0; i < headers.Length; i++)
            ws.Cell(1, i + 1).Value = headers[i];

        ws.Row(1).Style.Font.Bold = true;
        ws.Row(1).Style.Fill.BackgroundColor = XLColor.LightGray;

        // Data
        for (int r = 0; r < candidates.Count; r++)
        {
            var c = candidates[r];
            ws.Cell(r + 2, 1).Value = c.FullName ?? "";
            ws.Cell(r + 2, 2).Value = c.FullNameAr ?? "";
            ws.Cell(r + 2, 3).Value = c.Email;
            ws.Cell(r + 2, 4).Value = c.RollNo ?? "";
            ws.Cell(r + 2, 5).Value = c.Mobile ?? "";
            ws.Cell(r + 2, 6).Value = c.Status;
            ws.Cell(r + 2, 7).Value = c.CreatedDate.ToString("yyyy-MM-dd HH:mm");
        }

        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    // ── Import Template ────────────────────────────────────────
    public async Task<byte[]> GetImportTemplateAsync()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Candidates");

        var headers = new[] { "FullName", "FullNameAr", "Email", "Password", "RollNo", "Mobile" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value = headers[i];
            ws.Cell(1, i + 1).Style.Font.Bold = true;
            ws.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.LightGray;
        }

        // Sample row
        ws.Cell(2, 1).Value = "John Doe";
        ws.Cell(2, 2).Value = "جون دو";
        ws.Cell(2, 3).Value = "john@example.com";
        ws.Cell(2, 4).Value = "Pass@1234";
        ws.Cell(2, 5).Value = "ROLL-001";
        ws.Cell(2, 6).Value = "+966500000000";

        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();

        await Task.CompletedTask; // Satisfy async signature
    }

    // ── Import Excel ───────────────────────────────────────────
    public async Task<ApiResponse<CandidateImportResultDto>> ImportCandidatesAsync(Stream fileStream, string createdBy)
    {
        var result = new CandidateImportResultDto();

        using var workbook = new XLWorkbook(fileStream);
        var ws = workbook.Worksheets.First();
        var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;

        // Read header row to map columns
        var headerRow = ws.Row(1);
        var colMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        for (int c = 1; c <= ws.LastColumnUsed()?.ColumnNumber(); c++)
        {
            var val = headerRow.Cell(c).GetString().Trim();
            if (!string.IsNullOrWhiteSpace(val))
                colMap[val] = c;
        }

        // Pre-load existing emails and roll numbers for uniqueness
        var existingEmails = await _db.Users.Where(u => !u.IsDeleted)
            .Select(u => u.NormalizedEmail).ToListAsync();
        var emailSet = new HashSet<string>(existingEmails.Where(e => e != null)!, StringComparer.OrdinalIgnoreCase);

        var existingRolls = await _db.Users.Where(u => !u.IsDeleted && u.RollNo != null)
            .Select(u => u.RollNo!).ToListAsync();
        var rollSet = new HashSet<string>(existingRolls, StringComparer.OrdinalIgnoreCase);

        // Track duplicates within the file
        var fileEmailSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var fileRollSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        // Ensure Candidate role exists
        if (!await _roleManager.RoleExistsAsync(AppRoles.Candidate))
            await _roleManager.CreateAsync(new ApplicationRole { Name = AppRoles.Candidate });

        for (int row = 2; row <= lastRow; row++)
        {
            result.TotalRows++;
            var errors = new List<string>();

            string GetCell(string col) => colMap.TryGetValue(col, out var idx)
                ? ws.Row(row).Cell(idx).GetString().Trim() : "";

            var fullName = GetCell("FullName");
            var fullNameAr = GetCell("FullNameAr");
            var email = GetCell("Email");
            var password = GetCell("Password");
            var rollNo = GetCell("RollNo");
            var mobile = GetCell("Mobile");

            // Skip completely empty rows
            if (string.IsNullOrWhiteSpace(fullName) && string.IsNullOrWhiteSpace(email))
                continue;

            // Validate required
            if (string.IsNullOrWhiteSpace(fullName)) errors.Add("FullName is required.");
            if (string.IsNullOrWhiteSpace(email)) errors.Add("Email is required.");
            else if (!Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$")) errors.Add("Invalid email format.");
            if (string.IsNullOrWhiteSpace(rollNo)) errors.Add("RollNo is required.");

            // Uniqueness
            if (!string.IsNullOrWhiteSpace(email))
            {
                if (emailSet.Contains(email) || fileEmailSet.Contains(email))
                    errors.Add("Email already exists.");
                else
                    fileEmailSet.Add(email);
            }
            if (!string.IsNullOrWhiteSpace(rollNo))
            {
                if (rollSet.Contains(rollNo) || fileRollSet.Contains(rollNo))
                    errors.Add("RollNo already exists.");
                else
                    fileRollSet.Add(rollNo);
            }

            if (errors.Count > 0)
            {
                result.SkippedCount++;
                result.Errors.Add(new CandidateImportErrorDto
                {
                    Row = row,
                    Email = email,
                    Reasons = errors
                });
                continue;
            }

            // Generate password if not provided
            var finalPassword = string.IsNullOrWhiteSpace(password) ? GeneratePassword() : password;

            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FullName = fullName,
                FullNameAr = string.IsNullOrWhiteSpace(fullNameAr) ? null : fullNameAr,
                RollNo = rollNo,
                PhoneNumber = string.IsNullOrWhiteSpace(mobile) ? null : mobile,
                DisplayName = fullName,
                Status = UserStatus.Active,
                IsBlocked = false,
                EmailConfirmed = true,
                CreatedBy = createdBy,
                CreatedDate = DateTime.UtcNow
            };

            var createResult = await _userManager.CreateAsync(user, finalPassword);
            if (!createResult.Succeeded)
            {
                result.SkippedCount++;
                result.Errors.Add(new CandidateImportErrorDto
                {
                    Row = row,
                    Email = email,
                    Reasons = createResult.Errors.Select(e => e.Description).ToList()
                });
                continue;
            }

            await _userManager.AddToRoleAsync(user, AppRoles.Candidate);
            emailSet.Add(email);
            rollSet.Add(rollNo);

            result.InsertedCount++;
            result.CreatedAccounts.Add(new CandidateImportedAccountDto
            {
                Row = row,
                FullName = fullName,
                Email = email,
                RollNo = rollNo,
                TemporaryPassword = finalPassword
            });
        }

        var message = $"Import complete: {result.InsertedCount} inserted, {result.SkippedCount} skipped.";
        return ApiResponse<CandidateImportResultDto>.SuccessResponse(result, message);
    }

    // ── Helpers ────────────────────────────────────────────────
    private static CandidateListDto MapToDto(ApplicationUser u) => new()
    {
        Id = u.Id,
        FullName = u.FullName,
        FullNameAr = u.FullNameAr,
        Email = u.Email!,
        RollNo = u.RollNo,
        Mobile = u.PhoneNumber,
        Status = u.IsBlocked ? "Blocked" : "Active",
        IsBlocked = u.IsBlocked,
        CreatedDate = u.CreatedDate,
        CreatedBy = u.CreatedBy
    };

    private static string GeneratePassword()
    {
        const string upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const string lower = "abcdefghjkmnpqrstuvwxyz";
        const string digits = "23456789";
        const string special = "@#$!";

        var bytes = new byte[12];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);

        var chars = new char[12];
        chars[0] = upper[bytes[0] % upper.Length];
        chars[1] = lower[bytes[1] % lower.Length];
        chars[2] = digits[bytes[2] % digits.Length];
        chars[3] = special[bytes[3] % special.Length];

        var all = upper + lower + digits + special;
        for (int i = 4; i < 12; i++)
            chars[i] = all[bytes[i] % all.Length];

        // Shuffle
        var random = new Random();
        for (int i = chars.Length - 1; i > 0; i--)
        {
            int j = random.Next(i + 1);
            (chars[i], chars[j]) = (chars[j], chars[i]);
        }

        return new string(chars);
    }
}
