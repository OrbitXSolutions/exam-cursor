import { apiClient } from "@/lib/api-client"

export interface CertificateDto {
  id: number
  certificateCode: string
  resultId: number
  examId: number
  attemptId: number
  examTitleEn: string
  examTitleAr: string
  candidateNameEn: string | null
  candidateNameAr: string | null
  score: number
  maxScore: number
  passScore: number
  issuedAt: string
  isRevoked: boolean
  downloadUrl: string
}

export interface CertificateVerification {
  isValid: boolean
  message: string
  certificateCode?: string
  examTitle?: string
  candidateName?: string
  score?: number
  maxScore?: number
  issuedAt?: string
}

export async function getMyCertificates(): Promise<CertificateDto[]> {
  const response = await apiClient.get<CertificateDto[]>("/Certificate/my-certificates")
  return response || []
}

export async function getCertificateByResult(resultId: number): Promise<CertificateDto | null> {
  try {
    return await apiClient.get<CertificateDto>(`/Certificate/by-result/${resultId}`)
  } catch {
    return null
  }
}

export async function verifyCertificate(code: string): Promise<CertificateVerification> {
  const response = await apiClient.get<CertificateVerification>(`/Certificate/verify/${encodeURIComponent(code)}`)
  return response || { isValid: false, message: "Verification failed" }
}
