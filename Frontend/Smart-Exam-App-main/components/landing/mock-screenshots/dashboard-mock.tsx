"use client"

import {
  LayoutDashboard,
  Users,
  FileQuestion,
  ClipboardCheck,
  BarChart3,
  Settings,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react"

export function DashboardMock() {
  return (
    <div className="w-full h-full bg-slate-900 text-white flex text-[10px] sm:text-xs">
      {/* Sidebar */}
      <div className="w-12 sm:w-44 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-2 sm:p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="font-bold text-[8px] sm:text-xs">SE</span>
            </div>
            <span className="hidden sm:block font-semibold">SmartExam</span>
          </div>
        </div>
        <nav className="flex-1 p-2">
          {[
            { icon: LayoutDashboard, label: "Dashboard", active: true },
            { icon: FileQuestion, label: "Question Bank" },
            { icon: ClipboardCheck, label: "Exams" },
            { icon: Users, label: "Candidates" },
            { icon: BarChart3, label: "Analytics" },
            { icon: Settings, label: "Settings" },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-2 py-1.5 sm:py-2 rounded-lg mb-1 ${
                item.active ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:bg-slate-700"
              }`}
            >
              <item.icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:block">{item.label}</span>
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-10 sm:h-12 border-b border-slate-700 flex items-center justify-between px-2 sm:px-4">
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-2 py-1">
            <Search className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400 hidden sm:block">Search...</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] sm:text-xs font-medium">
              JD
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-2 sm:p-4 overflow-hidden">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
            {[
              { label: "Total Exams", value: "48", change: "+12%", up: true, icon: ClipboardCheck },
              { label: "Active Candidates", value: "1,234", change: "+8%", up: true, icon: Users },
              { label: "Pass Rate", value: "78%", change: "-2%", up: false, icon: TrendingUp },
              { label: "Avg. Score", value: "72.5", change: "+5%", up: true, icon: BarChart3 },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-2 sm:p-3">
                <div className="flex items-center justify-between mb-1">
                  <stat.icon className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                  <span
                    className={`text-[8px] sm:text-xs flex items-center gap-0.5 ${stat.up ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {stat.up ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                    {stat.change}
                  </span>
                </div>
                <div className="text-base sm:text-xl font-bold">{stat.value}</div>
                <div className="text-[8px] sm:text-xs text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Performance Chart */}
            <div className="col-span-2 bg-slate-800 rounded-lg p-2 sm:p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[10px] sm:text-sm">Exam Performance</span>
                <div className="flex items-center gap-1 text-[8px] sm:text-xs text-slate-400">
                  <span>This Month</span>
                  <ChevronDown className="w-2 h-2 sm:w-3 sm:h-3" />
                </div>
              </div>
              {/* Mock Chart */}
              <div className="h-20 sm:h-32 flex items-end gap-1 sm:gap-2">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 80].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-sm"
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[6px] sm:text-[8px] text-slate-500">{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800 rounded-lg p-2 sm:p-3">
              <span className="font-medium text-[10px] sm:text-sm block mb-2">Recent Activity</span>
              <div className="space-y-1.5 sm:space-y-2">
                {[
                  { icon: CheckCircle2, text: "Math Final submitted", time: "2m ago", color: "text-emerald-400" },
                  { icon: Clock, text: "Physics exam started", time: "15m ago", color: "text-blue-400" },
                  { icon: AlertTriangle, text: "Incident flagged", time: "1h ago", color: "text-amber-400" },
                  { icon: Users, text: "12 new candidates", time: "2h ago", color: "text-purple-400" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                    <item.icon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${item.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[8px] sm:text-xs truncate">{item.text}</div>
                      <div className="text-[6px] sm:text-[8px] text-slate-500">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
