"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calculator,
  X,
  Minus,
  Plus,
  History,
  BookOpen,
  GripHorizontal,
  Delete,
  RotateCcw,
} from "lucide-react"
import {
  evaluateExpression,
  PV, FV, PMT, NPV, IRR, RATE,
  SUM, AVERAGE, MIN, MAX, COUNT, STDEV,
  type HistoryEntry,
} from "./calculator-engine"

// ============================================
// FORMULA REFERENCE DATA
// ============================================

const FORMULA_SECTIONS = [
  {
    title: "Financial",
    formulas: [
      { name: "PV", syntax: "PV(rate, nper, pmt, [fv], [type])", desc: "Present Value of an investment" },
      { name: "FV", syntax: "FV(rate, nper, pmt, [pv], [type])", desc: "Future Value of an investment" },
      { name: "PMT", syntax: "PMT(rate, nper, pv, [fv], [type])", desc: "Payment per period" },
      { name: "NPV", syntax: "NPV(rate, cf1, cf2, ...)", desc: "Net Present Value" },
      { name: "IRR", syntax: "IRR(cf0, cf1, cf2, ...)", desc: "Internal Rate of Return" },
      { name: "RATE", syntax: "RATE(nper, pmt, pv, [fv], [type])", desc: "Interest rate per period" },
    ],
  },
  {
    title: "Statistical",
    formulas: [
      { name: "SUM", syntax: "SUM(v1, v2, ...)", desc: "Sum of values" },
      { name: "AVERAGE", syntax: "AVERAGE(v1, v2, ...)", desc: "Arithmetic mean" },
      { name: "MIN", syntax: "MIN(v1, v2, ...)", desc: "Minimum value" },
      { name: "MAX", syntax: "MAX(v1, v2, ...)", desc: "Maximum value" },
      { name: "COUNT", syntax: "COUNT(v1, v2, ...)", desc: "Number of values" },
      { name: "STDEV", syntax: "STDEV(v1, v2, ...)", desc: "Sample standard deviation" },
    ],
  },
  {
    title: "Scientific",
    formulas: [
      { name: "sin(x)", syntax: "sin(radians)", desc: "Sine function" },
      { name: "cos(x)", syntax: "cos(radians)", desc: "Cosine function" },
      { name: "tan(x)", syntax: "tan(radians)", desc: "Tangent function" },
      { name: "log(x)", syntax: "log(number)", desc: "Base-10 logarithm" },
      { name: "ln(x)", syntax: "ln(number)", desc: "Natural logarithm" },
      { name: "√x", syntax: "√(number)", desc: "Square root" },
      { name: "x^y", syntax: "base ^ exponent", desc: "Power / exponent" },
      { name: "π", syntax: "π ≈ 3.14159", desc: "Pi constant" },
      { name: "e", syntax: "e ≈ 2.71828", desc: "Euler's number" },
    ],
  },
]

// ============================================
// DRAGGABLE CALCULATOR COMPONENT
// ============================================

interface ExamCalculatorProps {
  onClose: () => void
}

