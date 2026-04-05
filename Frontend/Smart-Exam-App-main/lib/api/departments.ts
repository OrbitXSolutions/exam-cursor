import { apiClient } from "@/lib/api-client";

// Types
export interface Department {
  id: number;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  code?: string | null;
  isActive: boolean;
  userCount: number;
  createdDate?: string;
  createdBy?: string | null;
}

export interface DepartmentListItem {
  id: number;
  nameEn: string;
  nameAr: string;
  code?: string | null;
  isActive: boolean;
  userCount: number;
}

export interface CreateDepartmentRequest {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  code?: string;
  isActive?: boolean;
}

export interface UpdateDepartmentRequest {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  code?: string;
  isActive: boolean;
}

export interface DepartmentPaginatedResponse {
  items: DepartmentListItem[];
  totalCount: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

// Departments API
export async function getDepartments(params?: {
  includeInactive?: boolean;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<DepartmentPaginatedResponse> {
  const queryParams = new URLSearchParams();
  if (params?.includeInactive) queryParams.append("includeInactive", "true");
  if (params?.search) queryParams.append("search", params.search);
  if (params?.pageNumber)
    queryParams.append("pageNumber", String(params.pageNumber));
  if (params?.pageSize) queryParams.append("pageSize", String(params.pageSize));
  const result = await apiClient.get<DepartmentPaginatedResponse>(
    `/Departments?${queryParams.toString()}`,
  );
  return result;
}

export async function getDepartmentById(id: number): Promise<Department> {
  const result = await apiClient.get<Department>(`/Departments/${id}`);
  return result;
}

export async function createDepartment(
  data: CreateDepartmentRequest,
): Promise<Department> {
  const result = await apiClient.post<Department>("/Departments", data);
  return result;
}

export async function updateDepartment(
  id: number,
  data: UpdateDepartmentRequest,
): Promise<Department> {
  const result = await apiClient.put<Department>(`/Departments/${id}`, data);
  return result;
}

export async function deleteDepartment(id: number): Promise<boolean> {
  await apiClient.delete(`/Departments/${id}`);
  return true;
}

export async function activateDepartment(id: number): Promise<Department> {
  const result = await apiClient.post<Department>(
    `/Departments/${id}/activate`,
  );
  return result;
}

export async function deactivateDepartment(id: number): Promise<Department> {
  const result = await apiClient.post<Department>(
    `/Departments/${id}/deactivate`,
  );
  return result;
}
