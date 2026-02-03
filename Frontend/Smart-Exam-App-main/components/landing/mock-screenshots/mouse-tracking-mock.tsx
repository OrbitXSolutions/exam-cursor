"use client"

import { MousePointer, Target, CheckCircle2 } from "lucide-react"

export function MouseTrackingMock() {
  return (
    <div className="w-full h-full bg-slate-900 text-white text-[10px] sm:text-xs p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MousePointer className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
          <span className="font-semibold text-sm sm:text-base">Mouse Boundary Tracker</span>
        </div>
        <span className="flex items-center gap-1 bg-teal-500/20 text-teal-400 px-2 py-1 rounded-full text-[10px] sm:text-xs">
          <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
          Tracking Active
        </span>
      </div>

      {/* Visual Tracking Area */}
      <div className="bg-slate-800 rounded-xl p-3 sm:p-4 mb-3">
        <div className="relative aspect-video bg-slate-700/50 rounded-lg border-2 border-dashed border-teal-500/50 overflow-hidden">
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="absolute w-full h-px bg-slate-500" style={{ top: `${(i + 1) * 12.5}%` }} />
            ))}
            {[...Array(12)].map((_, i) => (
              <div key={i} className="absolute h-full w-px bg-slate-500" style={{ left: `${(i + 1) * 8.33}%` }} />
            ))}
          </div>

          {/* Exam boundary indicator */}
          <div className="absolute inset-4 border-2 border-emerald-500/50 rounded-lg bg-emerald-500/5">
            <div className="absolute top-1 left-1 text-[8px] text-emerald-400">Safe Zone</div>
          </div>

          {/* Mouse cursor indicator */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-3 h-3 bg-teal-400 rounded-full animate-pulse" />
            <Target className="w-8 h-8 text-teal-400/50 absolute -top-2.5 -left-2.5" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-medium">Boundary Status</span>
          </div>
          <div className="text-emerald-400 text-sm sm:text-base font-semibold">Within Bounds</div>
          <div className="text-[8px] sm:text-xs text-slate-400">0 boundary violations</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-3">
          <div className="text-slate-400 text-[10px] sm:text-xs mb-1">Current Position</div>
          <div className="font-mono text-sm sm:text-base">X: 512, Y: 384</div>
          <div className="text-[8px] sm:text-xs text-emerald-400">Center of exam area</div>
        </div>
      </div>
    </div>
  )
}
