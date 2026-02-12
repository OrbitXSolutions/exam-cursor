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

    console.log(
      `[API Request] ${options.method || "GET"} ${url}`,
      options.body ? JSON.parse(options.body as string) : "",
      token ? "(with auth token)" : "(no auth token)",
    );

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const jsonResponse = await response.json().catch(() => ({}));

      console.log(`[API Response] ${options.method || "GET"} ${url}`, {
        status: response.status,
        ok: response.ok,
        data: jsonResponse,
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          throw new Error("Session expired. Please login again.");
        }

        const errors = jsonResponse.errors;
        const errorsStr = Array.isArray(errors)
          ? errors.join(", ")
          : typeof errors === "string"
            ? errors
            : errors && typeof errors === "object"
              ? Object.values(errors).flat().filter(Boolean).join(", ")
              : "";
        const errorMessage =
          jsonResponse.message || errorsStr || `HTTP Error: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Handle wrapped response { success, data, message }
      if (jsonResponse.success !== undefined) {
        if (!jsonResponse.success) {
          throw new Error(jsonResponse.message || "Operation failed");
        }
        return jsonResponse.data !== undefined
          ? jsonResponse.data
          : jsonResponse;
      }

      // Return raw response
      return jsonResponse.data !== undefined ? jsonResponse.data : jsonResponse;
    } catch (error) {
      console.error(`[API Error] ${options.method || "GET"} ${url}`, error);

      if (
        mockData !== undefined &&
        error instanceof TypeError &&
        (error as Error).message === "Failed to fetch"
      ) {
        console.warn(
          `[API Fallback] Network error - Using mock data for ${endpoint}`,
        );
        return mockData;
      }

      throw error;
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

    console.log(`[API Upload] POST ${url}`, {
      fileName: file.name,
      size: file.size,
      type: file.type,
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[API Upload Error] POST ${url}`, errorData);
        throw new Error(errorData.message || "Upload failed");
      }

      const jsonResponse = await response.json();
      console.log(`[API Upload Response] POST ${url}`, jsonResponse);
      return jsonResponse.data !== undefined ? jsonResponse.data : jsonResponse;
    } catch (error) {
      console.error(`[API Upload Error] POST ${url}`, error);
      throw error;
    }
  }
}

// Media upload result type
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
