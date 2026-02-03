"use client"

import { FileQuestion, Plus, Search, Filter, MoreVertical, CheckCircle2 } from "lucide-react"

export function QuestionBankMock() {
  return (
    <div className="w-full h-full bg-slate-900 text-white text-[10px] sm:text-xs p-2 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h2 className="text-sm sm:text-lg font-bold flex items-center gap-2">
            <FileQuestion className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            Question Bank
          </h2>
          <p className="text-[8px] sm:text-xs text-slate-400">248 questions across 12 categories</p>
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1 text-[10px] sm:text-xs font-medium">
          <Plus className="w-3 h-3" />
          <span className="hidden sm:inline">Add Question</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-3 sm:mb-4">
        <div className="flex-1 flex items-center gap-2 bg-slate-800 rounded-lg px-2 py-1.5">
          <Search className="w-3 h-3 text-slate-400" />
          <span className="text-slate-400">Search questions...</span>
        </div>
        <button className="bg-slate-800 px-2 py-1.5 rounded-lg flex items-center gap-1">
          <Filter className="w-3 h-3" />
          <span className="hidden sm:inline">Filter</span>
        </button>
      </div>

      {/* Questions Table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-2 p-2 border-b border-slate-700 text-[8px] sm:text-xs text-slate-400 font-medium">
          <div className="col-span-5">Question</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Difficulty</div>
          <div className="col-span-1"></div>
        </div>
        {[
          { q: "What is the derivative of x²?", cat: "Mathematics", type: "MCQ", diff: "Easy", color: "emerald" },
          { q: "Explain Newton's Third Law", cat: "Physics", type: "Essay", diff: "Medium", color: "amber" },
          { q: "Define photosynthesis process", cat: "Biology", type: "Short", diff: "Easy", color: "emerald" },
          { q: "Calculate compound interest", cat: "Finance", type: "MCQ", diff: "Hard", color: "red" },
          { q: "What causes ocean tides?", cat: "Science", type: "MCQ", diff: "Medium", color: "amber" },
        ].map((item, i) => (
          <div
            key={i}
            className="grid grid-cols-12 gap-2 p-2 border-b border-slate-700/50 items-center hover:bg-slate-700/50"
          >
            <div className="col-span-5 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span className="truncate">{item.q}</span>
            </div>
            <div className="col-span-2">
              <span className="bg-slate-700 px-1.5 py-0.5 rounded text-[8px]">{item.cat}</span>
            </div>
            <div className="col-span-2 text-slate-400">{item.type}</div>
            <div className="col-span-2">
              <span className={`text-${item.color}-400`}>{item.diff}</span>
            </div>
            <div className="col-span-1 text-right">
              <MoreVertical className="w-3 h-3 text-slate-400 inline" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
