// Core types matching backend contracts exactly

// ============ ENUMS ============
export enum UserRole {
  Candidate = "Candidate",
  Instructor = "Instructor",
  Admin = "Admin",
  SuperAdmin = "SuperAdmin",
  ProctorReviewer = "ProctorReviewer",
  Auditor = "Auditor",
}

export enum DifficultyLevel {
  Easy = 1,
  Medium = 2,
  Hard = 3,
}

export enum AttemptStatus {
  Started = 1,
  InProgress = 2,
  Submitted = 3,
  Expired = 4,
  Cancelled = 5,
}

export enum GradingStatus {
  Pending = 0,
  InProgress = 1,
  Completed = 2,
  RequiresManualGrading = 3,
}

export enum ProctorMode {
  None = 0,
  Soft = 1,
  Hard = 2,
}

export enum ProctorEventType {
  SessionStarted = 0,
  SessionEnded = 1,
  Heartbeat = 2,
  TabSwitch = 3,
  WindowBlur = 4,
  WindowFocus = 5,
  FullscreenExit = 6,
  FullscreenEnter = 7,
  CopyAttempt = 8,
  PasteAttempt = 9,
  RightClick = 10,
  KeyboardShortcut = 11,
  FaceNotDetected = 12,
  MultipleFaces = 13,
  AudioDetected = 14,
  ScreenshareStarted = 15,
  ScreenshareStopped = 16,
  BrowserResize = 17,
  NetworkDisconnect = 18,
  NetworkReconnect = 19,
}

export enum Severity {
  Info = 0,
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4,
  Severe = 5,
}

export enum ProctorDecisionStatus {
  Pending = 0,
  Cleared = 1,
  Suspicious = 2,
  Invalidated = 3,
  RequiresReview = 4,
}

export enum EvidenceType {
  Webcam = 0,
  Screen = 1,
  Audio = 2,
  Screenshot = 3,
  Photo = 4,
}

export enum IncidentSource {
  Manual = 0,
  Proctor = 1,
  System = 2,
  Appeal = 3,
}

export enum IncidentSeverity {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3,
}

export enum IncidentStatus {
  Open = 0,
  InReview = 1,
  Resolved = 2,
  Closed = 3,
  Reopened = 4,
}

export enum IncidentOutcome {
  Cleared = 0,
  Suspicious = 1,
  Confirmed = 2,
  Invalidated = 3,
  Escalated = 4,
}

export enum AppealStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  PartiallyApproved = 3,
}

export enum ExportFormat {
  Csv = 0,
  Excel = 1,
  Pdf = 2,
  Json = 3,
}

export enum VerificationStatus {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
}

export enum ExamType {
  Flex = 0, // Candidate can start anytime within availability window
  Fixed = 1, // All candidates must start at exact StartAt time
}

export enum SectionSourceType {
  Subject = 1, // Section built from Question Bank Subject
  Topic = 2, // Section built from Question Bank Topic
}

// ============ COMMON TYPES ============
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