export function ExamCalculator({ onClose }: ExamCalculatorProps) {
  const [display, setDisplay] = useState("0")
  const [expression, setExpression] = useState("")
  const [memory, setMemory] = useState(0)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [activeTab, setActiveTab] = useState("calc")
  const [calcMode, setCalcMode] = useState<"basic" | "scientific" | "financial" | "statistical">("basic")
  const [isMinimized, setIsMinimized] = useState(false)
  const [fnInputMode, setFnInputMode] = useState<string | null>(null)
  const [fnArgs, setFnArgs] = useState<string[]>([])
  const [fnArgLabels, setFnArgLabels] = useState<string[]>([])
  const [fnArgIndex, setFnArgIndex] = useState(0)

  // Dragging state — use lazy initializer to avoid SSR crash (window not available on server)
  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") return { x: 100, y: 80 }
    return { x: Math.max(0, window.innerWidth - 420), y: 80 }
  })
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const panelRef = useRef<HTMLDivElement>(null)

  // Drag handlers — mouse
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
  }, [position])

  // Drag handlers — touch (mobile/tablet support)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    dragOffset.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    }
  }, [position])

  useEffect(() => {
    if (!isDragging) return
    const clampPosition = (clientX: number, clientY: number) => ({
      x: Math.max(0, Math.min(window.innerWidth - 380, clientX - dragOffset.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 100, clientY - dragOffset.current.y)),
    })
    const handleMouseMove = (e: MouseEvent) => {
      setPosition(clampPosition(e.clientX, e.clientY))
    }
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      setPosition(clampPosition(touch.clientX, touch.clientY))
    }
    const handleEnd = () => setIsDragging(false)
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleEnd)
    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    window.addEventListener("touchend", handleEnd)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleEnd)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleEnd)
    }
  }, [isDragging])

  // ---- INPUT HANDLERS ----

  const appendToDisplay = (char: string) => {
    if (fnInputMode) {
      // We're filling a function argument
      const updated = [...fnArgs]
      updated[fnArgIndex] = (updated[fnArgIndex] || "") + char
      setFnArgs(updated)
      return
    }
    if (display === "0" && char !== ".") {
      setDisplay(char)
    } else {
      setDisplay(display + char)
    }
    setExpression(expression + char)
  }

  const appendOperator = (op: string) => {
    if (fnInputMode) return
    setDisplay(display + ` ${op} `)
    setExpression(expression + op)
  }

  const clearAll = () => {
    setDisplay("0")
    setExpression("")
    setFnInputMode(null)
    setFnArgs([])
    setFnArgLabels([])
    setFnArgIndex(0)
  }

  const backspace = () => {
    if (fnInputMode) {
      const updated = [...fnArgs]
      updated[fnArgIndex] = (updated[fnArgIndex] || "").slice(0, -1)
      setFnArgs(updated)
      return
    }
    if (display.length <= 1) {
      setDisplay("0")
      setExpression("")
    } else {
      setDisplay(display.slice(0, -1))
      setExpression(expression.slice(0, -1))
    }
  }

  const calculate = () => {
    if (fnInputMode) {
      executeFnCalculation()
      return
    }
    try {
      const result = evaluateExpression(expression || display.replace(/\s/g, ""))
      const resultStr = formatNumber(result)
      addHistory(display, resultStr)
      setDisplay(resultStr)
      setExpression(resultStr)
    } catch {
      setDisplay("Error")
      setExpression("")
    }
  }

  const formatNumber = (n: number) => {
    if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString()
    const fixed = n.toFixed(10).replace(/\.?0+$/, "")
    return fixed.length > 15 ? n.toExponential(6) : fixed
  }

  const addHistory = (expr: string, result: string) => {
    setHistory(prev => [{ expression: expr, result }, ...prev].slice(0, 10))
  }

  // ---- MEMORY ----
  const memoryAdd = () => { setMemory(memory + parseFloat(display.replace(/[^0-9.\-e+]/g, "")) || 0) }
  const memorySub = () => { setMemory(memory - parseFloat(display.replace(/[^0-9.\-e+]/g, "")) || 0) }
  const memoryRecall = () => {
    const m = formatNumber(memory)
    setDisplay(m)
    setExpression(m)
  }
  const memoryClear = () => { setMemory(0) }

  // ---- SCIENTIFIC FUNCTIONS ----
  const insertFunction = (fn: string) => {
    setDisplay(display === "0" ? `${fn}(` : display + `${fn}(`)
    setExpression(expression + `${fn}(`)
  }

  const insertConstant = (constant: string) => {
    setDisplay(display === "0" ? constant : display + constant)
    setExpression(expression + constant)
  }

  // ---- FINANCIAL/STATISTICAL FUNCTION INPUT MODE ----

  // Whether a function supports variable-length args (can add/remove values)
  const isVariableArgFn = (name: string) => ["SUM", "AVERAGE", "MIN", "MAX", "COUNT", "STDEV", "NPV", "IRR"].includes(name)

  const startFnInput = (fnName: string, labels: string[]) => {
    setFnInputMode(fnName)
    setFnArgLabels(labels)
    setFnArgs(labels.map(() => ""))
    setFnArgIndex(0)
    setDisplay(`${fnName}( ${labels[0]}: _ )`)
  }

  const addFnArg = () => {
    if (!fnInputMode || fnArgLabels.length >= 20) return
    const nextNum = fnArgLabels.length + 1
    // For variable-arg functions, determine next label
    let newLabel: string
    if (["NPV"].includes(fnInputMode)) {
      newLabel = `cf${fnArgLabels.length}` // rate is arg0, so cf starts from 1
    } else if (["IRR"].includes(fnInputMode)) {
      newLabel = `cf${fnArgLabels.length}`
    } else {
      newLabel = `v${nextNum}`
    }
    setFnArgLabels(prev => [...prev, newLabel])
    setFnArgs(prev => [...prev, ""])
  }

  const removeFnArg = () => {
    if (!fnInputMode) return
    // Determine minimum args
    const minArgs = ["NPV"].includes(fnInputMode) ? 3 : ["IRR"].includes(fnInputMode) ? 3 : 2
    if (fnArgLabels.length <= minArgs) return
    setFnArgLabels(prev => prev.slice(0, -1))
    setFnArgs(prev => prev.slice(0, -1))
    if (fnArgIndex >= fnArgLabels.length - 1) {
      setFnArgIndex(fnArgLabels.length - 2)
    }
  }

  const nextFnArg = () => {
    if (fnArgIndex < fnArgLabels.length - 1) {
      const next = fnArgIndex + 1
      setFnArgIndex(next)
      setDisplay(`${fnInputMode}( ${fnArgLabels[next]}: _ )`)
    }
  }

  const prevFnArg = () => {
    if (fnArgIndex > 0) {
      const prev = fnArgIndex - 1
      setFnArgIndex(prev)
      setDisplay(`${fnInputMode}( ${fnArgLabels[prev]}: ${fnArgs[prev] || "_"} )`)
    }
  }

  const executeFnCalculation = () => {
    try {
      const args = fnArgs.map(a => parseFloat(a)).filter(a => !isNaN(a))
      if (args.length === 0) throw new Error("No valid arguments")
      let result: number

      switch (fnInputMode) {
        case "PV": result = PV(args[0], args[1], args[2], args[3] || 0, args[4] || 0); break
        case "FV": result = FV(args[0], args[1], args[2], args[3] || 0, args[4] || 0); break
        case "PMT": result = PMT(args[0], args[1], args[2], args[3] || 0, args[4] || 0); break
        case "NPV": result = NPV(args[0], args.slice(1)); break
        case "IRR": result = IRR(args); break
        case "RATE": result = RATE(args[0], args[1], args[2], args[3] || 0, args[4] || 0); break
        case "SUM": result = SUM(args); break
        case "AVERAGE": result = AVERAGE(args); break
        case "MIN": result = MIN(args); break
        case "MAX": result = MAX(args); break
        case "COUNT": result = COUNT(args); break
        case "STDEV": result = STDEV(args); break
        default: throw new Error("Unknown function")
      }

      const filledArgs = fnArgs.filter(a => a !== "" && !isNaN(parseFloat(a)))
      const exprStr = `${fnInputMode}(${filledArgs.join(", ")})`
      const resultStr = formatNumber(result)
      addHistory(exprStr, resultStr)
      setDisplay(resultStr)
      setExpression(resultStr)
      setFnInputMode(null)
      setFnArgs([])
      setFnArgLabels([])
      setFnArgIndex(0)
    } catch {
      setDisplay("Error")
      setFnInputMode(null)
      setFnArgs([])
    }
  }

  // ---- BUTTON RENDERERS ----

  const numBtn = (label: string, value?: string) => (
    <Button
      variant="outline"
      className="h-10 text-base font-medium hover:bg-accent"
      onClick={() => appendToDisplay(value ?? label)}
    >
      {label}
    </Button>
  )

  const opBtn = (label: string, value?: string) => (
    <Button
      variant="secondary"
      className="h-10 text-base font-semibold text-primary hover:bg-primary/10"
      onClick={() => appendOperator(value ?? label)}
    >
      {label}
    </Button>
  )

  const fnBtn = (label: string, onClick: () => void, className?: string) => (
    <Button
      variant="outline"
      className={`h-9 text-xs font-medium ${className ?? ""}`}
      onClick={onClick}
    >
      {label}
    </Button>
  )

  // ---- CURRENT FN ARG DISPLAY ----
  const fnArgDisplay = fnInputMode ? (
    <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-800 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{fnInputMode}</span>
        <div className="flex items-center gap-1">
          {isVariableArgFn(fnInputMode) && (
            <>
              <Button size="sm" variant="outline" className="h-5 w-5 p-0 text-[10px]" onClick={removeFnArg}
                disabled={fnArgLabels.length <= (["NPV", "IRR"].includes(fnInputMode) ? 3 : 2)}>
                <Minus className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" className="h-5 w-5 p-0 text-[10px]" onClick={addFnArg}
                disabled={fnArgLabels.length >= 20}>
                <Plus className="h-3 w-3" />
              </Button>
            </>
          )}
          <span className="text-[10px] text-muted-foreground ml-1">
            Arg {fnArgIndex + 1}/{fnArgLabels.length}
          </span>
        </div>
      </div>
      <div className="flex gap-1 flex-wrap">
        {fnArgLabels.map((label, i) => (
          <Badge
            key={i}
            variant={i === fnArgIndex ? "default" : "outline"}
            className={`text-[10px] cursor-pointer ${i === fnArgIndex ? "" : "opacity-60"}`}
            onClick={() => setFnArgIndex(i)}
          >
            {label}: {fnArgs[i] || "?"}
          </Badge>
        ))}
      </div>
      <div className="flex gap-1 mt-1">
        <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={prevFnArg} disabled={fnArgIndex === 0}>← Prev</Button>
        <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={nextFnArg} disabled={fnArgIndex >= fnArgLabels.length - 1}>Next →</Button>
        <Button size="sm" variant="default" className="h-7 text-xs flex-1" onClick={executeFnCalculation}>= Calc</Button>
      </div>
    </div>
  ) : null

  // ---- MINIMIZED VIEW ----
  if (isMinimized) {
    return (
      <div
        ref={panelRef}
        style={{ position: "fixed", left: position.x, top: position.y, zIndex: 9998 }}
        className="select-none"
      >
        <Card className="flex items-center gap-2 px-3 py-2 shadow-lg border-2 border-primary/30 cursor-move bg-background"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <Calculator className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium truncate max-w-40">{display}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMinimized(false)}>
            <GripHorizontal className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </Card>
      </div>
    )
  }

  // ---- FULL VIEW ----
  return (
    <div
      ref={panelRef}
      style={{ position: "fixed", left: position.x, top: position.y, zIndex: 9998 }}
      className="select-none"
    >
      <Card className="w-[370px] shadow-2xl border-2 border-primary/20 overflow-hidden">
        {/* Title bar — draggable */}
        <div
          className="flex items-center justify-between px-3 py-2 bg-primary/5 border-b cursor-move"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="flex items-center gap-2">
            <GripHorizontal className="h-4 w-4 text-muted-foreground" />
            <Calculator className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Calculator</span>
            {memory !== 0 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">M</Badge>}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMinimized(true)}>
              <Minus className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Tabs: Calculator | History | Formulas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full rounded-none h-9">
            <TabsTrigger value="calc" className="flex-1 text-xs gap-1">
              <Calculator className="h-3 w-3" /> Calc
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 text-xs gap-1">
              <History className="h-3 w-3" /> History
            </TabsTrigger>
            <TabsTrigger value="formulas" className="flex-1 text-xs gap-1">
              <BookOpen className="h-3 w-3" /> Formulas
            </TabsTrigger>
          </TabsList>

          {/* ===== CALCULATOR TAB ===== */}
          <TabsContent value="calc" className="mt-0 p-3 space-y-2">
            {/* Display */}
            <div className="bg-muted rounded-lg p-3 min-h-[60px] flex flex-col justify-end">
              {expression && !fnInputMode && (
                <p className="text-xs text-muted-foreground text-right truncate">{expression}</p>
              )}
              <p className="text-2xl font-mono font-bold text-right truncate">{display}</p>
            </div>

            {/* Function argument input */}
            {fnArgDisplay}

            {/* Mode selector */}
            <div className="flex gap-1">
              {(["basic", "scientific", "financial", "statistical"] as const).map(mode => (
                <Button
                  key={mode}
                  size="sm"
                  variant={calcMode === mode ? "default" : "outline"}
                  className="flex-1 h-7 text-[10px] capitalize"
                  onClick={() => setCalcMode(mode)}
                >
                  {mode}
                </Button>
              ))}
            </div>

            {/* Scientific row */}
            {calcMode === "scientific" && (
              <div className="grid grid-cols-5 gap-1">
                {fnBtn("sin", () => insertFunction("sin"))}
                {fnBtn("cos", () => insertFunction("cos"))}
                {fnBtn("tan", () => insertFunction("tan"))}
                {fnBtn("log", () => insertFunction("log"))}
                {fnBtn("ln", () => insertFunction("ln"))}
                {fnBtn("√", () => insertFunction("√"))}
                {fnBtn("x^y", () => appendOperator("^"))}
                {fnBtn("π", () => insertConstant("π"))}
                {fnBtn("e", () => insertConstant("e"))}
                {fnBtn("()", () => {
                  const open = (expression.match(/\(/g) || []).length
                  const close = (expression.match(/\)/g) || []).length
                  appendToDisplay(open > close ? ")" : "(")
                })}
              </div>
            )}

            {/* Financial row */}
            {calcMode === "financial" && (
              <div className="grid grid-cols-3 gap-1">
                {fnBtn("PV", () => startFnInput("PV", ["rate", "nper", "pmt", "fv", "type"]), "bg-emerald-50 dark:bg-emerald-900/20")}
                {fnBtn("FV", () => startFnInput("FV", ["rate", "nper", "pmt", "pv", "type"]), "bg-emerald-50 dark:bg-emerald-900/20")}
                {fnBtn("PMT", () => startFnInput("PMT", ["rate", "nper", "pv", "fv", "type"]), "bg-emerald-50 dark:bg-emerald-900/20")}
                {fnBtn("NPV", () => startFnInput("NPV", ["rate", "cf1", "cf2"]), "bg-emerald-50 dark:bg-emerald-900/20")}
                {fnBtn("IRR", () => startFnInput("IRR", ["cf0", "cf1", "cf2"]), "bg-emerald-50 dark:bg-emerald-900/20")}
                {fnBtn("RATE", () => startFnInput("RATE", ["nper", "pmt", "pv", "fv", "type"]), "bg-emerald-50 dark:bg-emerald-900/20")}
              </div>
            )}

            {/* Statistical row */}
            {calcMode === "statistical" && (
              <div className="grid grid-cols-3 gap-1">
                {fnBtn("SUM", () => startFnInput("SUM", ["v1", "v2"]), "bg-violet-50 dark:bg-violet-900/20")}
                {fnBtn("AVG", () => startFnInput("AVERAGE", ["v1", "v2"]), "bg-violet-50 dark:bg-violet-900/20")}
                {fnBtn("MIN", () => startFnInput("MIN", ["v1", "v2"]), "bg-violet-50 dark:bg-violet-900/20")}
                {fnBtn("MAX", () => startFnInput("MAX", ["v1", "v2"]), "bg-violet-50 dark:bg-violet-900/20")}
                {fnBtn("COUNT", () => startFnInput("COUNT", ["v1", "v2"]), "bg-violet-50 dark:bg-violet-900/20")}
                {fnBtn("STDEV", () => startFnInput("STDEV", ["v1", "v2"]), "bg-violet-50 dark:bg-violet-900/20")}
              </div>
            )}

            {/* Memory row */}
            <div className="grid grid-cols-4 gap-1">
              {fnBtn("MC", memoryClear)}
              {fnBtn("MR", memoryRecall)}
              {fnBtn("M+", memoryAdd)}
              {fnBtn("M−", memorySub)}
            </div>

            {/* Main keypad */}
            <div className="grid grid-cols-4 gap-1">
              <Button variant="destructive" className="h-10 text-sm" onClick={clearAll}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              {opBtn("(")}{opBtn(")")}{opBtn("÷", "/")}
              {numBtn("7")}{numBtn("8")}{numBtn("9")}{opBtn("×", "*")}
              {numBtn("4")}{numBtn("5")}{numBtn("6")}{opBtn("−", "-")}
              {numBtn("1")}{numBtn("2")}{numBtn("3")}{opBtn("+", "+")}
              {numBtn("0")}
              {numBtn(".")}
              <Button variant="outline" className="h-10" onClick={backspace}>
                <Delete className="h-4 w-4" />
              </Button>
              <Button className="h-10 text-base font-bold bg-primary" onClick={calculate}>
                =
              </Button>
            </div>

            {/* Percent */}
            <div className="grid grid-cols-4 gap-1">
              {opBtn("%")}
              {fnBtn("±", () => {
                if (display.startsWith("-")) {
                  setDisplay(display.slice(1))
                  setExpression(expression.startsWith("-") ? expression.slice(1) : expression)
                } else {
                  setDisplay("-" + display)
                  setExpression("-" + expression)
                }
              })}
              <div className="col-span-2" />
            </div>
          </TabsContent>

          {/* ===== HISTORY TAB ===== */}
          <TabsContent value="history" className="mt-0">
            <ScrollArea className="h-[380px] p-3">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                  <History className="h-8 w-8 mb-2 opacity-30" />
                  <p>No calculations yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((entry, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-md bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => {
                        setDisplay(entry.result)
                        setExpression(entry.result)
                        setActiveTab("calc")
                      }}
                    >
                      <p className="text-xs text-muted-foreground truncate">{entry.expression}</p>
                      <p className="text-sm font-mono font-bold text-right">= {entry.result}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* ===== FORMULAS REFERENCE TAB ===== */}
          <TabsContent value="formulas" className="mt-0">
            <ScrollArea className="h-[380px] p-3">
              <div className="space-y-4">
                {FORMULA_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                      {section.title}
                    </h4>
                    <div className="space-y-1.5">
                      {section.formulas.map((f) => (
                        <div key={f.name} className="p-2 rounded-md bg-muted/40 hover:bg-muted/70 transition-colors">
                          <p className="text-xs font-mono font-semibold text-primary">{f.syntax}</p>
                          <p className="text-[11px] text-muted-foreground">{f.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}

// ============================================
// CALCULATOR TOGGLE BUTTON
// ============================================

interface CalculatorButtonProps {
  isOpen: boolean
  onClick: () => void
}

export function CalculatorButton({ isOpen, onClick }: CalculatorButtonProps) {
  return (
    <Button
      variant={isOpen ? "default" : "outline"}
      size="sm"
      className="gap-1.5"
      onClick={onClick}
    >
      <Calculator className="h-4 w-4" />
      <span className="hidden sm:inline">Calculator</span>
    </Button>
  )
}
