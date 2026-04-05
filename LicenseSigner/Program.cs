using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace LicenseSigner;

public class LicenseData
{
    public string CustomerName { get; set; } = string.Empty;
    public string LicenseType { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int GracePeriodDays { get; set; }
    public int MaxUsers { get; set; }
    public string LicensedDomain { get; set; } = string.Empty;

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string[]? Features { get; set; }

    public string Signature { get; set; } = string.Empty;
}

class Program
{
    static void Main(string[] args)
    {
        Console.OutputEncoding = Encoding.UTF8;

        if (args.Length == 0)
        {
            PrintUsage();
            return;
        }

        switch (args[0].ToLower())
        {
            case "generate-keys":
                GenerateKeys();
                break;
            case "sign-license":
                SignLicense();
                break;
            case "verify-license":
                VerifyLicense(args.Length > 1 ? args[1] : "license.json");
                break;
            default:
                PrintUsage();
                break;
        }
    }

    static void PrintUsage()
    {
        Console.WriteLine("╔══════════════════════════════════════════════════╗");
        Console.WriteLine("║       Smart Exam License Signer Tool            ║");
        Console.WriteLine("╚══════════════════════════════════════════════════╝");
        Console.WriteLine();
        Console.WriteLine("Usage:");
        Console.WriteLine("  LicenseSigner generate-keys                  Generate RSA keypair");
        Console.WriteLine("  LicenseSigner sign-license                   Sign a new license (interactive, explicit dates)");
        Console.WriteLine("  LicenseSigner verify-license [license.json]  Verify a license file");
        Console.WriteLine();
    }

    // ─── 1. Generate RSA Keypair ───────────────────────────────────────

    static void GenerateKeys()
    {
        using var rsa = RSA.Create(2048);

        var privateKey = rsa.ExportRSAPrivateKeyPem();
        var publicKey = rsa.ExportRSAPublicKeyPem();

        File.WriteAllText("private.pem", privateKey);
        File.WriteAllText("public.pem", publicKey);

        Console.WriteLine("✅ RSA-2048 keypair generated successfully.");
        Console.WriteLine("   private.pem — KEEP SECRET (vendor only, NEVER deploy)");
        Console.WriteLine("   public.pem  — Copy this to Backend-API/License/public.pem");
        Console.WriteLine();
    }

    // ─── 2. Sign License (Interactive) ─────────────────────────────────

