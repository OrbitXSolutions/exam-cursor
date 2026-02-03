"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DashboardMock,
  QuestionBankMock,
  ExamBuilderMock,
  ProctoringCenterMock,
  ResultsAnalyticsMock,
} from "./mock-screenshots"

const screenshots = [
  {
    title: "Dashboard Overview",
    description: "Get a bird's-eye view of all your exams, candidates, and performance metrics.",
    component: DashboardMock,
  },
  {
    title: "Question Bank Manager",
    description: "Create and organize questions with multiple types, categories, and difficulty levels.",
    component: QuestionBankMock,
  },
  {
    title: "Exam Builder",
    description: "Build exams with sections, time limits, and advanced security settings.",
    component: ExamBuilderMock,
  },
  {
    title: "Live Proctoring Center",
    description: "Monitor active exam sessions in real-time with AI-powered incident detection.",
    component: ProctoringCenterMock,
  },
  {
    title: "Results & Analytics",
    description: "Analyze performance with detailed reports, score distributions, and insights.",
    component: ResultsAnalyticsMock,
  },
]

export function ScreenshotsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        nextSlide()
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [isAnimating])

  const nextSlide = () => {
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev + 1) % screenshots.length)
    setTimeout(() => setIsAnimating(false), 500)
  }

  const prevSlide = () => {
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length)
    setTimeout(() => setIsAnimating(false), 500)
  }

  const CurrentComponent = screenshots[currentIndex].component

  return (
    <section ref={sectionRef} className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-slate-900">See</span>{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              SmartExam
            </span>{" "}
            <span className="text-slate-900">in Action</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Explore the powerful features that make SmartExam the preferred choice for secure online assessments.
          </p>
        </div>

        <div
          className={`max-w-5xl mx-auto transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Browser Chrome */}
          <div className="bg-slate-800 rounded-t-2xl p-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-slate-700 rounded-lg px-4 py-1 text-slate-400 text-sm font-mono">app.smartexam.io</div>
            </div>
          </div>

          {/* Screenshot Content */}
          <div className="relative bg-slate-900 rounded-b-2xl overflow-hidden">
            <div
              className={`aspect-video relative transition-opacity duration-500 ${isAnimating ? "opacity-50" : "opacity-100"}`}
            >
              <CurrentComponent />
            </div>

            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm"
              onClick={prevSlide}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm"
              onClick={nextSlide}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          {/* Caption */}
          <div className="text-center mt-8">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">{screenshots[currentIndex].title}</h3>
            <p className="text-slate-600">{screenshots[currentIndex].description}</p>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {screenshots.map((_, index) => (
              <button
                key={index}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "bg-emerald-500 w-8" : "bg-slate-300 hover:bg-slate-400 w-2.5"
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
