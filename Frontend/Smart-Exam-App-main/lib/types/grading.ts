export interface GradingQuestion {
  id: string
  questionId: string
  body: string
  type: string
  points: number
  earnedPoints: number | null
  isAutoGraded: boolean
  needsManualGrading?: boolean
  candidateAnswer: {
    selectedOptionIds: string[] | null
    textAnswer: string | null
  }
  correctAnswer: {
    optionIds?: string[]
    text?: string
  } | null
  rubric?: string
  isCorrect: boolean | null
  feedback?: string
}

export interface GradingSection {
  id: string
  title: string
  questions: GradingQuestion[]
}

export interface GradingResult {
  id: string
  candidateName: string
  candidateEmail: string
  examTitle: string
  submittedAt: string
  status: string
  autoScore: number
  finalScore: number | null
  totalPoints: number
  earnedPoints: number
  passingScore: number
  passed: boolean | null
  sections: GradingSection[]
}

export interface ManualGrade {
  points: number
  feedback?: string
}
