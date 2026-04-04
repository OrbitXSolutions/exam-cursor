import { apiClient } from "@/lib/api-client";

export interface LicenseStatusResult {
  state: string;
  stateText: string;
  daysRemaining: number | null;
  gracePeriodDays: number | null;
  graceDaysRemaining: number | null;
  customerName: string | null;
  licenseType: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  maxUsers: number | null;
  licensedDomain: string | null;
  message: string;
}

export async function getLicenseStatus(): Promise<LicenseStatusResult> {
  return apiClient.get<LicenseStatusResult>("/License/status");
}

export async function uploadLicense(file: File): Promise<LicenseStatusResult> {
  return apiClient.uploadFile(
    "/License/upload",
    file,
  ) as Promise<LicenseStatusResult>;
}
