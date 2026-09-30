"use client"

import { useEffect, useRef, useState } from "react"
import { FileQuestion, Users, BarChart3, Shield, Globe, Clock, Zap } from "lucide-react"

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
    <section ref={sectionRef} className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-foreground">Everything You Need for</span>{" "}
            <span className="bg-gradient-to-r from-primary via-primary to-cyan-500 bg-clip-text text-transparent">
              Secure Exams
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive platform designed for educational institutions and enterprises to conduct secure, scalable
            online assessments.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group p-6 rounded-2xl bg-gradient-to-br from-background to-card border border-border hover:shadow-xl hover:border-primary/20 hover:-translate-y-2 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/90 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <feature.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
