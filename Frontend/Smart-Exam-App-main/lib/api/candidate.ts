import { apiClient } from "@/lib/api-client"

// ============================================
// ENUMS
// ============================================

export enum AttemptStatus {
  Started = 0,
  InProgress = 1,
  Submitted = 2,
  Expired = 3,
  Cancelled = 4
}

export enum ExamType {
  Flex = 0,
  Fixed = 1
}

// Must match backend AttemptEventType enum values
export enum AttemptEventType {
  Started = 1,
  AnswerSaved = 2,
  Navigated = 3,
  TabSwitched = 4,
  FullscreenExited = 5,
  Submitted = 6,
  TimedOut = 7,
  WindowBlur = 8,
  WindowFocus = 9,
  CopyAttempt = 10,
  PasteAttempt = 11,
  RightClickAttempt = 12
}

// ============================================
// INTERFACES - Dashboard
// ============================================

export interface CandidateDashboard {
  candidateName: string
  candidateEmail: string
  currentDateUtc: string
  stats: DashboardStats
  examsByStatus: ExamsByStatus
  quickActions: QuickAction[]
  upcomingExams: UpcomingExam[]
  recentActivity: RecentActivity[]
}

export interface DashboardStats {
  totalExamsAvailable: number
  totalExamsAvailableChangePercent: number
  totalAttempts: number
  totalAttemptsChangePercent: number
  passRate: number
  pendingGrading: number
}

export interface ExamsByStatus {
  upcomingCount: number
  activeCount: number
  completedCount: number
}

export interface QuickAction {
  attemptId: number
  examId: number
  examTitleEn: string
  examTitleAr: string
  actionType: string // "Resume"
  expiresAt: string
  remainingMinutes: number
}

export interface UpcomingExam {
  examId: number
  titleEn: string
  titleAr: string
  examType: ExamType
  startAt: string
  endAt: string
  durationMinutes: number
  totalQuestions: number
  totalPoints: number
  attemptsUsed: number
  maxAttempts: number
}

export interface RecentActivity {
  activityType: string // "Attempt Started" | "Attempt Submitted" | "Result Published"
  examId: number
  examTitleEn: string
  examTitleAr: string
  attemptId: number
  activityDate: string
  description: string
  score: number | null
  isPassed: boolean | null
}

// ============================================
// INTERFACES - Exams
// ============================================

export interface CandidateExam {
  id: number
  examType: ExamType
  titleEn: string
  titleAr: string
  descriptionEn: string | null
  descriptionAr: string | null
  startAt: string | null
  endAt: string | null
  durationMinutes: number
  maxAttempts: number
  passScore: number
  totalQuestions: number
  totalPoints: number
  myAttempts: number | null
  myBestIsPassed: boolean | null
}

export interface ExamPreview {
  examId: number
  examType: ExamType
  titleEn: string
  titleAr: string
  descriptionEn: string | null
  descriptionAr: string | null
  startAt: string | null
  endAt: string | null
  durationMinutes: number
  maxAttempts: number
  totalQuestions: number
  totalPoints: number
  passScore: number
  instructions: ExamInstructionDto[]
  accessPolicy: AccessPolicy
  eligibility: Eligibility
}

export interface AccessPolicy {
  requiresAccessCode: boolean
  requireProctoring: boolean
  requireIdVerification: boolean
  requireWebcam: boolean
  preventCopyPaste: boolean
  preventScreenCapture: boolean
  requireFullscreen: boolean
  browserLockdown: boolean
}

export interface Eligibility {
  canStartNow: boolean
  reasons: string[]
  attemptsUsed: number
  attemptsRemaining: number
}

export interface ExamInstructionDto {
  order: number
  contentEn: string
  contentAr: string
}

// ============================================
// INTERFACES - Attempt & Session
// ============================================

export interface StartExamRequest {
  accessCode?: string
}

// Exam Settings for controlling navigation and shuffling
export interface ExamSettings {
  shuffleQuestions: boolean
  shuffleOptions: boolean
  lockPreviousSections: boolean
  preventBackNavigation: boolean
}

