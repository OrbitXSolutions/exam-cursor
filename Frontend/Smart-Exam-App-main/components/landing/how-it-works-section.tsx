"use client"

import { useEffect, useRef, useState } from "react"
import { FileText, Settings, Play, BarChart3, Award, ArrowRight, Check } from "lucide-react"

const steps = [
  {
    icon: FileText,
    title: "Create",
    description: "Build your exam",
    features: ["Add questions", "Re-use question banks", "Randomize question & answer ordering"],
    link: "Creating exams",
    color: "emerald",
  },
  {
    icon: Settings,
    title: "Setup",
    description: "Configure settings",
    features: ["Private / public access", "Allow changing answers", "Set exam timers", "Limit exam attempts"],
    link: "Exam settings",
    color: "blue",
  },
  {
    icon: Play,
    title: "Give Exam",
    description: "Deliver seamlessly",
    features: ["Seamless on mobile, tablet, or desktop", "Instant feedback for test takers", "AI-powered proctoring"],
    link: "Taking exams",
    color: "violet",
  },
  {
    icon: BarChart3,
    title: "Analyze Results",
    description: "Review performance",
    features: ["Instant grading and real-time results", "Export results for offline analysis", "Detailed analytics"],
    link: "Analyzing results",
    color: "amber",
  },
  {
    icon: Award,
    title: "Certification",
    description: "Award achievements",
    features: ["Automatic certification when test takers finish", "Set a required passmark to receive certificates"],
    link: "Custom certificates",
    color: "rose",
  },
]

const colorClasses = {
  emerald: {
    bg: "bg-emerald-500",
    bgLight: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-600",
    shadow: "shadow-emerald-500/20",
    ring: "ring-emerald-500/20",
  },
  blue: {
    bg: "bg-blue-500",
    bgLight: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-600",
    shadow: "shadow-blue-500/20",
    ring: "ring-blue-500/20",
  },
  violet: {
    bg: "bg-violet-500",
    bgLight: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-600",
    shadow: "shadow-violet-500/20",
    ring: "ring-violet-500/20",
  },
  amber: {
    bg: "bg-amber-500",
    bgLight: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-600",
    shadow: "shadow-amber-500/20",
    ring: "ring-amber-500/20",
  },
  rose: {
    bg: "bg-rose-500",
    bgLight: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-600",
    shadow: "shadow-rose-500/20",
    ring: "ring-rose-500/20",
  },
}

export function HowItWorksSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
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

  // Auto-cycle through steps
  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % steps.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [isVisible])

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="py-24 bg-gradient-to-b from-white via-slate-50/50 to-white overflow-hidden"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
            <Play className="w-4 h-4" />
            Simple Process
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-slate-900">How</span>{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              SmartExam
            </span>{" "}
            <span className="text-slate-900">Works</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            From creation to certification, manage the entire exam lifecycle in five simple steps.
          </p>
        </div>

        {/* Desktop View - Enhanced Cards with Curved Path */}
        <div className="hidden lg:block relative max-w-7xl mx-auto">
          {/* SVG Curved Path */}
          <svg
            className="absolute top-24 left-0 right-0 w-full h-20 overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 1200 80"
          >
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="25%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="75%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
            </defs>
            {/* Background path */}
            <path
              d="M 60 40 Q 180 10, 300 40 T 540 40 T 780 40 T 1020 40 T 1140 40"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="12 8"
            />
            {/* Animated progress path */}
            <path
              d="M 60 40 Q 180 10, 300 40 T 540 40 T 780 40 T 1020 40 T 1140 40"
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="1200"
              strokeDashoffset={1200 - (activeStep / (steps.length - 1)) * 1200}
              className="transition-all duration-700"
            />
          </svg>

          {/* Step Cards */}
          <div className="grid grid-cols-5 gap-6 relative pt-8">
            {steps.map((step, index) => {
              const colors = colorClasses[step.color as keyof typeof colorClasses]
              const isActive = index <= activeStep
              const isCurrent = index === activeStep

              return (
                <div
                  key={step.title}
                  className={`relative transition-all duration-500 cursor-pointer ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                  onClick={() => setActiveStep(index)}
                >
                  {/* Icon Circle */}
                  <div className="flex justify-center mb-6">
                    <div
                      className={`relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                        isActive
                          ? `${colors.bg} text-white shadow-xl ${colors.shadow} scale-110 ring-4 ${colors.ring}`
                          : "bg-white border-2 border-slate-200 text-slate-400 hover:border-slate-300"
                      } ${isCurrent ? "animate-pulse-slow" : ""}`}
                    >
                      <step.icon className="w-9 h-9" />
                      <span
                        className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-all ${
                          isActive ? `${colors.bg} text-white` : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {isActive ? <Check className="w-4 h-4" /> : index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div
                    className={`rounded-2xl p-6 transition-all duration-300 ${
                      isCurrent
                        ? `${colors.bgLight} ${colors.border} border-2 shadow-lg`
                        : "bg-white border border-slate-200 hover:shadow-md hover:border-slate-300"
                    }`}
                  >
                    <h3
                      className={`text-xl font-bold mb-2 transition-colors ${
                        isActive ? colors.text : "text-slate-900"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4 font-medium">{step.description}</p>

                    <ul className="space-y-2 mb-4">
                      {step.features.map((feature) => (
                        <li key={feature} className="text-sm text-slate-600 flex items-start gap-2">
                          <span
                            className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? colors.bg : "bg-slate-300"}`}
                          />
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <a
                      href="#"
                      className={`inline-flex items-center gap-1 text-sm font-semibold transition-colors ${
                        isActive ? colors.text : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {step.link}
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center mt-12 gap-2">
            {steps.map((step, index) => {
              const colors = colorClasses[step.color as keyof typeof colorClasses]
              return (
                <button
                  key={index}
                  onClick={() => setActiveStep(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === activeStep
                      ? `w-8 ${colors.bg}`
                      : index < activeStep
                        ? `w-2 ${colors.bg} opacity-50`
                        : "w-2 bg-slate-300"
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              )
            })}
          </div>
        </div>

        {/* Mobile View - Vertical Timeline */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, index) => {
            const colors = colorClasses[step.color as keyof typeof colorClasses]
            const isActive = index <= activeStep

            return (
              <div
                key={step.title}
                className={`flex gap-4 transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onClick={() => setActiveStep(index)}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                      isActive ? `${colors.bg} text-white shadow-lg ${colors.shadow}` : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <step.icon className="w-7 h-7" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-0.5 flex-1 mt-2 transition-colors ${isActive ? colors.bg : "bg-slate-200"}`} />
                  )}
                </div>
                <div
                  className={`flex-1 pb-8 rounded-xl p-4 ${isActive ? colors.bgLight : "bg-white"} border ${isActive ? colors.border : "border-slate-200"}`}
                >
                  <h3 className={`text-lg font-bold transition-colors ${isActive ? colors.text : "text-slate-900"}`}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-3">{step.description}</p>
                  <ul className="space-y-1.5">
                    {step.features.map((feature) => (
                      <li key={feature} className="text-sm text-slate-600 flex items-start gap-2">
                        <span
                          className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? colors.bg : "bg-slate-300"}`}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <a href="#" className={`inline-flex items-center gap-1 text-sm font-semibold mt-3 ${colors.text}`}>
                    {step.link} <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
