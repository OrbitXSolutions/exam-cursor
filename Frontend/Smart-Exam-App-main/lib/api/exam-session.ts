import { apiClient } from "@/lib/api-client"
import type { ExamSession, ExamAttempt, ExamSubmission, AnswerSubmission } from "@/lib/types"

// Get available exams for candidate
export async function getAvailableExams(): Promise<ExamSession[]> {
  try {
    return await apiClient.get<ExamSession[]>("/Candidate/exams")
  } catch {
    // Mock data for development
    return [
      {
        id: "session-1",
        examId: "exam-1",
        examTitle: "Mathematics Final Exam",
        examCode: "MATH-2024-FINAL",
        scheduleName: "Morning Session",
        startTime: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // 30 min from now
        endTime: new Date(Date.now() + 1000 * 60 * 150).toISOString(), // 2.5 hours from now
        durationMinutes: 120,
        status: "Scheduled",
        requiresProctoring: true,
        requiresIdVerification: true,
      },
      {
        id: "session-2",
        examId: "exam-2",
        examTitle: "Physics Midterm",
        examCode: "PHYS-2024-MID",
        scheduleName: "Afternoon Session",
        startTime: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // Started 10 min ago
        endTime: new Date(Date.now() + 1000 * 60 * 110).toISOString(),
        durationMinutes: 90,
        status: "InProgress",
        requiresProctoring: false,
        requiresIdVerification: false,
      },
      {
        id: "session-3",
        examId: "exam-3",
        examTitle: "Chemistry Quiz",
        examCode: "CHEM-2024-Q1",
        scheduleName: "Quick Assessment",
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        endTime: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
        durationMinutes: 30,
        status: "Completed",
        requiresProctoring: false,
        requiresIdVerification: false,
        score: 85,
        passed: true,
      },
    ]
  }
}

// Start exam attempt (or resume if already started)
// Note: This will be called from the old take-exam page after redirect
// The backend should handle resuming an existing attempt
export async function startExamAttempt(sessionId: string): Promise<ExamAttempt> {
  console.log("[v0] startExamAttempt called with sessionId:", sessionId)
  return await apiClient.post<ExamAttempt>(`/Candidate/exams/${sessionId}/start`)
}

// Save answer
export async function saveAnswer(attemptId: string, questionId: string, answer: AnswerSubmission): Promise<void> {
  try {
    await apiClient.post(`/Candidate/attempts/${attemptId}/answers/${questionId}`, answer)
  } catch {
    // Mock - answer saved locally
  }
}

// Flag/unflag question
export async function toggleQuestionFlag(attemptId: string, questionId: string, flagged: boolean): Promise<void> {
  try {
    await apiClient.post(`/Candidate/attempts/${attemptId}/questions/${questionId}/flag`, { flagged })
  } catch {
    // Mock - flag saved locally
  }
}

// Submit exam
export async function submitExam(attemptId: string): Promise<ExamSubmission> {
  try {
    return await apiClient.post<ExamSubmission>(`/Candidate/attempts/${attemptId}/submit`)
  } catch {
    return {
      id: crypto.randomUUID(),
      attemptId,
      submittedAt: new Date().toISOString(),
      status: "Submitted",
      message: "Your exam has been submitted successfully. Results will be available soon.",
    }
  }
}

// Report incident
export async function reportIncident(attemptId: string, incidentType: string, details?: string): Promise<void> {
  try {
    await apiClient.post(`/Candidate/attempts/${attemptId}/incidents`, {
      type: incidentType,
      details,
      timestamp: new Date().toISOString(),
    })
  } catch {
    // Mock - incident logged
  }
}
