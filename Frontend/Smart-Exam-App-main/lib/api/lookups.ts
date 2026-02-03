import { apiClient } from "@/lib/api-client"

// Types
export interface QuestionCategory {
  id: number
  nameEn: string
  nameAr: string
  createdDate?: string
  updatedDate?: string | null
  isDeleted?: boolean
}

export interface QuestionType {
  id: number
  nameEn: string
  nameAr: string
  createdDate?: string
  updatedDate?: string | null
  isDeleted?: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage?: boolean
  hasNextPage?: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  errors: string[]
}

// Question Categories API
export async function getQuestionCategories(params?: {
  search?: string
  includeDeleted?: boolean
  pageNumber?: number
  pageSize?: number
}): Promise<PaginatedResponse<QuestionCategory>> {
  const queryParams = new URLSearchParams()
  if (params?.search) queryParams.append("search", params.search)
  if (params?.includeDeleted) queryParams.append("includeDeleted", "true")
  queryParams.append("pageNumber", String(params?.pageNumber || 1))
  queryParams.append("pageSize", String(params?.pageSize || 100))

  const result = await apiClient.get<PaginatedResponse<QuestionCategory>>(
    `/Lookups/question-categories?${queryParams.toString()}`,
  )

  return result
}

export async function getQuestionCategoryById(id: number): Promise<QuestionCategory | null> {
  const result = await apiClient.get<QuestionCategory>(`/Lookups/question-categories/${id}`)
  return result
}

export async function createQuestionCategory(data: {
  nameEn: string
  nameAr: string
}): Promise<QuestionCategory> {
  const result = await apiClient.post<QuestionCategory>("/Lookups/question-categories", data)
  return result
}

export async function updateQuestionCategory(
  id: number,
  data: { nameEn: string; nameAr: string },
): Promise<QuestionCategory> {
  const result = await apiClient.put<QuestionCategory>(`/Lookups/question-categories/${id}`, data)
  return result
}

export async function deleteQuestionCategory(id: number): Promise<boolean> {
  await apiClient.delete(`/Lookups/question-categories/${id}`)
  return true
}

// Question Types API
export async function getQuestionTypes(params?: {
  search?: string
  includeDeleted?: boolean
  pageNumber?: number
  pageSize?: number
}): Promise<PaginatedResponse<QuestionType>> {
  const queryParams = new URLSearchParams()
  if (params?.search) queryParams.append("search", params.search)
  if (params?.includeDeleted) queryParams.append("includeDeleted", "true")
  queryParams.append("pageNumber", String(params?.pageNumber || 1))
  queryParams.append("pageSize", String(params?.pageSize || 100))

  const result = await apiClient.get<PaginatedResponse<QuestionType>>(
    `/Lookups/question-types?${queryParams.toString()}`,
  )

  return result
}

export async function getQuestionTypeById(id: number): Promise<QuestionType | null> {
  const result = await apiClient.get<QuestionType>(`/Lookups/question-types/${id}`)
  return result
}

export async function createQuestionType(data: {
  nameEn: string
  nameAr: string
}): Promise<QuestionType> {
  const result = await apiClient.post<QuestionType>("/Lookups/question-types", data)
  return result
}

export async function updateQuestionType(id: number, data: { nameEn: string; nameAr: string }): Promise<QuestionType> {
  const result = await apiClient.put<QuestionType>(`/Lookups/question-types/${id}`, data)
  return result
}

export async function deleteQuestionType(id: number): Promise<boolean> {
  await apiClient.delete(`/Lookups/question-types/${id}`)
  return true
}
