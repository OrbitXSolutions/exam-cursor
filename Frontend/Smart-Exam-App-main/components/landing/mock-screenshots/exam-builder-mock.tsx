"use client"

import { Plus, GripVertical, Clock, Shield, ChevronRight } from "lucide-react"

export function ExamBuilderMock() {
  return (
    <div className="w-full h-full bg-slate-900 text-white text-[10px] sm:text-xs p-2 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h2 className="text-sm sm:text-lg font-bold">Final Mathematics Exam</h2>
          <div className="flex items-center gap-2 sm:gap-3 text-[8px] sm:text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> 90 min
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Proctored
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Draft</span>
          </div>
        </div>
        <button className="bg-emerald-500 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium">
          Publish Exam
        </button>
      </div>

      {/* Sections */}
      <div className="space-y-2 sm:space-y-3">
        {[
          { name: "Section A: Algebra", questions: 10, points: 25 },
          { name: "Section B: Geometry", questions: 8, points: 20 },
          { name: "Section C: Calculus", questions: 12, points: 30 },
        ].map((section, i) => (
          <div key={i} className="bg-slate-800 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 p-2 sm:p-3 border-b border-slate-700">
              <GripVertical className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
              <div className="flex-1">
                <div className="font-medium text-[10px] sm:text-sm">{section.name}</div>
                <div className="text-[8px] sm:text-xs text-slate-400">
                  {section.questions} questions • {section.points} points
                </div>
              </div>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
            </div>
            <div className="p-2 space-y-1">
              {[1, 2, 3].map((q) => (
                <div key={q} className="flex items-center gap-2 p-1.5 bg-slate-700/50 rounded text-[8px] sm:text-xs">
                  <span className="w-4 h-4 sm:w-5 sm:h-5 bg-slate-600 rounded flex items-center justify-center text-[8px]">
                    {q}
                  </span>
                  <span className="flex-1 truncate text-slate-300">Question {q} preview text...</span>
                  <span className="text-slate-500">{Math.ceil(section.points / section.questions)} pts</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Add Section */}
        <button className="w-full p-2 sm:p-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-emerald-500 hover:text-emerald-400 flex items-center justify-center gap-2">
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          Add Section
        </button>
      </div>
    </div>
  )
}
