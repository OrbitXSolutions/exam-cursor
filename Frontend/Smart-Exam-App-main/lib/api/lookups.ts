import { apiClient } from "@/lib/api-client";

// Types
export interface QuestionCategory {
  id: number;
  nameEn: string;
  nameAr: string;
  createdDate?: string;
  updatedDate?: string | null;
  isDeleted?: boolean;
}

export interface QuestionType {
  id: number;
  nameEn: string;
  nameAr: string;
  createdDate?: string;
  updatedDate?: string | null;
  isDeleted?: boolean;
}

export interface QuestionSubject {
  id: number;
  nameEn: string;
  nameAr: string;
  topicsCount?: number;
  createdDate?: string;
  updatedDate?: string | null;
  isDeleted?: boolean;
}

export interface QuestionTopic {
  id: number;
  nameEn: string;
  nameAr: string;
  subjectId: number;
  subjectNameEn?: string;
  subjectNameAr?: string;
  createdDate?: string;
  updatedDate?: string | null;
  isDeleted?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors: string[];
}

// Question Categories API
export async function getQuestionCategories(params?: {
  search?: string;
  includeDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<QuestionCategory>> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.includeDeleted) queryParams.append("includeDeleted", "true");
  queryParams.append("pageNumber", String(params?.pageNumber || 1));
  queryParams.append("pageSize", String(params?.pageSize || 100));

  const result = await apiClient.get<PaginatedResponse<QuestionCategory>>(
    `/Lookups/question-categories?${queryParams.toString()}`,
  );

  return result;
}

export async function getQuestionCategoryById(
  id: number,
): Promise<QuestionCategory | null> {
  const result = await apiClient.get<QuestionCategory>(
    `/Lookups/question-categories/${id}`,
  );
  return result;
}

export async function createQuestionCategory(data: {
  nameEn: string;
  nameAr: string;
}): Promise<QuestionCategory> {
  const result = await apiClient.post<QuestionCategory>(
    "/Lookups/question-categories",
    data,
  );
  return result;
}

export async function updateQuestionCategory(
  id: number,
  data: { nameEn: string; nameAr: string },
): Promise<QuestionCategory> {
  const result = await apiClient.put<QuestionCategory>(
    `/Lookups/question-categories/${id}`,
    data,
  );
  return result;
}

export async function deleteQuestionCategory(id: number): Promise<boolean> {
  await apiClient.delete(`/Lookups/question-categories/${id}`);
  return true;
}

// Question Types API
export async function getQuestionTypes(params?: {
  search?: string;
  includeDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<QuestionType>> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.includeDeleted) queryParams.append("includeDeleted", "true");
  queryParams.append("pageNumber", String(params?.pageNumber || 1));
  queryParams.append("pageSize", String(params?.pageSize || 100));

  const result = await apiClient.get<PaginatedResponse<QuestionType>>(
    `/Lookups/question-types?${queryParams.toString()}`,
  );

  return result;
}

export async function getQuestionTypeById(
  id: number,
): Promise<QuestionType | null> {
  const result = await apiClient.get<QuestionType>(
    `/Lookups/question-types/${id}`,
  );
  return result;
}

export async function createQuestionType(data: {
  nameEn: string;
  nameAr: string;
}): Promise<QuestionType> {
  const result = await apiClient.post<QuestionType>(
    "/Lookups/question-types",
    data,
  );
  return result;
}

export async function updateQuestionType(
  id: number,
  data: { nameEn: string; nameAr: string },
): Promise<QuestionType> {
  const result = await apiClient.put<QuestionType>(
    `/Lookups/question-types/${id}`,
    data,
  );
  return result;
}

export async function deleteQuestionType(id: number): Promise<boolean> {
  await apiClient.delete(`/Lookups/question-types/${id}`);
  return true;
}
// Question Subjects API
export async function getQuestionSubjects(params?: {
  search?: string;
  includeDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<QuestionSubject>> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.includeDeleted) queryParams.append("includeDeleted", "true");
  queryParams.append("pageNumber", String(params?.pageNumber || 1));
  queryParams.append("pageSize", String(params?.pageSize || 100));

  const result = await apiClient.get<PaginatedResponse<QuestionSubject>>(
    `/Lookups/question-subjects?${queryParams.toString()}`,
  );

  return result;
}

export async function getQuestionSubjectById(
  id: number,
): Promise<QuestionSubject | null> {
  const result = await apiClient.get<QuestionSubject>(
    `/Lookups/question-subjects/${id}`,
  );
  return result;
}

export async function createQuestionSubject(data: {
  nameEn: string;
  nameAr: string;
}): Promise<QuestionSubject> {
  const result = await apiClient.post<QuestionSubject>(
    "/Lookups/question-subjects",
    data,
  );
  return result;
}

export async function updateQuestionSubject(
  id: number,
  data: { nameEn: string; nameAr: string },
): Promise<QuestionSubject> {
  const result = await apiClient.put<QuestionSubject>(
    `/Lookups/question-subjects/${id}`,
    data,
  );
  return result;
}

export async function deleteQuestionSubject(id: number): Promise<boolean> {
  await apiClient.delete(`/Lookups/question-subjects/${id}`);
  return true;
}

// Question Topics API
export async function getQuestionTopics(params?: {
  search?: string;
  subjectId?: number;
  includeDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<QuestionTopic>> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.subjectId)
    queryParams.append("subjectId", String(params.subjectId));
  if (params?.includeDeleted) queryParams.append("includeDeleted", "true");
  queryParams.append("pageNumber", String(params?.pageNumber || 1));
  queryParams.append("pageSize", String(params?.pageSize || 100));

  const result = await apiClient.get<PaginatedResponse<QuestionTopic>>(
    `/Lookups/question-topics?${queryParams.toString()}`,
  );

  return result;
}

export async function getQuestionTopicById(
  id: number,
): Promise<QuestionTopic | null> {
  const result = await apiClient.get<QuestionTopic>(
    `/Lookups/question-topics/${id}`,
  );
  return result;
}

export async function createQuestionTopic(data: {
  nameEn: string;
  nameAr: string;
  subjectId: number;
}): Promise<QuestionTopic> {
  const result = await apiClient.post<QuestionTopic>(
    "/Lookups/question-topics",
    data,
  );
  return result;
}

export async function updateQuestionTopic(
  id: number,
  data: { nameEn: string; nameAr: string; subjectId: number },
): Promise<QuestionTopic> {
  const result = await apiClient.put<QuestionTopic>(
    `/Lookups/question-topics/${id}`,
    data,
  );
  return result;
}

export async function deleteQuestionTopic(id: number): Promise<boolean> {
  await apiClient.delete(`/Lookups/question-topics/${id}`);
  return true;
}
