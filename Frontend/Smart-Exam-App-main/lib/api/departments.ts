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

// Departments API
export async function getDepartments(
  includeInactive = false,
): Promise<DepartmentListItem[]> {
  const queryParams = new URLSearchParams();
  if (includeInactive) queryParams.append("includeInactive", "true");
  const result = await apiClient.get<DepartmentListItem[]>(
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
