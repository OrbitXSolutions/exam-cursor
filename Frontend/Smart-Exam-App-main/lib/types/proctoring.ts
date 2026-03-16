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
