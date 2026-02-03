"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

const faqs = [
  {
    question: "What types of exams can I create with SmartExam?",
    answer:
      "SmartExam supports multiple question types including Multiple Choice, True/False, Short Answer, Essay, Multi-Select, and even coding challenges. You can create timed exams, practice tests, certifications, and assessments for any subject.",
  },
  {
    question: "How does the AI proctoring work?",
    answer:
      "Our AI proctoring uses advanced computer vision and machine learning to monitor exam sessions. It detects tab switching, mouse boundary violations, multiple faces, face absence, and suspicious behaviors - all in real-time with instant alerts.",
  },
  {
    question: "Is SmartExam suitable for large-scale examinations?",
    answer:
      "SmartExam is built for enterprise scale. We've successfully handled examinations with over 100,000 concurrent candidates. Our infrastructure ensures 99.9% uptime and seamless performance.",
  },
  {
    question: "How long does it take to set up SmartExam?",
    answer:
      "Our team can have your fully customized exam platform ready within 2 weeks. This includes complete setup, branding, user training, and integration with your existing systems.",
  },
  {
    question: "What kind of support do you provide?",
    answer:
      "We provide comprehensive long-term technical support including dedicated account managers, 24/7 technical assistance during exam windows, regular system updates, and training sessions for your team.",
  },
  {
    question: "Can SmartExam integrate with our existing systems?",
    answer:
      "Yes! SmartExam offers robust API integration capabilities. We can integrate with your LMS, student information systems, HR platforms, and other enterprise software.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
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
    <section ref={sectionRef} id="faq" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-slate-900">Frequently Asked</span>{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need to know about SmartExam. Can't find what you're looking for? Contact our team.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl border border-slate-200 overflow-hidden transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <button
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  <span className="font-semibold text-slate-900">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-500 transition-transform ${openIndex === index ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`px-6 overflow-hidden transition-all duration-300 ${
                    openIndex === index ? "pb-4 max-h-96" : "max-h-0"
                  }`}
                >
                  <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/faq">
              <Button
                variant="outline"
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 bg-transparent"
              >
                View All FAQs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
