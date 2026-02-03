"use client"

import { TrendingUp, Download, Users, Award, Target } from "lucide-react"

export function ResultsAnalyticsMock() {
  return (
    <div className="w-full h-full bg-slate-900 text-white text-[10px] sm:text-xs p-2 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h2 className="text-sm sm:text-lg font-bold">Results & Analytics</h2>
          <p className="text-[8px] sm:text-xs text-slate-400">Final Mathematics Exam - 156 submissions</p>
        </div>
        <button className="bg-slate-800 px-2 py-1 rounded-lg flex items-center gap-1">
          <Download className="w-3 h-3" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-3 sm:mb-4">
        {[
          { label: "Average Score", value: "72.5%", icon: Target, color: "emerald" },
          { label: "Pass Rate", value: "84%", icon: Award, color: "blue" },
          { label: "Highest Score", value: "98%", icon: TrendingUp, color: "purple" },
          { label: "Submissions", value: "156", icon: Users, color: "amber" },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800 rounded-lg p-2 sm:p-3">
            <stat.icon className={`w-3 h-3 sm:w-4 sm:h-4 text-${stat.color}-400 mb-1`} />
            <div className="text-base sm:text-xl font-bold">{stat.value}</div>
            <div className="text-[8px] sm:text-xs text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Score Distribution */}
        <div className="bg-slate-800 rounded-lg p-2 sm:p-3">
          <h3 className="font-medium text-[10px] sm:text-sm mb-2">Score Distribution</h3>
          <div className="h-24 sm:h-32 flex items-end gap-1">
            {[
              { range: "0-20", count: 5, color: "bg-red-500" },
              { range: "21-40", count: 12, color: "bg-orange-500" },
              { range: "41-60", count: 28, color: "bg-amber-500" },
              { range: "61-80", count: 65, color: "bg-emerald-500" },
              { range: "81-100", count: 46, color: "bg-emerald-400" },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className={`w-full ${bar.color} rounded-t`} style={{ height: `${(bar.count / 65) * 100}%` }} />
                <span className="text-[6px] sm:text-[8px] text-slate-500">{bar.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pass/Fail Donut */}
        <div className="bg-slate-800 rounded-lg p-2 sm:p-3">
          <h3 className="font-medium text-[10px] sm:text-sm mb-2">Pass vs Fail</h3>
          <div className="flex items-center justify-center h-24 sm:h-32">
            <div className="relative w-20 h-20 sm:w-28 sm:h-28">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="12" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeDasharray={`${84 * 2.51} ${100 * 2.51}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg sm:text-2xl font-bold">84%</span>
                <span className="text-[8px] sm:text-xs text-slate-400">Passed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
