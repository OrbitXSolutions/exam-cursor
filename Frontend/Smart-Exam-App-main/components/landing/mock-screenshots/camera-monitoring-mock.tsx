"use client"

import { Camera, CheckCircle2, User } from "lucide-react"

export function CameraMonitoringMock() {
  return (
    <div className="w-full h-full bg-slate-900 text-white text-[10px] sm:text-xs p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          <span className="font-semibold text-sm sm:text-base">Camera Monitor</span>
        </div>
        <span className="flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-[10px] sm:text-xs">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          Recording
        </span>
      </div>

      {/* Camera Feed */}
      <div className="bg-slate-800 rounded-xl p-2 mb-3">
        <div className="relative aspect-video bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg overflow-hidden">
          {/* Simulated face detection overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-24 sm:w-28 sm:h-32 border-2 border-cyan-400 rounded-lg relative">
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400 rounded-tl" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-400 rounded-tr" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-400 rounded-bl" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400 rounded-br" />
              <User className="w-full h-full text-slate-600 p-4" />
            </div>
          </div>

          {/* Status overlay */}
          <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] sm:text-xs">Face Detected</span>
          </div>

          {/* Time overlay */}
          <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
            <span className="text-[9px] sm:text-xs font-mono">00:45:23</span>
          </div>
        </div>
      </div>

      {/* Camera Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Quality", value: "HD 720p", color: "emerald" },
          { label: "FPS", value: "30", color: "cyan" },
          { label: "Screenshots", value: "12", color: "purple" },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800 rounded-lg p-2 text-center">
            <div className={`text-sm sm:text-base font-semibold text-${stat.color}-400`}>{stat.value}</div>
            <div className="text-[8px] sm:text-xs text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
