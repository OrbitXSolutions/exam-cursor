"use client"

import { Eye, CheckCircle2 } from "lucide-react"

export function TabDetectionMock() {
  return (
    <div className="w-full h-full bg-slate-900 text-white text-[10px] sm:text-xs p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          <span className="font-semibold text-sm sm:text-base">Tab Switching Monitor</span>
        </div>
        <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full text-[10px] sm:text-xs">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Monitoring Active
        </span>
      </div>

      {/* Current Status */}
      <div className="bg-slate-800 rounded-xl p-3 sm:p-4 mb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
          </div>
          <div>
            <div className="font-medium text-sm sm:text-base">Exam Window Focused</div>
            <div className="text-slate-400 text-[10px] sm:text-xs">Candidate is within exam boundaries</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-700/50 rounded-lg p-2">
            <div className="text-lg sm:text-xl font-bold text-emerald-400">0</div>
            <div className="text-[8px] sm:text-xs text-slate-400">Tab Switches</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-2">
            <div className="text-lg sm:text-xl font-bold">45:23</div>
            <div className="text-[8px] sm:text-xs text-slate-400">Time Elapsed</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-2">
            <div className="text-lg sm:text-xl font-bold text-emerald-400">100%</div>
            <div className="text-[8px] sm:text-xs text-slate-400">Focus Time</div>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-slate-800 rounded-xl p-3">
        <div className="text-xs sm:text-sm font-medium mb-2">Activity Log</div>
        <div className="space-y-2">
          {[
            { time: "10:15:32", event: "Exam window focused", type: "success" },
            { time: "10:15:30", event: "Exam started", type: "info" },
            { time: "10:15:28", event: "Identity verified", type: "success" },
          ].map((log, i) => (
            <div key={i} className="flex items-center gap-2 text-[9px] sm:text-xs">
              <span className="text-slate-500 font-mono">{log.time}</span>
              <CheckCircle2 className={`w-3 h-3 ${log.type === "success" ? "text-emerald-400" : "text-blue-400"}`} />
              <span className="text-slate-300">{log.event}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
