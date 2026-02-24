import { apiClient } from "@/lib/api-client";
import type { User, AuditLog } from "@/lib/types";

// Backend UserDto shape (camelCase from API)
interface UserDto {
  id: string;
  email: string;
  displayName?: string;
  fullName?: string;
  isBlocked: boolean;
  status: string;
  emailConfirmed: boolean;
  roles: string[];
  createdDate: string;
  departmentId?: number | null;
  departmentNameEn?: string;
  departmentNameAr?: string;
}

function mapUserDtoToUser(dto: UserDto): User {
  const name = dto.fullName ?? dto.displayName ?? "";
  return {
    id: dto.id,
    email: dto.email,
    fullNameEn: name,
    fullNameAr: name,
    role: dto.roles?.[0] ?? "",
    isActive: !dto.isBlocked && dto.status !== "Inactive",
    createdDate: dto.createdDate,
    departmentId: dto.departmentId ?? null,
    departmentNameEn: dto.departmentNameEn ?? "",
    departmentNameAr: dto.departmentNameAr ?? "",
  };
}

// User Management - real API: GET /Users, GET /Users/{id}, PUT /Users/{id}, DELETE /Users/{id}
export async function getUsers(params?: {
  search?: string;
  role?: string;
  isActive?: boolean;
  departmentId?: number;
  page?: number;
  pageSize?: number;
}): Promise<{ items: User[]; totalCount: number }> {
  try {
    const query = new URLSearchParams();
    query.set("PageNumber", String(params?.page ?? 1));
    query.set("PageSize", String(params?.pageSize ?? 50));
    if (params?.search) query.set("Search", params.search);
    if (params?.role && params.role !== "all") query.set("Role", params.role);
    if (params?.departmentId)
      query.set("DepartmentId", String(params.departmentId));
    const raw = await apiClient.get<{ items?: UserDto[]; totalCount?: number }>(
      `/Users?${query}`,
    );
    const items = raw?.items ?? [];
    const totalCount = raw?.totalCount ?? items.length;
    return { items: items.map(mapUserDtoToUser), totalCount };
  } catch {
    return { items: [], totalCount: 0 };
  }
}

export async function getUserById(id: string): Promise<User> {
  const raw = await apiClient.get<UserDto>(`/Users/${id}`);
  return mapUserDtoToUser(raw);
}

// Backend has no CreateUser in UsersController; create returns 404 - keep for UI but call register or skip
export async function createUser(data: {
  email: string;
  fullNameEn: string;
  fullNameAr: string;
  role: string;
  password: string;
  departmentId?: number | null;
}): Promise<User> {
  // If backend adds POST /Users, use it. For now throw so UI shows error.
  throw new Error(
    "Create user is not available. Use backend seed or admin panel.",
  );
}

