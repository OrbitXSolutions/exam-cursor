import { apiClient } from "@/lib/api-client"

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExamDetailsCandidateDto {
  candidateId: string
  fullName: string
  fullNameAr?: string
  rollNo?: string
  email: string
  mobile?: string
  isBlocked: boolean
  status: string
}

export interface ExamDetailsExamDto {
  examId: number
  titleEn: string
  titleAr?: string
  isPublished: boolean
  isActive: boolean
  durationMinutes: number
  passScore: number
  requireProctoring: boolean
  maxAttempts: number
}

export interface ExamDetailsAttemptDto {
  attemptId: number
  attemptNumber: number
  status: number
  statusName: string
  startedAt: string
  submittedAt?: string
  expiresAt?: string
  totalDurationSeconds: number
  remainingSeconds: number
  extraTimeSeconds: number
  resumeCount: number
  lastActivityAt?: string
  totalScore?: number
  isPassed?: boolean
  forceSubmittedBy?: string
  forceSubmittedAt?: string
  ipAddress?: string
  deviceInfo?: string
  totalQuestions: number
  answeredQuestions: number
}

export interface ExamDetailsAssignmentDto {
  scheduleFrom?: string
  scheduleTo?: string
  assignedAt: string
  assignedBy?: string
  isActive: boolean
}

export interface ExamDetailsEvidenceItemDto {
  id: number
  typeName: string
  fileName: string
  contentType?: string
  fileSize: number
  capturedAt?: string
  durationSeconds?: number
  isUploaded: boolean
}

export interface ExamDetailsProctorDto {
  sessionId: number
  modeName: string
  statusName: string
  totalEvents: number
  totalViolations: number
  riskScore?: number
  riskLevel: string
  lastHeartbeatAt?: string
  decisionStatus?: string
  decisionNotes?: string
  video?: ExamDetailsEvidenceItemDto
  screenshots: ExamDetailsEvidenceItemDto[]
  totalScreenshots: number
}

export interface ExamDetailsEventDto {
  id: number
  attemptId: number
  eventType: number
  eventTypeName: string
  metadataJson?: string
  occurredAt: string
  questionTextEn?: string
  questionTextAr?: string
  answerSummary?: string
}

export interface ExamDetailsAttemptBriefDto {
  attemptId: number
  attemptNumber: number
  status: number
  statusName: string
  startedAt: string
  submittedAt?: string
  totalScore?: number
  isPassed?: boolean
}

export interface ExamDetailsResultInfoDto {
  resultId?: number
  isFinalized: boolean
  isPublished: boolean
  gradingSessionId?: number
  certificateId?: number
}

export interface CandidateExamDetailsDto {
  candidate: ExamDetailsCandidateDto
  exam: ExamDetailsExamDto
  attemptSummary?: ExamDetailsAttemptDto
  assignment?: ExamDetailsAssignmentDto
  proctor?: ExamDetailsProctorDto
  eventLogs: ExamDetailsEventDto[]
  attemptsList: ExamDetailsAttemptBriefDto[]
  hasAttempts: boolean
  canForceEnd: boolean
  canResume: boolean
  canAddTime: boolean
  resultInfo?: ExamDetailsResultInfoDto
}

export interface CandidateExamBriefDto {
  examId: number
  titleEn: string
  titleAr?: string
  totalAttempts: number
  lastAttemptAt: string
}

// ── API Functions ────────────────────────────────────────────────────────────

export async function getCandidateExamDetails(params: {
  candidateId: string
  examId: number
  attemptId?: number
  screenshotLimit?: number
}): Promise<CandidateExamDetailsDto> {
  const query = new URLSearchParams()
  query.set("candidateId", params.candidateId)
  query.set("examId", params.examId.toString())
  if (params.attemptId) query.set("attemptId", params.attemptId.toString())
  if (params.screenshotLimit) query.set("screenshotLimit", params.screenshotLimit.toString())

  return await apiClient.get<CandidateExamDetailsDto>(`/candidate-exam-details?${query}`)
}

export async function getCandidateExams(candidateId: string): Promise<CandidateExamBriefDto[]> {
  const result = await apiClient.get<CandidateExamBriefDto[]>(
    `/candidate-exam-details/candidate-exams?candidateId=${encodeURIComponent(candidateId)}`
  )
  return result ?? []
}