// Section structure for tab-based exam layout
export interface ExamSection {
  sectionId: number
  order: number
  titleEn: string
  titleAr: string
  descriptionEn?: string | null
  descriptionAr?: string | null
  durationMinutes?: number | null
  remainingSeconds?: number | null
  sectionStartedAtUtc?: string | null
  sectionExpiresAtUtc?: string | null
  totalPoints: number
  totalQuestions: number
  answeredQuestions: number
  topics: ExamTopic[]
  questions: AttemptQuestionDto[]
}

// Topic structure for grouping questions within a section
export interface ExamTopic {
  topicId: number
  order: number
  titleEn: string
  titleAr: string
  descriptionEn?: string | null
  descriptionAr?: string | null
  totalPoints: number
  totalQuestions: number
  answeredQuestions: number
  questions: AttemptQuestionDto[]
}

export interface AttemptSession {
  attemptId: number
  examId: number
  examTitleEn: string
  examTitleAr: string
  startedAtUtc: string
  expiresAtUtc: string
  remainingSeconds: number
  status: AttemptStatus
  attemptNumber: number
  maxAttempts: number
  totalQuestions: number
  answeredQuestions: number
  examSettings?: ExamSettings
  sections?: ExamSection[]
  questions: AttemptQuestionDto[]
  instructions: ExamInstructionDto[]
}

export interface AttemptQuestionDto {
  attemptQuestionId: number
  questionId: number
  order: number
  points: number
  bodyEn: string
  bodyAr: string
  questionTypeName: string
  questionTypeId: number
  sectionId?: number | null
  topicId?: number | null
  options: AttemptQuestionOptionDto[]
  attachments: AttemptQuestionAttachmentDto[]
  currentAnswer: AttemptAnswerDto | null
}

export interface AttemptQuestionOptionDto {
  id: number
  textEn: string
  textAr: string
  order: number
  attachmentPath: string | null
}

export interface AttemptQuestionAttachmentDto {
  id: number
  fileName: string
  filePath: string
  fileType: string
}

export interface AttemptAnswerDto {
  questionId: number
  selectedOptionIds: number[] | null
  textAnswer: string | null
}

// ============================================
// INTERFACES - Answers
// ============================================

export interface SaveAnswerRequest {
  questionId: number
  selectedOptionIds?: number[] | null
  textAnswer?: string | null
}

export interface BulkSaveAnswersRequest {
  answers: SaveAnswerRequest[]
}

// ============================================
// INTERFACES - Submit
// ============================================

export interface SubmitResult {
  resultId: number
  examId: number
  examTitleEn: string
  examTitleAr: string
  attemptNumber: number
  submittedAt: string
  totalScore: number | null
  maxPossibleScore: number | null
  percentage: number | null
  isPassed: boolean | null
  gradeLabel: string | null
  allowReview: boolean
  showCorrectAnswers: boolean
}

// ============================================
// INTERFACES - Results
// ============================================

export interface CandidateResult {
  resultId: number
  examId: number
  examTitleEn: string
  examTitleAr: string
  attemptNumber: number
  submittedAt: string
  totalScore: number | null
  maxPossibleScore: number | null
  percentage: number | null
  isPassed: boolean | null
  gradeLabel: string | null
  allowReview: boolean
  showCorrectAnswers: boolean
}

export interface CandidateResultReview extends CandidateResult {
  questions: ReviewQuestionDto[]
}

export interface ReviewQuestionDto {
  questionId: number
  order: number
  bodyEn: string
  bodyAr: string
  questionTypeName: string
  points: number
  scoreEarned: number
  selectedOptionIds: number[]
  textAnswer: string | null
  options: ReviewOptionDto[]
  isCorrect: boolean | null
  feedback: string | null
}

export interface ReviewOptionDto {
  id: number
  textEn: string
  textAr: string
  wasSelected: boolean
  isCorrect: boolean | null
}

// New Interface for CandidateResultDto
export interface CandidateResultDto {
  resultId: number
  attemptId: number
  examId: number
  examTitleEn: string
  examTitleAr: string
  attemptNumber: number
  attemptStartedAt: string
  attemptSubmittedAt: string
  finalizedAt: string
  totalScore: number | null
  maxPossibleScore: number | null
  percentage: number | null
  passScore: number
  isPassed: boolean | null
  gradeLabel: string | null
  showCorrectAnswers: boolean
  allowReview: boolean
}

