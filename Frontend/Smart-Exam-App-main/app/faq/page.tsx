"use client"

import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { ChevronDown, Search, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const faqCategories = [
  {
    name: "General",
    faqs: [
      {
        question: "What is SmartExam?",
        answer:
          "SmartExam is an enterprise-grade online examination platform with AI-powered proctoring. It enables institutions to create, deliver, and manage secure online assessments at scale with features like question banks, automated grading, real-time proctoring, and comprehensive analytics.",
      },
      {
        question: "Who is SmartExam designed for?",
        answer:
          "SmartExam is designed for educational institutions, universities, certification bodies, corporate training departments, and any organization that needs to conduct secure online assessments. We serve clients ranging from small training centers to large government agencies.",
      },
      {
        question: "Is SmartExam available in multiple languages?",
        answer:
          "Yes! SmartExam supports multiple languages including English and Arabic with full RTL (Right-to-Left) support. We can add additional languages based on your requirements.",
      },
      {
        question: "How secure is SmartExam?",
        answer:
          "SmartExam is built with security as a top priority. We use industry-standard encryption, secure data centers, and are SOC 2 compliant. Our AI proctoring system provides multiple layers of exam integrity protection.",
      },
    ],
  },
  {
    name: "Proctoring",
    faqs: [
      {
        question: "What types of proctoring does SmartExam offer?",
        answer:
          "SmartExam offers AI-powered automated proctoring that includes tab switching detection, mouse boundary tracking, webcam monitoring, face detection and verification, and behavior analysis. You can also enable live proctor monitoring for high-stakes exams.",
      },
      {
        question: "How does tab switching detection work?",
        answer:
          "Our system monitors browser activity and instantly detects when a candidate switches to another tab or application. Each violation is logged with a timestamp and can trigger warnings or automatic exam termination based on your settings.",
      },
      {
        question: "What happens if a candidate's face is not detected?",
        answer:
          "If the AI cannot detect the candidate's face, it logs an incident and can be configured to show a warning, pause the exam, or notify a proctor. Continuous face absence beyond a threshold can automatically flag the session for review.",
      },
      {
        question: "Can SmartExam detect multiple people in the frame?",
        answer:
          "Yes, our face detection AI can identify when multiple people appear in the webcam frame. This triggers an immediate alert and incident log, helping prevent unauthorized assistance during exams.",
      },
    ],
  },
  {
    name: "Exams & Questions",
    faqs: [
      {
        question: "What question types are supported?",
        answer:
          "SmartExam supports Multiple Choice (single and multiple answers), True/False, Short Answer, Essay/Long Answer, Fill in the Blank, Matching, and Ordering questions. We also support code-based questions with auto-evaluation for programming assessments.",
      },
      {
        question: "Can I randomize questions and answers?",
        answer:
          "Yes! You can randomize question order, answer option order, or both. You can also create question pools where each candidate receives a random subset of questions, making it harder to share answers.",
      },
      {
        question: "How does the question bank work?",
        answer:
          "The question bank allows you to organize questions by category, subject, difficulty level, and tags. You can reuse questions across multiple exams, import questions in bulk via Excel/CSV, and track question performance analytics.",
      },
      {
        question: "Can I set different time limits for sections?",
        answer:
          "Yes, SmartExam supports section-based timing where each section can have its own time limit. You can also allow candidates to move between sections or lock them to complete sections sequentially.",
      },
    ],
  },
  {
    name: "Grading & Results",
    faqs: [
      {
        question: "How does automatic grading work?",
        answer:
          "Objective questions (MCQ, True/False, etc.) are graded automatically and instantly. Essay and short answer questions can be manually reviewed by instructors through our intuitive grading interface with rubric support.",
      },
      {
        question: "Can I set a passing score?",
        answer:
          "Yes, you can set passing scores as a percentage or absolute points. You can also set different passing criteria for different sections if needed.",
      },
      {
        question: "What analytics and reports are available?",
        answer:
          "SmartExam provides comprehensive analytics including score distributions, question-level analysis (difficulty, discrimination index), time analysis, comparison reports, and exportable data for external analysis. Custom reports can be configured.",
      },
      {
        question: "Can certificates be generated automatically?",
        answer:
          "Yes! You can design custom certificate templates and configure automatic generation when candidates meet passing criteria. Certificates include verification QR codes and can be downloaded or emailed directly.",
      },
    ],
  },
  {
    name: "Technical & Setup",
    faqs: [
      {
        question: "How long does implementation take?",
        answer:
          "Our standard implementation takes approximately 2 weeks from contract signing to go-live. This includes platform setup, customization, data migration (if needed), integration, and training. Complex implementations may take 4-6 weeks.",
      },
      {
        question: "Can SmartExam integrate with our existing systems?",
        answer:
          "Yes, SmartExam provides RESTful APIs for integration with LMS platforms (Moodle, Canvas, Blackboard), student information systems, HR systems, and SSO providers (SAML, OAuth). Custom integrations are available.",
      },
      {
        question: "What are the technical requirements for candidates?",
        answer:
          "Candidates need a modern web browser (Chrome, Firefox, Safari, Edge), stable internet connection (minimum 1 Mbps), and webcam/microphone for proctored exams. Our system works on Windows, Mac, and Linux.",
      },
      {
        question: "What kind of support do you provide?",
        answer:
          "We provide comprehensive support including dedicated account managers, email and phone support, 24/7 technical support during exam windows, regular training sessions, and detailed documentation. Enterprise clients get priority support SLAs.",
      },
    ],
  },
  {
    name: "Pricing & Plans",
    faqs: [
      {
        question: "How is SmartExam priced?",
        answer:
          "SmartExam offers flexible pricing based on your needs - per exam, per candidate, or annual licensing. Contact our sales team for a customized quote based on your expected usage and required features.",
      },
      {
        question: "Is there a free trial available?",
        answer:
          "We offer personalized demos and pilot programs for qualified organizations. Contact us to discuss your requirements and we'll set up a trial environment for your evaluation.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept bank transfers, credit cards, and purchase orders for enterprise clients. Payment terms can be customized for annual contracts.",
      },
      {
        question: "Can I upgrade my plan later?",
        answer:
          "Yes, you can upgrade your plan at any time to accommodate growth. Our team will help you transition smoothly to a higher tier with no disruption to your operations.",
      },
    ],
  },
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const filteredCategories = faqCategories
    .map((category) => ({
      ...category,
      faqs: category.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((category) => category.faqs.length > 0)

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="text-slate-900">Frequently Asked</span>{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Questions
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mb-8">
            Find answers to common questions about SmartExam. Can't find what you're looking for? Contact our team.
          </p>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-slate-200"
            />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600 mb-4">No questions found matching your search.</p>
                <Button variant="outline" onClick={() => setSearchQuery("")} className="bg-transparent">
                  Clear Search
                </Button>
              </div>
            ) : (
              <div className="space-y-12">
                {filteredCategories.map((category) => (
                  <div key={category.name}>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-2 border-b border-slate-200">
                      {category.name}
                    </h2>
                    <div className="space-y-3">
                      {category.faqs.map((faq, index) => {
                        const key = `${category.name}-${index}`
                        const isOpen = openItems[key]
                        return (
                          <div
                            key={key}
                            className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden hover:border-emerald-200 transition-colors"
                          >
                            <button
                              className="w-full px-6 py-4 flex items-center justify-between text-left"
                              onClick={() => toggleItem(key)}
                            >
                              <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
                              <ChevronDown
                                className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                              />
                            </button>
                            <div
                              className={`px-6 overflow-hidden transition-all duration-300 ${
                                isOpen ? "pb-4 max-h-96" : "max-h-0"
                              }`}
                            >
                              <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact CTA */}
          <div className="max-w-4xl mx-auto mt-16 text-center p-8 bg-emerald-50 rounded-2xl border border-emerald-100">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Still have questions?</h3>
            <p className="text-slate-600 mb-6">Our team is here to help you find the answers you need.</p>
            <Link href="https://www.build4it.com/contact" target="_blank" rel="noopener noreferrer">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Contact Support</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
