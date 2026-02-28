export interface LiveSession {
  id: string;
  attemptId?: number;
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