// ============================================
// API FUNCTIONS - Dashboard (Single Request)
// ============================================

/**
 * Get complete dashboard data in a single request
 * This is the recommended way to load the dashboard
 */
export async function getCandidateDashboard(): Promise<CandidateDashboard> {
  console.log("[v0] Fetching candidate dashboard...")
  const response = await apiClient.get<CandidateDashboard>("/Candidate/dashboard")
  console.log("[v0] Dashboard loaded:", response)
  return response
}

/**
 * Alias for getCandidateDashboard (used by my-exams page for quickActions)
 */
export async function getDashboard(): Promise<CandidateDashboard> {
  return getCandidateDashboard()
}

// ============================================
// API FUNCTIONS - Exams
// ============================================

/**
 * Get all available exams for the candidate.
 * Handles both wrapped { data: CandidateExam[] } and raw array from API.
 */
export async function getAvailableExams(): Promise<CandidateExam[]> {
  console.log("[v0] Fetching available exams...")
  const response = await apiClient.get<CandidateExam[] | { data?: CandidateExam[] }>("/Candidate/exams")
  const items = Array.isArray(response) ? response : (response?.data ?? [])
  if (!Array.isArray(items)) return []
  console.log("[v0] Available exams loaded:", items.length)
  return items
}

/**
 * Get exam preview with eligibility check
 */
export async function getExamPreview(examId: number): Promise<ExamPreview> {
  console.log("[v0] Fetching exam preview for:", examId)
  const response = await apiClient.get<ExamPreview>(`/Candidate/exams/${examId}/preview`)
  console.log("[v0] Exam preview loaded:", response)
  return response
}

// ============================================
// API FUNCTIONS - Start & Resume
// ============================================

/**
 * Start a new exam attempt or resume existing
 */
export async function startExam(examId: number, request?: StartExamRequest): Promise<AttemptSession> {
  console.log("[v0] Starting exam:", examId)
  const response = await apiClient.post<AttemptSession>(`/Candidate/exams/${examId}/start`, request || {})
  console.log("[v0] Exam started, attemptId:", response.attemptId)
  return response
}

/**
 * Get attempt session for resuming
 */
export async function getAttemptSession(attemptId: number): Promise<AttemptSession> {
  console.log("[v0] Getting attempt session:", attemptId)
  const response = await apiClient.get<AttemptSession>(`/Candidate/attempts/${attemptId}/session`)
  console.log("[v0] Session loaded, questions:", response.totalQuestions)
  return response
}

// ============================================
// API FUNCTIONS - Answers
// ============================================

/**
 * Save answers (bulk) - recommended approach
 */
export async function saveAnswers(attemptId: number, request: BulkSaveAnswersRequest): Promise<boolean> {
  console.log("[v0] Saving answers for attempt:", attemptId, "count:", request.answers.length)
  const response = await apiClient.put<boolean>(`/Candidate/attempts/${attemptId}/answers`, request)
  console.log("[v0] Answers saved:", response)
  return response
}

// ============================================
// API FUNCTIONS - Submit
// ============================================

/**
 * Submit attempt - final submission, cannot be undone
 */
export async function submitAttempt(attemptId: number): Promise<SubmitResult> {
  console.log("[v0] Submitting attempt:", attemptId)
  const response = await apiClient.post<SubmitResult>(`/Candidate/attempts/${attemptId}/submit`, {})
  console.log("[v0] Attempt submitted:", response)
  return response
}

// ============================================
// API FUNCTIONS - Results
// ============================================

/**
 * Get my result for a specific attempt
 */
export async function getMyResult(attemptId: number): Promise<CandidateResult> {
  console.log("[v0] Getting result for attempt:", attemptId)
  const response = await apiClient.get<CandidateResult>(`/Candidate/results/my-result/${attemptId}`)
  console.log("[v0] Result loaded:", response)
  return response
}

/**
 * Get detailed result review (if allowed)
 */
export async function getMyResultReview(attemptId: number): Promise<CandidateResultReview> {
  console.log("[v0] Getting result review for attempt:", attemptId)
  const response = await apiClient.get<CandidateResultReview>(`/Candidate/results/my-result/${attemptId}/review`)
  console.log("[v0] Result review loaded")
  return response
}

