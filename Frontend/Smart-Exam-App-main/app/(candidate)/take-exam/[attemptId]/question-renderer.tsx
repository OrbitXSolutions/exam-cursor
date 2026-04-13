"use client"

import { useState, useEffect } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import type { AttemptQuestionDto, SaveAnswerRequest } from "@/lib/api/candidate"
import { localizeText } from "@/lib/i18n/runtime"
import { cn } from "@/lib/utils"
import { ImageZoomModal } from "./image-zoom-modal"

// Helper function to get localized field
function getLocalizedField(
  obj: any,
  fieldBase: string,
  language: string
): string {
  const field = language === "ar" ? `${fieldBase}Ar` : `${fieldBase}En`
  const fallback = language === "ar" ? `${fieldBase}En` : `${fieldBase}Ar`
  return (obj[field] as string) || (obj[fallback] as string) || ""
}

// Question type constants for matching both ID and name
const QUESTION_TYPES = {
  MCQ_SINGLE: { id: 1, names: ["MCQ_Single", "MCQ Single Choice", "SingleChoice", "Multiple Choice", "MCQ Single"] },
  MCQ_MULTI: { id: 2, names: ["MCQ_Multi", "MCQ Multiple Choice", "MCQ_Multiple", "MultipleChoice", "Multiple Select", "MCQ Multiple"] },
  TRUE_FALSE: { id: 3, names: ["TrueFalse", "True_False", "True/False"] },
  SUBJECTIVE: { id: 4, names: ["Subjective", "ShortAnswer", "Short_Answer", "Short Answer", "Essay", "Numeric"] },
}

// Helper function to detect question type from ID or name
function getQuestionType(questionTypeId: number, questionTypeName: string): keyof typeof QUESTION_TYPES {
  // First try by ID
  for (const [key, value] of Object.entries(QUESTION_TYPES)) {
    if (value.id === questionTypeId) return key as keyof typeof QUESTION_TYPES
  }
  // Then try by name
  for (const [key, value] of Object.entries(QUESTION_TYPES)) {
    if (value.names.some(n => n.toLowerCase() === questionTypeName?.toLowerCase())) {
      return key as keyof typeof QUESTION_TYPES
    }
  }
  // Default fallback
  return "MCQ_SINGLE"
}

interface QuestionRendererProps {
  question: AttemptQuestionDto
  answer?: SaveAnswerRequest
  language: string
  onAnswerChange: (questionId: number, answer: SaveAnswerRequest) => void
}

export function QuestionRenderer({
  question,
  answer,
  language,
  onAnswerChange,
}: QuestionRendererProps) {
  const questionType = getQuestionType(question.questionTypeId, question.questionTypeName)

  const dir = language === "ar" ? "rtl" : "ltr"

  return (
    <div className="space-y-4" dir={dir}>
      {/* Answer Area — question image is now displayed in the parent card header */}
      {renderAnswerComponent(questionType, question, answer, language, onAnswerChange)}
    </div>
  )
}

function renderAnswerComponent(
  questionType: keyof typeof QUESTION_TYPES,
  question: AttemptQuestionDto,
  answer: SaveAnswerRequest | undefined,
  language: string,
  onAnswerChange: (questionId: number, answer: SaveAnswerRequest) => void,
) {

  // Render based on question type
  switch (questionType) {
    case "MCQ_SINGLE":
      return (
        <MCQSingleChoice
          question={question}
          answer={answer}
          language={language}
          onAnswerChange={onAnswerChange}
        />
      )
    case "MCQ_MULTI":
      return (
        <MCQMultipleChoice
          question={question}
          answer={answer}
          language={language}
          onAnswerChange={onAnswerChange}
        />
      )
    case "TRUE_FALSE":
      return (
        <TrueFalse
          question={question}
          answer={answer}
          language={language}
          onAnswerChange={onAnswerChange}
        />
      )
    case "SUBJECTIVE":
      return (
        <Subjective
          question={question}
          answer={answer}
          language={language}
          onAnswerChange={onAnswerChange}
        />
      )
    default:
      return (
        <div>
          {localizeText("Unsupported question type", "نوع سؤال غير مدعوم", language)}:{" "}
          {question.questionTypeName}
        </div>
      )
  }
}

// MCQ Single Choice Component
function MCQSingleChoice({
  question,
  answer,
  language,
  onAnswerChange,
}: QuestionRendererProps) {
  const [selectedOption, setSelectedOption] = useState<string>(
    answer?.selectedOptionIds?.[0]?.toString() || ""
  )

  useEffect(() => {
    setSelectedOption(answer?.selectedOptionIds?.[0]?.toString() || "")
  }, [answer])

  const handleChange = (value: string) => {
    setSelectedOption(value)
    onAnswerChange(question.questionId, {
      questionId: question.questionId,
      selectedOptionIds: [Number(value)],
      textAnswer: null,
    })
  }

  // Sort options by order
  const sortedOptions = [...question.options].sort((a, b) => a.order - b.order)

  const dir = language === "ar" ? "rtl" : "ltr"

  return (
    <RadioGroup value={selectedOption} onValueChange={handleChange} className="space-y-2" dir={dir}>
      {sortedOptions.map((option) => {
        const optionText = getLocalizedField(option, "text", language)
        const isSelected = selectedOption === option.id.toString()

        return (
          <Card
            key={option.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              isSelected && "border-primary bg-primary/5"
            )}
          >
            <Label
              htmlFor={`option-${option.id}`}
              className="flex cursor-pointer items-start gap-3 px-4 py-2.5"
              dir={dir}
            >
              <RadioGroupItem
                value={option.id.toString()}
                id={`option-${option.id}`}
                className="mt-0.5"
              />
              <div className="flex-1 space-y-1.5">
                <p className="text-sm leading-normal">{optionText}</p>
                {option.attachmentPath && (
                  <div className="mt-1 flex justify-center overflow-hidden rounded-md border bg-muted/20">
                    <ImageZoomModal
                      src={option.attachmentPath}
                      alt={optionText}
                      thumbnailClassName="max-h-40 w-auto object-contain"
                    />
                  </div>
                )}
              </div>
            </Label>
          </Card>
        )
      })}
    </RadioGroup>
  )
}

