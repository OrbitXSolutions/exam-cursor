"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Clock, Headphones } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-600">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Examinations?
          </h2>
          <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
            Join hundreds of institutions worldwide who trust SmartExam for secure, scalable online assessments.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="https://www.build4it.com/contact" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 px-8 py-6 text-lg shadow-xl">
                Contact Us
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg bg-transparent"
              >
                Sign In
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: Shield, label: "SOC 2 Compliant" },
              { icon: Clock, label: "99.9% Uptime" },
              { icon: Headphones, label: "24/7 Support" },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 text-emerald-100">
                <badge.icon className="w-5 h-5" />
                <span className="font-medium">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
