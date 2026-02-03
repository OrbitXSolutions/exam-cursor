"use client"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, MousePointer, Camera, ScanFace, CheckCircle } from "lucide-react"
import { TabDetectionMock, MouseTrackingMock, CameraMonitoringMock, FaceDetectionMock } from "./mock-screenshots"

const proctorFeatures = [
  {
    id: "tab",
    icon: Eye,
    title: "Tab Switching Detection",
    description:
      "Monitors browser activity and detects when candidates switch tabs or leave the exam window. Instantly flags suspicious behavior for review.",
    features: [
      "Real-time tab change alerts",
      "Window focus tracking",
      "Automatic incident logging",
      "Configurable warning thresholds",
    ],
    component: TabDetectionMock,
  },
  {
    id: "mouse",
    icon: MousePointer,
    title: "Mouse Boundary Tracking",
    description:
      "Tracks mouse movements and detects when the cursor leaves the exam area. Helps identify potential screen sharing or second monitor usage.",
    features: [
      "Cursor position monitoring",
      "Boundary violation alerts",
      "Movement pattern analysis",
      "Exit point tracking",
    ],
    component: MouseTrackingMock,
  },
  {
    id: "camera",
    icon: Camera,
    title: "Camera Monitoring",
    description:
      "Continuous webcam monitoring captures candidate activity throughout the exam. AI analyzes video feed for suspicious behaviors.",
    features: ["Live video capture", "Periodic screenshot capture", "Environment scanning", "Multi-person detection"],
    component: CameraMonitoringMock,
  },
  {
    id: "face",
    icon: ScanFace,
    title: "Face Detection & Verification",
    description:
      "Advanced AI verifies candidate identity and ensures continuous presence. Detects face absence, multiple faces, or identity mismatches.",
    features: [
      "Identity verification",
      "Continuous presence check",
      "Multiple face detection",
      "Gaze direction analysis",
    ],
    component: FaceDetectionMock,
  },
]

export function ProctorShowcase() {
  const [activeTab, setActiveTab] = useState("tab")
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null)
  const [userInteracted, setUserInteracted] = useState(false)

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

  // Auto-rotate tabs when user hasn't interacted
  useEffect(() => {
    if (!userInteracted) {
      autoRotateRef.current = setInterval(() => {
        setActiveTab((prev) => {
          const currentIndex = proctorFeatures.findIndex((f) => f.id === prev)
          const nextIndex = (currentIndex + 1) % proctorFeatures.length
          return proctorFeatures[nextIndex].id
        })
      }, 5000)
    }

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
      }
    }
  }, [userInteracted])

  const handleTabChange = (value: string) => {
    setUserInteracted(true)
    setActiveTab(value)
    if (autoRotateRef.current) {
      clearInterval(autoRotateRef.current)
    }
  }

  const activeFeature = proctorFeatures.find((f) => f.id === activeTab)

  return (
    <section ref={sectionRef} id="features" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              AI-Powered
            </span>{" "}
            <span className="text-slate-900">Exam Security</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Multiple layers of intelligent monitoring ensure exam integrity without disrupting the candidate experience.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="max-w-6xl mx-auto">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-white p-2 rounded-2xl shadow-md mb-8 h-auto">
            {proctorFeatures.map((feature) => (
              <TabsTrigger
                key={feature.id}
                value={feature.id}
                className="flex items-center gap-2 px-4 py-3 rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
              >
                <feature.icon className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">{feature.title.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {proctorFeatures.map((feature) => {
            const FeatureComponent = feature.component
            return (
              <TabsContent
                key={feature.id}
                value={feature.id}
                className={`transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <div className="grid lg:grid-cols-2 gap-8 items-center bg-white rounded-3xl p-8 shadow-lg border border-slate-200">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">{feature.title}</h3>
                    </div>
                    <p className="text-slate-600 mb-6 leading-relaxed">{feature.description}</p>
                    <ul className="space-y-3">
                      {feature.features.map((item) => (
                        <li key={item} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          <span className="text-slate-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Feature Visual - Using React Component */}
                  <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-slate-900">
                    <div className="aspect-video relative">
                      <FeatureComponent />
                    </div>

                    {/* Overlay with animated indicator */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-medium text-slate-700">Active</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )
          })}
        </Tabs>

        {/* Extra Read Section - All Features Cards */}
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {proctorFeatures.map((feature, index) => (
            <div
              key={feature.id}
              className={`group p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-xl hover:border-emerald-200 hover:-translate-y-2 transition-all duration-300 cursor-pointer ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
              onClick={() => handleTabChange(feature.id)}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">{feature.title}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
