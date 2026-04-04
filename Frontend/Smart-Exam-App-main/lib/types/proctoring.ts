export interface LiveSession {
  id: string;
  attemptId?: number;
  examId?: number;
  candidateId: string;
  candidateName: string;
  examTitle: string;
  startedAt: string;
  timeRemaining: number;
  status: "Active" | "Completed" | "Terminated";
  incidentCount: number;
  flagged: boolean;
  lastActivity: string;
  isSample?: boolean;
  latestSnapshotUrl?: string;
  snapshotCount?: number;
  lastSnapshotAt?: string;
  riskScore?: number;
  totalViolations?: number;
  countableViolationCount?: number;
  maxViolationWarnings?: number;
  isTerminatedByProctor?: boolean;
  terminationReason?: string;
  // Device & Browser info
  browserName?: string;
  browserVersion?: string;
  operatingSystem?: string;
  screenResolution?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  userAgent?: string;
  // Attempt-level fields
  remainingSeconds?: number;
  expiresAt?: string;
  attemptStatus?: string;
  attemptIpAddress?: string;
  attemptDeviceInfo?: string;
  // Enriched: Candidate Profile
  candidateEmail?: string;
  candidateNameAr?: string;
  candidateRollNo?: string;
  candidateDepartment?: string;
  candidatePhone?: string;
  // Enriched: Exam Details
  examTitleAr?: string;
  examDurationMinutes?: number;
  examPassScore?: number;
  examMaxAttempts?: number;
  examTotalQuestions?: number;
  examRequireWebcam?: boolean;
  examEnableScreenMonitoring?: boolean;
  examRequireIdVerification?: boolean;
  examRequireFullscreen?: boolean;
  examPreventCopyPaste?: boolean;
  examBrowserLockdown?: boolean;
  // Enriched: Attempt Progress
  attemptNumber?: number;
  attemptTotalScore?: number;
  attemptIsPassed?: boolean;
  attemptSubmittedAt?: string;
  attemptStartedAt?: string;
  attemptExtraTimeSeconds?: number;
  attemptTotalAnswered?: number;
  attemptTotalQuestions?: number;
  // Enriched: Session Duration
  sessionDuration?: string;
  sessionDurationMinutes?: number;
  // Enriched: Identity Verification
  identityVerification?: {
    status: string;
    faceMatchScore?: number;
    livenessResult?: string;
    riskScore?: number;
    submittedAt: string;
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNotes?: string;
    idDocumentType?: string;
    idDocumentUploaded: boolean;
  };
  // Enriched: Violation Breakdown
  violationBreakdown?: Array<{
    eventType: string;
    count: number;
    severity: string;
  }>;
  // Enriched: Risk Level
  riskLevel?: string;
  // Enriched: Decision
  decision?: {
    status: string;
    statusName: string;
    decisionReasonEn?: string;
    decidedBy?: string;
    deciderName?: string;
    decidedAt?: string;
    isFinalized: boolean;
    wasOverridden: boolean;
  };
  // Enriched: Mode
  modeName?: string;
  heartbeatMissedCount?: number;
  endedAt?: string;
}

export interface Incident {
  id: string;
  sessionId: string;
  candidateName?: string;
  examTitle?: string;
  type:
    | "TabSwitch"
    | "FaceNotDetected"
    | "MultiplePersons"
    | "AudioDetected"
    | "ScreenCapture"
    | "Other";
  severity: "Low" | "Medium" | "High" | "Critical";
  description: string;
  timestamp: string;
  reviewed: boolean;
  reviewedBy?: string;
  reviewNotes?: string;
  screenshotUrl?: string;
}