/**
 * Get all my results (history).
 * Backend: GET /ExamResult/my-results (candidate's published results).
 */
export async function getMyResults(): Promise<CandidateResultDto[]> {
  try {
    console.log("[v0] Getting all my results")
    const response = await apiClient.get<CandidateResultDto[] | { data?: CandidateResultDto[] }>(
      "/ExamResult/my-results"
    )
    const items = Array.isArray(response) ? response : response?.data ?? []
    console.log("[v0] Results loaded:", items?.length ?? 0)
    return Array.isArray(items) ? items : []
  } catch (err) {
    console.warn("[v0] getMyResults failed:", err)
    return []
  }
}

// ============================================
// BACKWARD COMPATIBILITY ALIASES
// These are aliases for old function names that may still be used in the codebase
// ============================================

export interface StartAttemptRequest {
  examId: number
  accessCode?: string
}

export interface LogAttemptEventRequest {
  eventType: AttemptEventType
  metadataJson?: string
}

export interface AttemptTimerDto {
  attemptId: number
  serverTime: string
  expiresAt: string
  remainingSeconds: number
  status: AttemptStatus
  isExpired: boolean
}

/**
 * @deprecated Use startExam instead
 */
export async function startAttempt(request: StartAttemptRequest): Promise<AttemptSession> {
  return startExam(request.examId, { accessCode: request.accessCode })
}

/**
 * @deprecated Use saveAnswers instead
 */
export async function saveAnswer(attemptId: number, answer: SaveAnswerRequest): Promise<boolean> {
  return saveAnswers(attemptId, { answers: [answer] })
}

/**
 * Log attempt event (for proctoring - tab switch, blur, copy/paste, etc.)
 */
export async function logAttemptEvent(attemptId: number, event: LogAttemptEventRequest): Promise<boolean> {
  try {
    await apiClient.post(`/Attempt/${attemptId}/events`, {
      eventType: event.eventType,
      metadataJson: event.metadataJson,
    })
    return true
  } catch (err) {
    console.warn("[v0] Failed to log attempt event:", err)
    return false
  }
}

/**
 * Get attempt timer status
 * Note: This may not be supported in the new API - kept for backward compat
 */
export async function getAttemptTimer(attemptId: number): Promise<AttemptTimerDto> {
  // Get session to sync timer
  const session = await getAttemptSession(attemptId)
  return {
    attemptId: session.attemptId,
    serverTime: new Date().toISOString(),
    expiresAt: session.expiresAtUtc,
    remainingSeconds: session.remainingSeconds,
    status: session.status,
    isExpired: session.remainingSeconds <= 0
  }
}

// ============================================
// MOCK DATA (kept for development/testing)
// ============================================

export const MOCK_DASHBOARD: CandidateDashboard = {
  candidateName: "Ali Mahmoud",
  candidateEmail: "ali@example.com",
  currentDateUtc: new Date().toISOString(),
  stats: {
    totalExamsAvailable: 12,
    totalExamsAvailableChangePercent: 12,
    totalAttempts: 156,
    totalAttemptsChangePercent: 8,
    passRate: 72.5,
    pendingGrading: 8
  },
  examsByStatus: {
    upcomingCount: 5,
    activeCount: 2,
    completedCount: 10
  },
  quickActions: [
    {
      attemptId: 42,
      examId: 5,
      examTitleEn: "Physics Midterm",
      examTitleAr: "اختبار الفيزياء النصفي",
      actionType: "Resume",
      expiresAt: new Date(Date.now() + 1000 * 60 * 85).toISOString(),
      remainingMinutes: 85
    }
  ],
  upcomingExams: [
    {
      examId: 8,
      titleEn: "Chemistry Final",
      titleAr: "اختبار الكيمياء النهائي",
      examType: ExamType.Flex,
      startAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
      endAt: new Date(Date.now() + 1000 * 60 * 60 * 52).toISOString(),
      durationMinutes: 120,
      totalQuestions: 40,
      totalPoints: 80,
      attemptsUsed: 0,
      maxAttempts: 3
    }
  ],
  recentActivity: [
    {
      activityType: "Result Published",
      examId: 3,
      examTitleEn: "Mathematics Quiz",
      examTitleAr: "اختبار الرياضيات",
      attemptId: 35,
      activityDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      description: "Passed",
      score: 85,
      isPassed: true
    },
    {
      activityType: "Attempt Submitted",
      examId: 4,
      examTitleEn: "English Exam",
      examTitleAr: "اختبار اللغة الإنجليزية",
      attemptId: 40,
      activityDate: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      description: "Attempt #2 submitted",
      score: null,
      isPassed: null
    }
  ]
}

