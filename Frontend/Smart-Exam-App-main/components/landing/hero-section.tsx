"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Eye, MousePointer, MonitorSmartphone, Play, CheckCircle2 } from "lucide-react"

export function HeroSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-emerald-50/30">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-emerald-200/10 to-cyan-200/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-8 transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Shield className="w-4 h-4" />
            AI-Powered Exam Proctoring Platform
          </div>

          {/* Headline */}
          <h1
            className={`text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6 transition-all duration-700 delay-100 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="text-slate-900">Secure Online Exams</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className={`text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            SmartExam provides enterprise-grade proctoring with AI-powered monitoring, ensuring exam integrity while
            delivering a seamless experience for candidates and administrators.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-700 delay-300 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Link href="https://www.build4it.com/contact" target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/#how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-100 px-8 py-6 text-lg bg-white/50 backdrop-blur-sm hover:scale-105 transition-all duration-300"
              >
                <Play className="mr-2 w-5 h-5" />
                See How It Works
              </Button>
            </Link>
          </div>

          {/* Feature Pills */}
          <div
            className={`flex flex-wrap justify-center gap-4 transition-all duration-700 delay-400 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {[
              { icon: Eye, label: "Tab Detection" },
              { icon: MousePointer, label: "Mouse Tracking" },
              { icon: MonitorSmartphone, label: "Camera Monitoring" },
              { icon: Shield, label: "Face Detection" },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border border-slate-200 hover:shadow-lg hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300"
              >
                <feature.icon className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Image - Real Photo with Overlay */}
        <div
          className={`mt-16 max-w-6xl mx-auto transition-all duration-1000 delay-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-3xl blur-2xl" />

            {/* Main Image Container */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
              {/* Real Photo of Person Taking Exam */}
              <div className="relative aspect-[16/9]">
                <Image
                  src="/hero-person-taking-exam.jpg"
                  alt="Student taking online exam with SmartExam proctoring"
                  fill
                  className="object-cover"
                  priority
                />

                {/* Overlay with Dashboard Preview */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full max-w-2xl p-8 lg:p-12">
                      {/* Mini Dashboard */}
                      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                              <Eye className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <h3 className="text-white font-semibold">Proctoring Active</h3>
                              <p className="text-slate-400 text-sm">All systems normal</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1.5 rounded-full">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-emerald-400 text-sm font-medium">Live</span>
                          </div>
                        </div>

                        {/* Status Items */}
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: "Tab Focus", status: "Verified", icon: Eye },
                            { label: "Face Detected", status: "Active", icon: Shield },
                            { label: "Mouse Tracking", status: "Normal", icon: MousePointer },
                            { label: "Camera Feed", status: "HD Quality", icon: MonitorSmartphone },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2 bg-slate-700/50 rounded-lg p-3">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <div>
                                <p className="text-white text-sm font-medium">{item.label}</p>
                                <p className="text-slate-400 text-xs">{item.status}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-xl p-4 border border-slate-200 animate-float hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Exam Secure</p>
                  <p className="text-xs text-slate-500">No incidents detected</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl p-4 border border-slate-200 animate-float-delayed hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Live Proctoring</p>
                  <p className="text-xs text-slate-500">1,234 active sessions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