export async function updateUser(
  id: string,
  data: {
    fullNameEn?: string;
    fullNameAr?: string;
    role?: string;
    isActive?: boolean;
  },
): Promise<User> {
  const body: { fullName?: string; displayName?: string } = {};
  if (data.fullNameEn != null) body.fullName = data.fullNameEn;
  if (data.fullNameAr != null) body.displayName = data.fullNameAr;
  const raw = await apiClient.put<UserDto>(`/Users/${id}`, body);
  return mapUserDtoToUser(raw);
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/Users/${id}`);
}

export async function resetUserPassword(
  id: string,
): Promise<{ temporaryPassword: string }> {
  // Backend may not have this endpoint - throw or call if exists
  throw new Error("Password reset not available via API.");
}

// Audit Logs - real API: GET /Audit/logs
interface AuditLogListDto {
  id: number;
  actorDisplayName?: string;
  actorType?: number;
  action: string;
  entityName: string;
  entityId: string;
  outcomeName?: string;
  source?: number;
  channel?: number;
  occurredAt: string;
  beforeJson?: string;
  afterJson?: string;
  metadataJson?: string;
}

const ACTOR_TYPE_MAP: Record<number, string> = {
  1: "User",
  2: "System",
  3: "Service",
};
const SOURCE_MAP: Record<number, string> = {
  1: "Api",
  2: "BackgroundJob",
  3: "Scheduler",
  4: "MessageHandler",
  5: "DatabaseTrigger",
};
const CHANNEL_MAP: Record<number, string> = {
  1: "Web",
  2: "Mobile",
  3: "AdminPortal",
  4: "ApiClient",
  5: "Internal",
};

export async function getAuditLogs(params?: {
  actorId?: string;
  action?: string;
  entityName?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: AuditLog[]; totalCount: number }> {
  try {
    const query = new URLSearchParams();
    query.set("PageNumber", String(params?.page ?? 1));
    query.set("PageSize", String(params?.pageSize ?? 50));
    if (params?.action && params.action !== "all")
      query.set("Action", params.action);
    if (params?.entityName && params.entityName !== "all")
      query.set("EntityName", params.entityName);
    if (params?.actorId) query.set("ActorId", params.actorId);
    if (params?.startDate) query.set("OccurredFrom", params.startDate);
    if (params?.endDate) query.set("OccurredTo", params.endDate);
    const raw = await apiClient.get<{
      items?: AuditLogListDto[];
      totalCount?: number;
    }>(`/Audit/logs?${query}`);
    const items = raw?.items ?? [];
    const totalCount = raw?.totalCount ?? items.length;
    const mapped: AuditLog[] = items.map((log) => ({
      id: log.id,
      actorId: "",
      actorName: log.actorDisplayName ?? "",
      actorType: ACTOR_TYPE_MAP[log.actorType ?? 1] ?? "User",
      action: log.action,
      entityName: log.entityName,
      entityId: log.entityId,
      correlationId: null,
      tenantId: null,
      source: SOURCE_MAP[log.source ?? 1] ?? "Api",
      channel: CHANNEL_MAP[log.channel ?? 1] ?? "Web",
      outcome: log.outcomeName ?? "Success",
      ipAddress: null,
      userAgent: null,
      timestamp: log.occurredAt,
      details: log.metadataJson ?? log.beforeJson ?? log.afterJson ?? null,
    }));
    return { items: mapped, totalCount };
  } catch {
    return { items: [], totalCount: 0 };
  }
}

// System Settings (includes Brand Info for white-label exam system)
export interface BrandSettings {
  logoUrl: string;
  brandName: string;
  footerText: string;
  supportEmail: string;
  supportUrl: string;
  primaryColor: string;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  allowRegistration: boolean;
  defaultProctorMode: string;
  maxFileUploadMb: number;
  sessionTimeoutMinutes: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  enableLiveVideo: boolean;
  enableVideoRecording: boolean;
  enableSmartMonitoring: boolean;
  brand?: BrandSettings;
}

const defaultBrand: BrandSettings = {
  logoUrl: "",
  brandName: "SmartExam",
  footerText: "© SmartExam. All rights reserved.",
  supportEmail: "",
  supportUrl: "",
  primaryColor: "#0d9488",
};

const defaultSettings: SystemSettings = {
  maintenanceMode: false,
  allowRegistration: true,
  defaultProctorMode: "Soft",
  maxFileUploadMb: 10,
  sessionTimeoutMinutes: 120,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },
  enableLiveVideo: true,
  enableVideoRecording: true,
  enableSmartMonitoring: true,
  brand: defaultBrand,
};

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const data = await apiClient.get<SystemSettings>("/Settings");
    return {
      ...defaultSettings,
      ...data,
      brand: { ...defaultBrand, ...data?.brand },
    };
  } catch {
    return defaultSettings;
  }
}

export async function updateSystemSettings(
  settings: Partial<SystemSettings>,
): Promise<SystemSettings> {
  try {
    const data = await apiClient.put<SystemSettings>("/Settings", {
      ...defaultSettings,
      ...settings,
    });
    return {
      ...defaultSettings,
      ...data,
      brand: { ...defaultBrand, ...data?.brand },
    };
  } catch {
    return { ...defaultSettings, ...settings };
  }
}

// Departments list for dropdowns / filters
export interface DepartmentListItem {
  id: number;
  nameEn: string;
  nameAr: string;
  code?: string;
  isActive: boolean;
  userCount: number;
}

export async function getDepartmentsList(): Promise<DepartmentListItem[]> {
  try {
    const raw = await apiClient.get<DepartmentListItem[]>(
      "/Departments?includeInactive=false",
    );
    return raw ?? [];
  } catch {
    return [];
  }
}

// ============ Roles API ============
export interface RoleListItem {
  id: string;
  name: string;
  description?: string;
  userCount: number;
}

export async function getRolesList(): Promise<RoleListItem[]> {
  try {
    const raw = await apiClient.get<RoleListItem[]>("/Roles");
    return raw ?? [];
  } catch {
    return [];
  }
}

export async function addUserToRole(
  userId: string,
  roleName: string,
): Promise<void> {
  await apiClient.post("/Roles/add-user", { userId, roleName });
}

export async function removeUserFromRole(
  userId: string,
  roleName: string,
): Promise<void> {
  await apiClient.post("/Roles/remove-user", { userId, roleName });
}

// ============ Department Assignment API ============
export async function assignUserToDepartment(
  userId: string,
  departmentId: number,
): Promise<void> {
  await apiClient.post("/Departments/assign-user", { userId, departmentId });
}

export async function removeUserFromDepartment(userId: string): Promise<void> {
  await apiClient.post(`/Departments/remove-user/${userId}`, {});
}