    static void SignLicense()
    {
        if (!File.Exists("private.pem"))
        {
            Console.WriteLine("❌ private.pem not found. Run 'generate-keys' first.");
            return;
        }

        Console.WriteLine("═══ License Signing ═══");
        Console.WriteLine();

        Console.Write("Customer Name: ");
        var customerName = Console.ReadLine()?.Trim() ?? "";

        Console.Write("License Type (e.g., Standard, Enterprise, Trial): ");
        var licenseType = Console.ReadLine()?.Trim() ?? "Standard";

        Console.Write("Licensed Domain (e.g., exams.client.com): ");
        var domain = Console.ReadLine()?.Trim() ?? "";

        Console.Write("Max Users (0 = unlimited): ");
        int.TryParse(Console.ReadLine()?.Trim(), out var maxUsers);

        Console.Write("Grace Period Days (default 30): ");
        var graceInput = Console.ReadLine()?.Trim();
        var gracePeriodDays = string.IsNullOrEmpty(graceInput) ? 30 : int.Parse(graceInput);

        Console.Write("Issued Date (YYYY-MM-DD, blank = today UTC): ");
        var issuedInput = Console.ReadLine()?.Trim();
        var issuedAt = string.IsNullOrEmpty(issuedInput)
            ? DateTime.UtcNow
            : DateTime.SpecifyKind(DateTime.ParseExact(issuedInput, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture), DateTimeKind.Utc);

        Console.Write("Expiry Date (YYYY-MM-DD): ");
        var expiryInput = Console.ReadLine()?.Trim();
        var expiresAt = DateTime.SpecifyKind(DateTime.ParseExact(expiryInput!, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture), DateTimeKind.Utc);

        var license = new LicenseData
        {
            CustomerName = customerName,
            LicenseType = licenseType,
            IssuedAt = issuedAt,
            ExpiresAt = expiresAt,
            GracePeriodDays = gracePeriodDays,
            MaxUsers = maxUsers,
            LicensedDomain = domain.ToLowerInvariant(),
            Features = null
        };

        // Build canonical payload (same logic as backend)
        var canonicalPayload = BuildCanonicalPayload(license);

        // Sign with RSA-SHA256
        var privateKeyPem = File.ReadAllText("private.pem");
        using var rsa = RSA.Create();
        rsa.ImportFromPem(privateKeyPem.ToCharArray());

        var payloadBytes = Encoding.UTF8.GetBytes(canonicalPayload);
        var signatureBytes = rsa.SignData(payloadBytes, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        license.Signature = Convert.ToBase64String(signatureBytes);

        // Output license.json
        var options = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
        var json = JsonSerializer.Serialize(license, options);

        var outputFile = $"license_{customerName.Replace(" ", "_")}_{DateTime.UtcNow:yyyyMMdd}.json";
        File.WriteAllText(outputFile, json);
        File.WriteAllText("license.json", json);

        Console.WriteLine();
        Console.WriteLine($"✅ License signed successfully!");
        Console.WriteLine($"   Output: {outputFile} (and license.json)");
        Console.WriteLine($"   Customer: {customerName}");
        Console.WriteLine($"   Domain: {domain}");
        Console.WriteLine($"   Type: {licenseType}");
        Console.WriteLine($"   Valid: {license.IssuedAt:yyyy-MM-dd} → {license.ExpiresAt:yyyy-MM-dd}");
        Console.WriteLine($"   Grace Period: {gracePeriodDays} days");
        Console.WriteLine($"   Max Users: {(maxUsers == 0 ? "Unlimited" : maxUsers.ToString())}");
        Console.WriteLine();
        Console.WriteLine("   Copy license.json + public.pem → Backend-API/License/");
        Console.WriteLine();
    }

    // ─── 3. Verify License ─────────────────────────────────────────────

    static void VerifyLicense(string path)
    {
        if (!File.Exists(path))
        {
            Console.WriteLine($"❌ License file not found: {path}");
            return;
        }

        if (!File.Exists("public.pem"))
        {
            Console.WriteLine("❌ public.pem not found in current directory.");
            return;
        }

        var json = File.ReadAllText(path);
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var license = JsonSerializer.Deserialize<LicenseData>(json, options);

        if (license == null)
        {
            Console.WriteLine("❌ Failed to parse license file.");
            return;
        }

        Console.WriteLine("═══ License Verification ═══");
        Console.WriteLine();
        Console.WriteLine($"  Customer:      {license.CustomerName}");
        Console.WriteLine($"  Type:          {license.LicenseType}");
        Console.WriteLine($"  Domain:        {license.LicensedDomain}");
        Console.WriteLine($"  Issued:        {license.IssuedAt:yyyy-MM-dd HH:mm:ss} UTC");
        Console.WriteLine($"  Expires:       {license.ExpiresAt:yyyy-MM-dd HH:mm:ss} UTC");
        Console.WriteLine($"  Grace Period:  {license.GracePeriodDays} days");
        Console.WriteLine($"  Max Users:     {(license.MaxUsers == 0 ? "Unlimited" : license.MaxUsers.ToString())}");
        Console.WriteLine();

        // Verify signature
        var canonicalPayload = BuildCanonicalPayload(license);
        var payloadBytes = Encoding.UTF8.GetBytes(canonicalPayload);
        var signatureBytes = Convert.FromBase64String(license.Signature);

        var publicKeyPem = File.ReadAllText("public.pem");
        using var rsa = RSA.Create();
        rsa.ImportFromPem(publicKeyPem.ToCharArray());

        var isValid = rsa.VerifyData(payloadBytes, signatureBytes, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);

        if (isValid)
        {
            Console.WriteLine("  ✅ Signature: VALID");

            var daysRemaining = (license.ExpiresAt.ToUniversalTime() - DateTime.UtcNow).TotalDays;
            if (daysRemaining < -(license.GracePeriodDays))
                Console.WriteLine($"  ⛔ Status: EXPIRED (grace period ended)");
            else if (daysRemaining < 0)
                Console.WriteLine($"  ⚠️  Status: GRACE PERIOD ({license.GracePeriodDays + (int)daysRemaining} days remaining)");
            else if (daysRemaining <= 40)
                Console.WriteLine($"  ⚠️  Status: WARNING (expires in {(int)Math.Ceiling(daysRemaining)} days)");
            else
                Console.WriteLine($"  ✅ Status: ACTIVE ({(int)Math.Ceiling(daysRemaining)} days remaining)");
        }
        else
        {
            Console.WriteLine("  ❌ Signature: INVALID — license has been tampered with!");
        }

        Console.WriteLine();
    }

    // ─── Canonical Payload (same as backend) ───────────────────────────

    static string BuildCanonicalPayload(LicenseData license)
    {
        var features = license.Features != null && license.Features.Length > 0
            ? string.Join(",", license.Features.OrderBy(f => f, StringComparer.OrdinalIgnoreCase))
            : "";

        return string.Join("|",
            $"CustomerName={license.CustomerName}",
            $"LicenseType={license.LicenseType}",
            $"IssuedAt={license.IssuedAt.ToUniversalTime():yyyy-MM-ddTHH:mm:ssZ}",
            $"ExpiresAt={license.ExpiresAt.ToUniversalTime():yyyy-MM-ddTHH:mm:ssZ}",
            $"GracePeriodDays={license.GracePeriodDays}",
            $"MaxUsers={license.MaxUsers}",
            $"LicensedDomain={license.LicensedDomain.ToLowerInvariant()}",
            $"Features={features}"
        );
    }
}
