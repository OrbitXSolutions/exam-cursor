// API request parameter types

import type {
  DifficultyLevel,
  AttemptStatus,
  GradingStatus,
  ProctorMode,
  ProctorEventType,
  Severity,
  ProctorDecisionStatus,
  IncidentSource,
  IncidentSeverity,
  IncidentStatus,
  IncidentOutcome,
  ExportFormat,
} from "./index";

// ============ QUESTION BANK ============
export interface GetQuestionsParams {
  search?: string;
  questionTypeId?: number;
  questionCategoryId?: number;
  difficultyLevel?: DifficultyLevel;
  isActive?: boolean;
  includeDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateQuestionRequest {
  bodyEn: string;
  bodyAr: string;
  questionTypeId: number;
  questionCategoryId?: number | null;
  subjectId: number;
  topicId?: number;
  points: number;
  difficultyLevel: DifficultyLevel;
  isActive: boolean;
  options: {
    textEn: string;
    textAr: string;
    isCorrect: boolean;
    order: number;
    attachmentPath?: string | null;
  }[];
}

export interface UpdateQuestionRequest {
  bodyEn: string;
  bodyAr: string;
  questionTypeId: number;
  questionCategoryId: number;
  subjectId: number;
  topicId?: number;
  points: number;
  difficultyLevel: DifficultyLevel;
  isActive: boolean;
}

// ============ EXAM ============
export interface GetExamsParams {
  search?: string;
  isPublished?: boolean;
  isActive?: boolean;
  startDateFrom?: string;
  startDateTo?: string;
  includeDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateExamRequest {
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  startAt?: string | null;
  endAt?: string | null;
  durationMinutes: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  passScore: number;
  isActive: boolean;
}

export interface CreateSectionRequest {
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  order: number;
  durationMinutes?: number | null;
  totalPointsOverride?: number | null;
}

export interface AddQuestionToSectionRequest {
  questionId: number;
  order: number;
  pointsOverride?: number | null;
  isRequired: boolean;
}

export interface BulkAddQuestionsRequest {
  questionIds: number[];
  useOriginalPoints: boolean;
  markAsRequired: boolean;
}

export interface SaveAccessPolicyRequest {
  isPublic: boolean;
  accessCode?: string | null;
  restrictToAssignedCandidates: boolean;
}

// ============ ATTEMPT ============
export interface StartAttemptRequest {
  examId: number;
  accessCode?: string;
}

export interface SaveAnswerRequest {
  questionId: number;
  selectedOptionIds?: number[] | null;
  textAnswer?: string | null;
}

export interface BulkSaveAnswersRequest {
  answers: SaveAnswerRequest[];
}

export interface LogEventRequest {
  eventType: number;
  metadataJson?: string;
}

export interface GetAttemptsParams {
  examId?: number;
  candidateId?: string;
  status?: AttemptStatus;
  startedFrom?: string;
  startedTo?: string;
  isPassed?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

// ============ GRADING ============
export interface GetGradingSessionsParams {
  examId?: number;
  candidateId?: string;
  status?: GradingStatus;
  isPassed?: boolean;
  requiresManualGrading?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface ManualGradeRequest {
  gradingSessionId: number;
  questionId: number;
  score: number;
  isCorrect: boolean;
  graderComment?: string;
}

export interface BulkManualGradeRequest {
  gradingSessionId: number;
  grades: {
    questionId: number;
    score: number;
    isCorrect: boolean;
    graderComment?: string;
  }[];
}

export interface RegradeRequest {
  gradingSessionId: number;
  questionId: number;
  newScore: number;
  isCorrect: boolean;
  comment?: string;
  reason?: string;
}

// ============ EXAM RESULT ============
export interface GetResultsParams {
  examId?: number;
  candidateId?: string;
  isPassed?: boolean;
  isPublished?: boolean;
  finalizedFrom?: string;
  finalizedTo?: string;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface ExportResultsRequest {
  examId: number;
  format: ExportFormat;
  fromDate?: string;
  toDate?: string;
  passedOnly?: boolean;
  failedOnly?: boolean;
}

// ============ PROCTOR ============
export interface CreateProctorSessionRequest {
  attemptId: number;
  mode: ProctorMode;
  deviceFingerprint: string;
  userAgent: string;
  browserName: string;
  browserVersion: string;
  operatingSystem: string;
  screenResolution: string;
}

export interface LogProctorEventRequest {
  proctorSessionId: number;
  eventType: ProctorEventType;
  severity: Severity;
  metadataJson?: string;
  clientTimestamp?: string;
}

export interface BulkLogProctorEventsRequest {
  proctorSessionId: number;
  events: {
    eventType: ProctorEventType;
    severity: Severity;
    metadataJson?: string;
    clientTimestamp?: string;
  }[];
}

export interface HeartbeatRequest {
  proctorSessionId: number;
  clientTimestamp: string;
  metadataJson?: string;
}

export interface CreateRiskRuleRequest {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  isActive: boolean;
  eventType: ProctorEventType;
  thresholdCount: number;
  windowSeconds: number;
  riskPoints: number;
  minSeverity: Severity;
  maxTriggers: number;
  priority: number;
}

export interface RequestEvidenceUploadRequest {
  proctorSessionId: number;
  type: number;
  fileName: string;
  contentType: string;
  startAt?: string;
  endAt?: string;
  durationSeconds?: number;
  metadataJson?: string;
}

export interface MakeDecisionRequest {
  proctorSessionId: number;
  status: ProctorDecisionStatus;
  decisionReasonEn: string;
  decisionReasonAr: string;
  internalNotes?: string;
  finalize: boolean;
}

export interface GetProctorSessionsParams {
  examId?: number;
  candidateId?: string;
  mode?: ProctorMode;
  status?: number;
  decisionStatus?: ProctorDecisionStatus;
  requiresReview?: boolean;
  minRiskScore?: number;
  startedFrom?: string;
  startedTo?: string;
  pageNumber?: number;
  pageSize?: number;
}

// ============ INCIDENT ============
export interface CreateIncidentRequest {
  attemptId: number;
  proctorSessionId?: number;
  source: IncidentSource;
  severity: IncidentSeverity;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  summaryAr: string;
}

export interface GetIncidentsParams {
  examId?: number;
  candidateId?: string;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  source?: IncidentSource;
  outcome?: IncidentOutcome;
  assignedTo?: string;
  unassigned?: boolean;
  createdFrom?: string;
  createdTo?: string;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface RecordIncidentDecisionRequest {
  caseId: number;
  outcome: IncidentOutcome;
  reasonEn: string;
  reasonAr: string;
  internalNotes?: string;
  closeCase: boolean;
}

export interface SubmitAppealRequest {
  incidentCaseId: number;
  message: string;
  supportingInfo?: string;
}

export interface ReviewAppealRequest {
  appealId: number;
  decision: number;
  decisionNoteEn: string;
  decisionNoteAr: string;
  internalNotes?: string;
  newOutcome?: IncidentOutcome;
}

// ============ AUDIT ============
export interface GetAuditLogsParams {
  actorId?: string;
  actorType?: string;
  action?: string;
  actionPrefix?: string;
  entityName?: string;
  entityId?: string;
  correlationId?: string;
  tenantId?: string;
  source?: string;
  channel?: string;
  outcome?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}