// ============ AUTH ============
export interface User {
  id: string;
  email: string;
  fullNameEn: string;
  fullNameAr: string;
  role: UserRole;
  isActive: boolean;
  createdDate: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

// ============ QUESTION BANK ============
export interface QuestionOption {
  id: number;
  questionId: number;
  textEn: string;
  textAr: string;
  text?: string; // Legacy field for backward compatibility
  isCorrect: boolean;
  order: number;
  attachmentPath: string | null;
  createdDate: string;
}

export interface QuestionAttachment {
  id: number;
  questionId: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  isPrimary: boolean;
  createdDate: string;
}

export interface Question {
  id: number;
  bodyEn: string;
  bodyAr: string;
  body?: string; // Legacy field for backward compatibility
  questionTypeId: number;
  questionTypeNameEn: string;
  questionTypeNameAr: string;
  questionTypeName?: string; // Legacy field
  questionCategoryId: number;
  questionCategoryNameEn: string;
  questionCategoryNameAr: string;
  questionCategoryName?: string; // Legacy field
  points: number;
  difficultyLevel: DifficultyLevel;
  difficultyLevelName: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
  isDeleted: boolean;
  options: QuestionOption[];
  attachments: QuestionAttachment[];
  optionsCount?: number;
  attachmentsCount?: number;
}

export interface QuestionCategory {
  id: number;
  nameEn: string;
  nameAr: string;
  createdDate: string;
  updatedDate: string | null;
  isDeleted: boolean;
}

export interface QuestionType {
  id: number;
  nameEn: string;
  nameAr: string;
  createdDate: string;
  updatedDate: string | null;
  isDeleted: boolean;
}

// ============ EXAM ============
export interface ExamInstruction {
  id: number;
  examId: number;
  contentEn: string;
  contentAr: string;
  order: number;
  createdDate: string;
}

export interface ExamAccessPolicy {
  id: number;
  examId: number;
  isPublic: boolean;
  accessCode: string | null;
  restrictToAssignedCandidates: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface ExamQuestion {
  id: number;
  examId: number;
  examSectionId: number;
  examTopicId: number | null; // Added examTopicId for topic support
  questionId: number;
  order: number;
  points: number;
  isRequired: boolean;
  createdDate: string;
  questionBodyEn: string;
  questionBodyAr: string;
  questionBody?: string; // Legacy field for backward compatibility
  questionTypeNameEn: string;
  questionTypeNameAr: string;
  questionTypeName?: string; // Legacy field
  difficultyLevelName: string;
  originalPoints: number;
}

export interface ExamTopic {
  id: number;
  examSectionId: number;
  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  order: number;
  createdDate: string;
  questionsCount: number;
  totalPoints: number;
  questions: ExamQuestion[];
}

export interface ExamSection {
  id: number;
  examId: number;
  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  order: number;
  durationMinutes: number | null;
  totalPointsOverride: number | null;
  createdDate: string;
  topicsCount: number; // Added topicsCount
  questionsCount: number;
  totalPoints: number;
  topics: ExamTopic[]; // Added topics array
  questions: ExamQuestion[];
  // Builder fields (optional - only set when section is built from Question Bank)
  sourceType?: SectionSourceType | null;
  questionSubjectId?: number | null;
  questionTopicId?: number | null;
  pickCount?: number;
  subjectNameEn?: string | null;
  subjectNameAr?: string | null;
  topicNameEn?: string | null;
  topicNameAr?: string | null;
  availableQuestionsCount?: number;
}

// ============ EXAM BUILDER ============
export interface ExamBuilderDto {
  examId: number;
  sourceType: SectionSourceType;
  selectedSubjectIds: number[];
  sections: BuilderSectionDto[];
}

export interface BuilderSectionDto {
  id: number;
  order: number;
  sourceType: SectionSourceType;
  questionSubjectId: number | null;
  questionTopicId: number | null;
  subjectNameEn: string | null;
  subjectNameAr: string | null;
  topicNameEn: string | null;
  topicNameAr: string | null;
  titleEn: string;
  titleAr: string;
  durationMinutes: number | null;
  pickCount: number;
  availableQuestionsCount: number;
}

export interface SaveExamBuilderRequest {
  sourceType: SectionSourceType;
  sections: SaveBuilderSectionDto[];
}

export interface SaveBuilderSectionDto {
  questionSubjectId: number | null;
  questionTopicId: number | null;
  titleEn?: string | null;
  titleAr?: string | null;
  durationMinutes: number | null;
  pickCount: number;
  sourceType: SectionSourceType;
  order: number;
}

export interface QuestionsCountResponse {
  count: number;
}

export interface Exam {
  id: number;
  departmentId: number; // Added departmentId
  departmentNameEn?: string; // Added department name
  departmentNameAr?: string;
  examType: ExamType; // Added examType
  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  startAt: string | null;
  endAt: string | null;
  durationMinutes: number;
  // Attempts policy
  maxAttempts: number;
  // Randomization rules
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  // Passing rule
  passScore: number;
  isPublished: boolean;
  isActive: boolean;
  // Result & Review Settings
  showResults: boolean;
  allowReview: boolean;
  showCorrectAnswers: boolean;
  // Proctoring Settings
  requireProctoring: boolean;
  requireIdVerification: boolean;
  requireWebcam: boolean;
  // Security Settings
  preventCopyPaste: boolean;
  preventScreenCapture: boolean;
  requireFullscreen: boolean;
  browserLockdown: boolean;
  // Meta
  createdDate: string;
  updatedDate: string | null;
  sectionsCount: number;
  questionsCount: number;
  totalPoints: number;
  sections: ExamSection[];
  instructions: ExamInstruction[];
  accessPolicy: ExamAccessPolicy | null;
}

// ============ ATTEMPT ============
export interface AttemptQuestion {
  attemptQuestionId: number;
  questionId: number;
  order: number;
  points: number;
  body: string;
  questionTypeName: string;
  questionTypeId: number;
  options: { id: number; text: string; order: number }[];
  attachments: QuestionAttachment[];
  currentAnswer: AttemptAnswer | null;
}

export interface AttemptAnswer {
  attemptAnswerId: number;
  questionId: number;
  selectedOptionIds: number[] | null;
  textAnswer: string | null;
  answeredAt: string;
}

export interface AttemptSession {
  attemptId: number;
  examId: number;
  examTitleEn: string;
  examTitleAr: string;
  examDescriptionEn?: string;
  examDescriptionAr?: string;
  startedAt: string;
  expiresAt: string;
  remainingSeconds: number;
  totalQuestions: number;
  answeredQuestions: number;
  status: AttemptStatus;
  attemptNumber: number;
  maxAttempts: number;
  questions: AttemptQuestion[];
  instructions: { order: number; contentEn: string; contentAr: string }[];
}

export interface Attempt {
  id: number;
  examId: number;
  examTitleEn: string;
  examTitleAr: string;
  candidateId: string;
  candidateName: string;
  startedAt: string;
  submittedAt: string | null;
  expiresAt: string;
  status: AttemptStatus;
  statusName: string;
  attemptNumber: number;
  totalQuestions: number;
  answeredQuestions: number;
  score?: number;
  isPassed?: boolean;
}

// ============ GRADING ============
export interface GradingAnswer {
  id: number;
  questionId: number;
  questionBody: string;
  questionTypeName: string;
  maxPoints: number;
  selectedOptionIds: number[] | null;
  textAnswer: string | null;
  score: number | null;
  isCorrect: boolean | null;
  isManuallyGraded: boolean;
  graderComment: string | null;
}

export interface GradingSession {
  id: number;
  attemptId: number;
  examId: number;
  examTitleEn: string;
  candidateId: string;
  candidateName: string;
  status: GradingStatus;
  statusName: string;
  totalScore: number | null;
  maxPossibleScore: number;
  passScore: number;
  isPassed: boolean | null;
  totalQuestions: number;
  gradedQuestions: number;
  manualGradingRequired: number;
  answers: GradingAnswer[];
}

// ============ EXAM RESULT ============
export interface ExamResult {
  id: number;
  attemptId: number;
  examId: number;
  examTitleEn: string;
  examTitleAr: string;
  candidateId: string;
  candidateName: string;
  totalScore: number;
  maxPossibleScore: number;
  passScore: number;
  isPassed: boolean;
  isPublished: boolean;
  finalizedAt: string;
  publishedAt: string | null;
}

// ============ PROCTOR ============
export interface ProctorSession {
  id: number;
  attemptId: number;
  examId: number;
  candidateId: string;
  candidateName: string;
  mode: ProctorMode;
  modeName: string;
  startedAt: string;
  endedAt: string | null;
  status: number;
  statusName: string;
  riskScore: number;
  totalEvents: number;
  totalViolations: number;
  deviceFingerprint: string;
  browserName: string;
  operatingSystem: string;
  decisionStatus: ProctorDecisionStatus;
  decisionStatusName: string;
}

export interface ProctorEvent {
  id: number;
  proctorSessionId: number;
  eventType: ProctorEventType;
  eventTypeName: string;
  severity: Severity;
  severityName: string;
  metadataJson: string | null;
  clientTimestamp: string | null;
  serverTimestamp: string;
}

export interface ProctorEvidence {
  id: number;
  proctorSessionId: number;
  type: EvidenceType;
  typeName: string;
  fileName: string;
  filePath: string;
  contentType: string;
  fileSize: number;
  startAt: string | null;
  endAt: string | null;
  durationSeconds: number | null;
  uploadedAt: string;
  isConfirmed: boolean;
}

export interface RiskRule {
  id: number;
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

// ============ INCIDENT ============
export interface IncidentCase {
  id: number;
  attemptId: number;
  proctorSessionId: number | null;
  examId: number;
  examTitleEn: string;
  candidateId: string;
  candidateName: string;
  source: IncidentSource;
  sourceName: string;
  severity: IncidentSeverity;
  severityName: string;
  status: IncidentStatus;
  statusName: string;
  outcome: IncidentOutcome | null;
  outcomeName: string | null;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  summaryAr: string;
  assignedToId: string | null;
  assignedToName: string | null;
  createdDate: string;
  resolvedDate: string | null;
}

export interface IncidentComment {
  id: number;
  caseId: number;
  authorId: string;
  authorName: string;
  body: string;
  isVisibleToCandidate: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface IncidentDecision {
  id: number;
  caseId: number;
  outcome: IncidentOutcome;
  outcomeName: string;
  reasonEn: string;
  reasonAr: string;
  internalNotes: string | null;
  decidedById: string;
  decidedByName: string;
  decidedAt: string;
}

export interface Appeal {
  id: number;
  incidentCaseId: number;
  candidateId: string;
  message: string;
  supportingInfo: string | null;
  status: AppealStatus;
  statusName: string;
  decisionNoteEn: string | null;
  decisionNoteAr: string | null;
  reviewedById: string | null;
  reviewedByName: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

// ============ AUDIT ============
export interface AuditLog {
  id: number;
  actorId: string;
  actorName: string;
  actorType: string;
  action: string;
  entityName: string;
  entityId: string;
  correlationId: string | null;
  tenantId: string | null;
  source: string;
  channel: string;
  outcome: string;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
  details: string | null;
}

// ============ IDENTITY VERIFICATION ============
export interface IdentityVerification {
  id: number;
  attemptId: number;
  candidateId: string;
  idImagePath: string;
  selfieImagePath: string;
  status: VerificationStatus;
  reviewedById: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdDate: string;
}
