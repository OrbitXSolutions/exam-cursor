"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, X, GripHorizontal, Maximize2, Minimize2 } from "lucide-react"
import { createUniver, LocaleType } from "@univerjs/presets"
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core"
import sheetsCoreEnUS from "@univerjs/preset-sheets-core/locales/en-US"
// @ts-ignore - CSS module imported at runtime
import "@univerjs/preset-sheets-core/lib/index.css"

// ============================================
// SPREADSHEET BUTTON
// ============================================

interface SpreadsheetButtonProps {
  isOpen: boolean
  onClick: () => void
  label?: string
}

export function SpreadsheetButton({ isOpen, onClick, label = "Spreadsheet" }: SpreadsheetButtonProps) {
  return (
    <Button
      variant={isOpen ? "default" : "outline"}
      size="sm"
      className="gap-1.5"
      onClick={onClick}
    >
      <Sheet className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}

// ============================================
// EXAM SPREADSHEET (Univer)
// ============================================

interface ExamSpreadsheetProps {
  onClose: () => void
}

export function ExamSpreadsheet({ onClose }: ExamSpreadsheetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const univerRef = useRef<ReturnType<typeof createUniver> | null>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  const [isMaximized, setIsMaximized] = useState(false)
  const [position, setPosition] = useState({ x: 40, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  // Initialize Univer
  useEffect(() => {
    if (!containerRef.current) return

    const { univerAPI } = createUniver({
      locale: LocaleType.EN_US,
      locales: {
        [LocaleType.EN_US]: sheetsCoreEnUS,
      },
      presets: [
        UniverSheetsCorePreset({
          container: containerRef.current,
        }),
      ],
    })

    univerAPI.createWorkbook({ sheets: {} })
    univerRef.current = { univerAPI } as any

    return () => {
      univerAPI.dispose()
      univerRef.current = null
    }
  }, [])

  // Dragging logic
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return
    setIsDragging(true)
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
  }, [isMaximized, position])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, e.clientX - dragStart.current.x),
        y: Math.max(0, e.clientY - dragStart.current.y),
      })
    }

    const handleMouseUp = () => setIsDragging(false)

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  const toggleMaximize = () => setIsMaximized(prev => !prev)

  return (
    <div
      className="fixed z-50"
      style={
        isMaximized
          ? { top: 0, left: 0, right: 0, bottom: 0 }
          : { top: position.y, left: position.x }
      }
    >
      <div
        className={`flex flex-col bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl overflow-hidden ${
          isMaximized ? "w-full h-full rounded-none" : ""
        }`}
        style={isMaximized ? undefined : { width: 900, height: 560 }}
      >
        {/* Title bar */}
        <div
          ref={dragRef}
          onMouseDown={handleMouseDown}
          className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 select-none"
          style={{ cursor: isMaximized ? "default" : "move" }}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
            <GripHorizontal className="h-4 w-4 text-gray-400" />
            <Sheet className="h-4 w-4" />
            Spreadsheet
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleMaximize}>
              {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-100 hover:text-red-600" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Univer container */}
        <div ref={containerRef} className="flex-1" />
      </div>
    </div>
  )
}
