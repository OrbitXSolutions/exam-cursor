import {
  getResolvedLanguage,
  translateServerMessage,
} from "@/lib/i18n/runtime";
import { getCorrelationId, getSafePath, logRequest } from "@/lib/safe-logging";

const API_BASE_URL = "/api/proxy";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  private getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token");
    }
    return null;
  }

  setToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  clearToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  private normalizeEndpoint(endpoint: string): string {
    return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    mockData?: T,
  ): Promise<T> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    const token = this.getToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const startedAt = Date.now();
    let status: number | undefined;
    let correlationId: string | undefined;
    let failed = false;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      status = response.status;
      correlationId = getCorrelationId(response.headers);

      const jsonResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        const language = getResolvedLanguage();

        if (response.status === 401) {
          this.clearToken();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          throw new Error(
            translateServerMessage(
              "Session expired. Please login again.",
              language,
            ),
          );
        }

        // Handle license enforcement 403
        if (response.status === 403) {
          const licenseState = response.headers.get("X-License-State");
          const bodyMsg: string = jsonResponse.message || "";
          const isLicenseExpired =
            licenseState === "Expired" ||
            bodyMsg.toLowerCase().includes("license expired") ||
            bodyMsg.toLowerCase().includes("read-only mode");

          if (isLicenseExpired) {
            // Broadcast globally so any mounted dialog can react
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("licenseExpired"));
            }
            throw new Error(
              language === "ar"
                ? "انتهت صلاحية الرخصة. النظام في وضع القراءة فقط. يرجى التواصل مع المسؤول لتجديد الرخصة."
                : "License expired. System is in read-only mode. Please contact your administrator to renew the license.",
            );
          }

          // Permission-denied 403 (not license-related)
          throw new Error(
            language === "ar"
              ? "ليس لديك صلاحية للقيام بهذا الإجراء."
              : "You do not have permission to perform this action.",
          );
        }

        const errors = jsonResponse.errors;
        const errorsStr = Array.isArray(errors)
          ? errors.join("\n- ")
          : typeof errors === "string"
            ? errors
            : errors && typeof errors === "object"
              ? Object.values(errors).flat().filter(Boolean).join("\n- ")
              : "";

        const traceId = jsonResponse.traceId || "";
        const baseMessage =
          jsonResponse.message && errorsStr
            ? `${jsonResponse.message}\n\n- ${errorsStr}`
            : jsonResponse.message ||
              errorsStr ||
              `HTTP Error: ${response.status}`;

        const errorMessage = traceId
          ? `${baseMessage} (Ref: ${traceId})`
          : baseMessage;

        throw new Error(translateServerMessage(errorMessage, language));
      }

      if (jsonResponse.success !== undefined) {
        if (!jsonResponse.success) {
          throw new Error(
            translateServerMessage(
              jsonResponse.message || "Operation failed",
              getResolvedLanguage(),
            ),
          );
        }

        return jsonResponse.data !== undefined
          ? jsonResponse.data
          : jsonResponse;
      }

      return jsonResponse.data !== undefined ? jsonResponse.data : jsonResponse;
    } catch (error) {
      failed = true;

      if (
        mockData !== undefined &&
        error instanceof TypeError &&
        (error as Error).message === "Failed to fetch"
      ) {
        console.warn(
          "[API] Network fallback used",
          { path: getSafePath(url) },
        );
        return mockData;
      }

      throw error;
    } finally {
      logRequest("API", options.method || "GET", url, startedAt, status, correlationId, failed);
    }
  }

  async get<T>(endpoint: string, mockData?: T): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" }, mockData);
  }

  async post<T>(endpoint: string, data?: unknown, mockData?: T): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
      },
      mockData,
    );
  }

  async put<T>(endpoint: string, data?: unknown, mockData?: T): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
      },
      mockData,
    );
  }

  async patch<T>(endpoint: string, data?: unknown, mockData?: T): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: "PATCH",
        body: data ? JSON.stringify(data) : undefined,
      },
      mockData,
    );
  }

  async delete<T>(endpoint: string, mockData?: T): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" }, mockData);
  }

  async uploadFile(
    endpoint: string,
    file: File,
    folder?: string,
  ): Promise<MediaUploadResult> {
    const formData = new FormData();
    formData.append("file", file);

    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const url = folder
      ? `${this.baseUrl}${normalizedEndpoint}?folder=${folder}`
      : `${this.baseUrl}${normalizedEndpoint}`;

    const token = this.getToken();

    const startedAt = Date.now();
    let status: number | undefined;
    let correlationId: string | undefined;
    let failed = false;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });
      status = response.status;
      correlationId = getCorrelationId(response.headers);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          translateServerMessage(
            errorData.message || "Upload failed",
            getResolvedLanguage(),
          ),
        );
      }

      const jsonResponse = await response.json();
      return jsonResponse.data !== undefined ? jsonResponse.data : jsonResponse;
    } catch (error) {
      failed = true;
      throw error;
    } finally {
      logRequest("API Upload", "POST", url, startedAt, status, correlationId, failed);
    }
  }
}

interface MediaUploadResult {
  id: string;
  originalFileName: string;
  storedFileName: string;
  extension: string;
  contentType: string;
  sizeInBytes: number;
  sizeFormatted: string;
  mediaType: string;
  storageProvider: string;
  path: string;
  url: string;
  folder: string;
  createdDate: string;
}

export const apiClient = new ApiClient(API_BASE_URL);
export type { ApiResponse, PaginatedResponse, MediaUploadResult };
