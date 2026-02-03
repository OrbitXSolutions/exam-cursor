"use client"

import { useEffect, useRef, useState } from "react"
import { FileQuestion, Users, BarChart3, Shield, Globe, Clock, Award, Zap } from "lucide-react"

const features = [
  {
    icon: FileQuestion,
    title: "Question Bank",
    description: "Create and manage diverse question types including MCQ, essay, and coding challenges.",
  },
  {
    icon: Users,
    title: "Candidate Management",
    description: "Efficiently manage thousands of candidates with bulk import and group assignments.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Gain insights with detailed reports, score distributions, and performance metrics.",
  },
  {
    icon: Shield,
    title: "AI Proctoring",
    description: "Ensure integrity with face detection, tab monitoring, and behavior analysis.",
  },
  {
    icon: Globe,
    title: "Multi-Language",
    description: "Support for English and Arabic with full RTL layout compatibility.",
  },
  {
    icon: Clock,
    title: "Flexible Scheduling",
    description: "Schedule exams with custom time windows, late entry options, and timezone support.",
  },
  {
    icon: Award,
    title: "Auto Certification",
    description: "Generate certificates automatically when candidates meet passing criteria.",
  },
  {
    icon: Zap,
    title: "Instant Grading",
    description: "Automatic grading for objective questions with manual review for essays.",
  },
]

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false)
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

  return (
    <section ref={sectionRef} className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-slate-900">Everything You Need for</span>{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Secure Exams
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A comprehensive platform designed for educational institutions and enterprises to conduct secure, scalable
            online assessments.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:shadow-xl hover:border-emerald-200 hover:-translate-y-2 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <feature.icon className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
