"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background px-4">
      <div className="text-center max-w-md mx-auto">
        {/* Animated 404 Number */}
        <div className="relative mb-6">
          <h1 className="text-[10rem] font-black leading-none text-primary/10 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-full bg-primary/10 animate-pulse">
              <Search className="h-12 w-12 text-primary" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Page Not Found
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Sorry, the page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 me-2" />
            Go Back
          </Button>
          <Button asChild>
            <Link href="/dashboard">
              <Home className="h-4 w-4 me-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
