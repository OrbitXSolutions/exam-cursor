// Question Bank API functions - connects to real backend
import { apiClient, type PaginatedResponse } from "@/lib/api-client"
import type { Question, QuestionOption, QuestionAttachment } from "@/lib/types"
import type { GetQuestionsParams, CreateQuestionRequest, UpdateQuestionRequest } from "@/lib/types/api-params"

// Build query string from params
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value))
    }
  })
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ""
}

// Questions
export async function getQuestions(params: GetQuestionsParams = {}): Promise<PaginatedResponse<Question>> {
  const queryString = buildQueryString({ pageSize: 100, ...params })
  const result = await apiClient.get<PaginatedResponse<Question>>(`/QuestionBank/questions${queryString}`)
  return result
}

export async function getQuestionById(id: number): Promise<Question> {
  return await apiClient.get<Question>(`/QuestionBank/questions/${id}`)
}

export async function createQuestion(data: CreateQuestionRequest): Promise<Question> {
  return apiClient.post<Question>("/QuestionBank/questions", data)
}

export async function updateQuestion(id: number, data: UpdateQuestionRequest): Promise<Question> {
  return apiClient.put<Question>(`/QuestionBank/questions/${id}`, data)
}

export async function deleteQuestion(id: number): Promise<boolean> {
  await apiClient.delete(`/QuestionBank/questions/${id}`)
  return true
}

export async function toggleQuestionStatus(id: number): Promise<boolean> {
  await apiClient.patch(`/QuestionBank/questions/${id}/toggle-status`)
  return true
}

// Question Options
export async function getQuestionOptions(questionId: number): Promise<QuestionOption[]> {
  return apiClient.get<QuestionOption[]>(`/QuestionBank/questions/${questionId}/options`)
}

export async function addQuestionOption(
  questionId: number,
  data: Omit<QuestionOption, "id" | "questionId" | "createdDate">,
): Promise<QuestionOption> {
  return apiClient.post<QuestionOption>(`/QuestionBank/questions/${questionId}/options`, data)
}

export async function updateQuestionOption(optionId: number, data: Partial<QuestionOption>): Promise<QuestionOption> {
  return apiClient.put<QuestionOption>(`/QuestionBank/options/${optionId}`, data)
}

export async function deleteQuestionOption(optionId: number): Promise<boolean> {
  await apiClient.delete(`/QuestionBank/options/${optionId}`)
  return true
}

// Question Attachments
export async function getQuestionAttachments(questionId: number): Promise<QuestionAttachment[]> {
  return apiClient.get<QuestionAttachment[]>(`/QuestionBank/questions/${questionId}/attachments`)
}

export async function addQuestionAttachment(
  questionId: number,
  data: Omit<QuestionAttachment, "id" | "questionId" | "createdDate">,
): Promise<QuestionAttachment> {
  return apiClient.post<QuestionAttachment>(`/QuestionBank/questions/${questionId}/attachments`, data)
}

export async function deleteQuestionAttachment(attachmentId: number): Promise<boolean> {
  await apiClient.delete(`/QuestionBank/attachments/${attachmentId}`)
  return true
}

// Re-export lookup functions for backward compatibility
export { getQuestionCategories, getQuestionTypes } from "./lookups"
