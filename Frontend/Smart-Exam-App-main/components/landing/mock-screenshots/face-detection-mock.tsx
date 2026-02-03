"use client"

import { ScanFace, CheckCircle2, ShieldCheck, User } from "lucide-react"

export function FaceDetectionMock() {
  return (
    <div className="w-full h-full bg-slate-900 text-white text-[10px] sm:text-xs p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ScanFace className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          <span className="font-semibold text-sm sm:text-base">Face Detection & ID</span>
        </div>
        <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full text-[10px] sm:text-xs">
          <ShieldCheck className="w-3 h-3" />
          Verified
        </span>
      </div>

      {/* Face Scan Visual */}
      <div className="bg-slate-800 rounded-xl p-3 mb-3">
        <div className="flex gap-3 sm:gap-4 items-center">
          {/* Face scan animation */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
            <div className="absolute inset-0 border-2 border-blue-400 rounded-xl">
              <div className="absolute inset-0 border-2 border-blue-400/50 rounded-xl animate-ping" />
            </div>
            <div className="absolute inset-2 bg-slate-700 rounded-lg flex items-center justify-center">
              <User className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500" />
            </div>
            {/* Scan line */}
            <div
              className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"
              style={{ top: "50%" }}
            />
          </div>

          {/* Verification details */}
          <div className="flex-1 space-y-1.5 sm:space-y-2">
            {[
              { label: "Identity Match", value: "99.7%", status: "success" },
              { label: "Face Present", value: "Yes", status: "success" },
              { label: "Multiple Faces", value: "No", status: "success" },
              { label: "Gaze Direction", value: "Screen", status: "success" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-slate-400">{item.label}</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Verification Status */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
          <div>
            <div className="font-medium text-emerald-400">Identity Confirmed</div>
            <div className="text-[9px] sm:text-xs text-slate-400">Candidate verified against registered photo</div>
          </div>
        </div>
      </div>
    </div>
  )
}