// MCQ Multiple Choice Component
function MCQMultipleChoice({
  question,
  answer,
  language,
  onAnswerChange,
}: QuestionRendererProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(
    new Set(answer?.selectedOptionIds || [])
  )

  useEffect(() => {
    setSelectedOptions(new Set(answer?.selectedOptionIds || []))
  }, [answer])

  const handleChange = (optionId: number, checked: boolean) => {
    const newSelected = new Set(selectedOptions)
    if (checked) {
      newSelected.add(optionId)
    } else {
      newSelected.delete(optionId)
    }
    setSelectedOptions(newSelected)
    onAnswerChange(question.questionId, {
      questionId: question.questionId,
      selectedOptionIds: Array.from(newSelected),
      textAnswer: null,
    })
  }

  // Sort options by order
  const sortedOptions = [...question.options].sort((a, b) => a.order - b.order)

  const dir = language === "ar" ? "rtl" : "ltr"

  return (
    <div className="space-y-2" dir={dir}>
      {sortedOptions.map((option) => {
        const optionText = getLocalizedField(option, "text", language)
        const isSelected = selectedOptions.has(option.id)

        return (
          <Card
            key={option.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              isSelected && "border-primary bg-primary/5"
            )}
          >
            <Label
              htmlFor={`option-${option.id}`}
              className="flex cursor-pointer items-start gap-3 px-4 py-2.5"
              dir={dir}
            >
              <Checkbox
                id={`option-${option.id}`}
                checked={isSelected}
                onCheckedChange={(checked) => handleChange(option.id, checked as boolean)}
                className="mt-0.5"
              />
              <div className="flex-1 space-y-1.5">
                <p className="text-sm leading-normal">{optionText}</p>
                {option.attachmentPath && (
                  <div className="mt-1 flex justify-center overflow-hidden rounded-md border bg-muted/20">
                    <ImageZoomModal
                      src={option.attachmentPath}
                      alt={optionText}
                      thumbnailClassName="max-h-40 w-auto object-contain"
                    />
                  </div>
                )}
              </div>
            </Label>
          </Card>
        )
      })}
    </div>
  )
}

// True/False Component
function TrueFalse({
  question,
  answer,
  language,
  onAnswerChange,
}: QuestionRendererProps) {
  const [selectedOption, setSelectedOption] = useState<string>(
    answer?.selectedOptionIds?.[0]?.toString() || ""
  )

  useEffect(() => {
    setSelectedOption(answer?.selectedOptionIds?.[0]?.toString() || "")
  }, [answer])

  const handleChange = (value: string) => {
    setSelectedOption(value)
    onAnswerChange(question.questionId, {
      questionId: question.questionId,
      selectedOptionIds: [Number(value)],
      textAnswer: null,
    })
  }

  // Sort options by order
  const sortedOptions = [...question.options].sort((a, b) => a.order - b.order)

  const dir = language === "ar" ? "rtl" : "ltr"

  return (
    <RadioGroup value={selectedOption} onValueChange={handleChange} className="space-y-2" dir={dir}>
      {sortedOptions.map((option) => {
        const optionText = getLocalizedField(option, "text", language)
        const isSelected = selectedOption === option.id.toString()

        return (
          <Card
            key={option.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              isSelected && "border-primary bg-primary/5"
            )}
          >
            <Label
              htmlFor={`option-${option.id}`}
              className="flex cursor-pointer items-center gap-3 px-4 py-2.5"
              dir={dir}
            >
              <RadioGroupItem
                value={option.id.toString()}
                id={`option-${option.id}`}
              />
              <p className="text-lg font-medium">{optionText}</p>
            </Label>
          </Card>
        )
      })}
    </RadioGroup>
  )
}

// Subjective Component (replaces ShortAnswer, Essay, Numeric)
function Subjective({
  question,
  answer,
  language,
  onAnswerChange,
}: QuestionRendererProps) {
  const [text, setText] = useState(answer?.textAnswer || "")
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout>()

  useEffect(() => {
    setText(answer?.textAnswer || "")
  }, [answer])

  const handleChange = (value: string) => {
    setText(value)

    // Debounce the save
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }

    const timeout = setTimeout(() => {
      onAnswerChange(question.questionId, {
        questionId: question.questionId,
        selectedOptionIds: null,
        textAnswer: value,
      })
    }, 1000) // Save after 1 second of no typing

    setDebounceTimeout(timeout)
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="space-y-2">
      <Label htmlFor={`answer-${question.questionId}`}>
        {language === "ar" ? "اكتب إجابتك المفصلة هنا" : "Type your detailed answer here"}
      </Label>
      <Textarea
        id={`answer-${question.questionId}`}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={language === "ar" ? "أدخل إجابتك المفصلة" : "Enter your detailed answer"}
        className="min-h-[200px] text-base"
        rows={10}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <p>
          {language === "ar" 
            ? "سيتم حفظ إجابتك تلقائيًا" 
            : "Your answer will be saved automatically"}
        </p>
        <p>
          {wordCount} {language === "ar" ? "كلمة" : "words"}
        </p>
      </div>
    </div>
  )
}
