"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare, CreditCard, Rocket, HeadphonesIcon, ArrowRight } from "lucide-react"

const steps = [
  {
    icon: MessageSquare,
    title: "Get in Touch",
    description:
      "Connect with our team to discuss your requirements and explore how SmartExam can transform your examination process.",
    color: "emerald",
  },
  {
    icon: CreditCard,
    title: "Simple Payment",
    description: "Choose a flexible pricing plan that fits your needs. Transparent pricing with no hidden fees.",
    color: "teal",
  },
  {
    icon: Rocket,
    title: "Launch in 2 Weeks",
    description:
      "Our expert team handles the complete setup. Your fully customized exam platform will be ready within 14 days.",
    color: "cyan",
  },
  {
    icon: HeadphonesIcon,
    title: "Ongoing Support",
    description:
      "Enjoy dedicated long-term technical support. We're here to ensure your success every step of the way.",
    color: "blue",
  },
]

export function GettingStartedSection() {
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
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Getting Started
            </span>{" "}
            <span className="text-slate-900">is Easy</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From initial consultation to launch, we make the process seamless and stress-free.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`relative p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-lg transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-emerald-500 text-white text-sm font-bold flex items-center justify-center shadow-lg">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                  <step.icon className="w-7 h-7 text-emerald-600" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>

                {/* Connector Arrow (except last) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="https://www.build4it.com/contact" target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 shadow-lg shadow-emerald-500/25"
              >
                Contact Us Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