export const MOCK_AVAILABLE_EXAMS: CandidateExam[] = [
  {
    id: 1,
    examType: ExamType.Flex,
    titleEn: "Mathematics Final Exam",
    titleAr: "اختبار الرياضيات النهائي",
    descriptionEn: "Comprehensive math exam covering all topics",
    descriptionAr: "اختبار رياضيات شامل يغطي جميع المواضيع",
    startAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    endAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    durationMinutes: 120,
    maxAttempts: 2,
    passScore: 70,
    totalQuestions: 50,
    totalPoints: 100,
    myAttempts: 0,
    myBestIsPassed: null
  },
  {
    id: 2,
    examType: ExamType.Flex,
    titleEn: "Physics Midterm",
    titleAr: "اختبار الفيزياء النصفي",
    descriptionEn: "Physics midterm examination",
    descriptionAr: "اختبار الفيزياء النصفي",
    startAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    endAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    durationMinutes: 90,
    maxAttempts: 1,
    passScore: 60,
    totalQuestions: 30,
    totalPoints: 60,
    myAttempts: 1,
    myBestIsPassed: false
  }
]

export const MOCK_MY_RESULTS: CandidateResultDto[] = [
  {
    resultId: 1,
    attemptId: 101,
    examId: 1,
    examTitleEn: "IT Fundamentals Certification Exam",
    examTitleAr: "اختبار شهادة أساسيات تكنولوجيا المعلومات",
    attemptNumber: 1,
    attemptStartedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    attemptSubmittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5 + 1000 * 60 * 45).toISOString(),
    finalizedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    totalScore: 85,
    maxPossibleScore: 100,
    percentage: 85,
    passScore: 70,
    isPassed: true,
    gradeLabel: "A",
    showCorrectAnswers: true,
    allowReview: true
  },
  {
    resultId: 2,
    attemptId: 102,
    examId: 2,
    examTitleEn: "Physics Midterm",
    examTitleAr: "اختبار الفيزياء النصفي",
    attemptNumber: 1,
    attemptStartedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    attemptSubmittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 60).toISOString(),
    finalizedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    totalScore: 55,
    maxPossibleScore: 80,
    percentage: 68.75,
    passScore: 70,
    isPassed: false,
    gradeLabel: "C",
    showCorrectAnswers: false,
    allowReview: true
  }
]

export const MOCK_EXAM_PREVIEW: ExamPreview = {
  examId: 1,
  examType: ExamType.Flex,
  titleEn: "Mathematics Final Exam",
  titleAr: "اختبار الرياضيات النهائي",
  descriptionEn: "Comprehensive math exam covering all topics",
  descriptionAr: "اختبار رياضيات شامل",
  startAt: new Date(Date.now()).toISOString(),
  endAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  durationMinutes: 120,
  maxAttempts: 3,
  totalQuestions: 50,
  totalPoints: 100,
  passScore: 70,
  instructions: [
    { order: 1, contentEn: "Read all questions carefully before answering", contentAr: "اقرأ جميع الأسئلة بعناية قبل الإجابة" },
    { order: 2, contentEn: "You cannot return to previous sections once completed", contentAr: "لا يمكنك العودة إلى الأقسام السابقة بعد إكمالها" },
    { order: 3, contentEn: "The passing score is 70%", contentAr: "درجة النجاح هي 70%" }
  ],
  accessPolicy: {
    requiresAccessCode: false,
    requireProctoring: true,
    requireIdVerification: true,
    requireWebcam: true,
    preventCopyPaste: true,
    preventScreenCapture: false,
    requireFullscreen: true,
    browserLockdown: false
  },
  eligibility: {
    canStartNow: true,
    reasons: [],
    attemptsUsed: 1,
    attemptsRemaining: 2
  }
}
