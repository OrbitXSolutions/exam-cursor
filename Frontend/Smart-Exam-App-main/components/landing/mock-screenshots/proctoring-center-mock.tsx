"use client"

import { Eye, Clock, AlertTriangle, MessageSquare, MoreVertical } from "lucide-react"
import Image from "next/image"

const sessions = [
  { name: "Ahmed Hassan", status: "normal", time: "45:23", progress: 65, image: "/people/student-1.jpg" },
  { name: "Sarah Johnson", status: "warning", time: "32:15", progress: 42, image: "/people/student-2.jpg" },
  { name: "Mike Chen", status: "normal", time: "58:41", progress: 78, image: "/people/student-3.jpg" },
  { name: "Fatima Ali", status: "alert", time: "28:09", progress: 35, image: "/people/student-4.jpg" },
  { name: "Alex Wilson", status: "normal", time: "51:33", progress: 70, image: "/people/student-5.jpg" },
  { name: "Noor Ahmed", status: "normal", time: "39:47", progress: 52, image: "/people/student-6.jpg" },
]

export function ProctoringCenterMock() {
  return (
    <div className="w-full h-full bg-slate-900 text-white text-[10px] sm:text-xs p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm sm:text-lg font-bold flex items-center gap-2">
            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            Live Proctoring Center
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-400">12 active sessions • 3 incidents pending</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-medium">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {sessions.map((session, i) => (
          <div
            key={i}
            className={`bg-slate-800/80 rounded-xl overflow-hidden border transition-all hover:scale-[1.02] ${
              session.status === "alert"
                ? "border-red-500/50 shadow-lg shadow-red-500/10"
                : session.status === "warning"
                  ? "border-amber-500/50 shadow-lg shadow-amber-500/10"
                  : "border-slate-700/50 hover:border-slate-600"
            }`}
          >
            {/* Video Feed with Real Person */}
            <div className="aspect-video bg-slate-700 relative overflow-hidden">
              <Image src={session.image || "/placeholder.svg"} alt={session.name} fill className="object-cover" />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

              {/* Status indicator */}
              {session.status !== "normal" && (
                <div
                  className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                    session.status === "alert" ? "bg-red-500" : "bg-amber-500"
                  } animate-pulse shadow-lg`}
                />
              )}

              {/* Action buttons */}
              <div className="absolute bottom-2 left-2 flex gap-1">
                <button className="w-6 h-6 rounded-full bg-slate-800/80 backdrop-blur-sm flex items-center justify-center hover:bg-slate-700 transition-colors">
                  <MessageSquare className="w-3 h-3 text-slate-300" />
                </button>
                <button className="w-6 h-6 rounded-full bg-slate-800/80 backdrop-blur-sm flex items-center justify-center hover:bg-slate-700 transition-colors">
                  <MoreVertical className="w-3 h-3 text-slate-300" />
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="p-2 sm:p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate text-[10px] sm:text-xs text-white">{session.name}</div>
                  <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-400">
                    <Clock className="w-2.5 h-2.5" />
                    {session.time}
                    {session.status === "alert" && (
                      <span className="flex items-center gap-0.5 text-red-400 ml-1">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Alert
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] sm:text-xs font-semibold text-emerald-400">{session.progress}%</div>
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    session.status === "alert"
                      ? "bg-red-500"
                      : session.status === "warning"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{ width: `${session.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
