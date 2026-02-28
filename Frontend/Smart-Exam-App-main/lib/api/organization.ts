import { apiClient } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────

export interface OrganizationSettingsDto {
  id: number;
  name: string;
  logoPath?: string | null;
  faviconPath?: string | null;
  supportEmail?: string | null;
  mobileNumber?: string | null;
  officeNumber?: string | null;
  supportUrl?: string | null;
  footerText?: string | null;
  primaryColor?: string | null;
  isActive: boolean;
  createdDate: string;
  updatedDate?: string | null;
}

export interface UpdateOrganizationDto {
  name?: string;
  supportEmail?: string | null;
  mobileNumber?: string | null;
  officeNumber?: string | null;
  supportUrl?: string | null;
  footerText?: string | null;
  primaryColor?: string | null;
  isActive: boolean;
}

export interface OrganizationUploadResult {
  type: string;
  path: string;
}

export interface PublicBrandingDto {
  name: string;
  logoUrl: string;
  faviconUrl: string;
  footerText: string;
  supportEmail: string;
  supportUrl: string;
  mobileNumber: string;
  officeNumber: string;
  primaryColor: string;
  isActive: boolean;
}

// ─── API Functions ────────────────────────────────────────────────────

export async function getOrganizationSettings(): Promise<OrganizationSettingsDto> {
  return apiClient.get<OrganizationSettingsDto>("/Organization");
}

export async function updateOrganizationSettings(
  data: UpdateOrganizationDto,
): Promise<OrganizationSettingsDto> {
  return apiClient.put<OrganizationSettingsDto>("/Organization", data);
}

export async function uploadOrganizationImage(
  type: "logo" | "favicon",
  file: File,
): Promise<OrganizationUploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const response = await fetch(`/api/proxy/Organization/upload/${type}`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to upload ${type}`);
  }

  const json = await response.json();
  return json.data !== undefined ? json.data : json;
}

export async function getPublicBranding(): Promise<PublicBrandingDto> {
  return apiClient.get<PublicBrandingDto>("/Organization/branding");
}
