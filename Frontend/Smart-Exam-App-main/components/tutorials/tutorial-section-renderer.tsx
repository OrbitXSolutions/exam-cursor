"use client"

import type React from "react"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  ImageIcon,
  ArrowRight,
  ArrowLeft,
  FileText,
  PlayCircle,
  Video,
  ChevronRight,
  Circle,
} from "lucide-react"
import type {
  TutorialModule,
  TutorialSection,
  TutorialStep,
  TutorialExample,
  TutorialField,
} from "@/lib/tutorials/tutorial-data"

// ─── Rich Text Parser ─────────────────────────
// Supports: **bold**, "highlighted", numbered lines (1️⃣ or 1.), bullet lines (- or •), ✓/✗/❌ markers, pipe tables, → arrows, flow diagrams
function RichText({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n")

  // Detect if content has pipe-delimited table
  const hasTable = lines.filter((l) => l.trim().startsWith("|") && l.trim().endsWith("|")).length >= 2

  // Detect if content has list items
  const hasNumberedList = lines.some(
    (l) => /^[1-9]️⃣/.test(l.trim()) || /^[1-9][0-9]?\. /.test(l.trim()) || /^[1-9][0-9]?\)\s/.test(l.trim())
  )
  const hasBulletList = lines.some(
    (l) => /^[-•●]\s/.test(l.trim()) || /^[✅✏️🟢🟡🔴✨▸▹▪▫☑☐]\s?/.test(l.trim())
  )
  const hasCheckMarkers = lines.some(
    (l) => /^[✓✗❌]\s/.test(l.trim())
  )
  // Detect flow arrows (→ or ←) — lines with 3+ arrows are flow diagrams
  const hasFlowArrows = lines.some(
    (l) => (l.match(/[→←]/g) || []).length >= 2
  )

  // Inline formatting: **bold** and "highlighted"
  function formatInline(line: string): React.ReactNode[] {
    const parts: React.ReactNode[] = []
    let remaining = line
    let key = 0

    while (remaining.length > 0) {
      // Match **bold**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
      // Match "quoted" text
      const quoteMatch = remaining.match(/"([^"]+?)"/)

      if (boldMatch && (!quoteMatch || (boldMatch.index ?? 0) <= (quoteMatch.index ?? 0))) {
        const idx = boldMatch.index ?? 0
        if (idx > 0) parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>)
        parts.push(
          <strong key={key++} className="font-semibold text-foreground">
            {boldMatch[1]}
          </strong>
        )
        remaining = remaining.slice(idx + boldMatch[0].length)
      } else if (quoteMatch) {
        const idx = quoteMatch.index ?? 0
        if (idx > 0) parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>)
        parts.push(
          <span
            key={key++}
            className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium text-xs"
          >
            {quoteMatch[1]}
          </span>
        )
        remaining = remaining.slice(idx + quoteMatch[0].length)
      } else {
        parts.push(<span key={key++}>{remaining}</span>)
        remaining = ""
      }
    }
    return parts
  }

  // Render a flow line: split by → or ← and show as styled flow steps
  function renderFlowLine(line: string, key: number): React.ReactNode {
    // Determine arrow direction
    const isRTLFlow = line.includes("←") && !line.includes("→")
    const separator = isRTLFlow ? "←" : "→"
    const segments = line.split(separator).map((s) => s.trim()).filter(Boolean)

    if (segments.length < 2) {
      return (
        <p key={key} className="text-sm leading-relaxed">
          {formatInline(line)}
        </p>
      )
    }

    return (
      <div key={key} className="flex flex-wrap items-center gap-1.5 py-1">
        {segments.map((seg, i) => (
          <span key={i} className="contents">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-white/80 dark:bg-white/5 border border-current/10 text-sm font-medium shadow-sm">
              {formatInline(seg)}
            </span>
            {i < segments.length - 1 && (
              <span className="text-primary/60 mx-0.5">
                {isRTLFlow ? (
                  <ArrowLeft className="h-3.5 w-3.5 inline" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5 inline" />
                )}
              </span>
            )}
          </span>
        ))}
      </div>
    )
  }

  // Render pipe-delimited table
  if (hasTable) {
    const tableLines = lines.filter((l) => l.trim().startsWith("|") && l.trim().endsWith("|"))
    const dataLines = tableLines.filter((l) => !/^\|[\s-|]+\|$/.test(l.trim()))
    if (dataLines.length >= 2) {
      const parseRow = (row: string) =>
        row.split("|").slice(1, -1).map((c) => c.trim())
      const headers = parseRow(dataLines[0])
      const rows = dataLines.slice(1).map(parseRow)
      const nonTableLines = lines.filter(
        (l) => !(l.trim().startsWith("|") && l.trim().endsWith("|"))
      ).filter((l) => l.trim())
      return (
        <div className={cn("space-y-3", className)}>
          <div className="rounded-xl border overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  {headers.map((h, i) => (
                    <th key={i} className="text-start px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">
                      {formatInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-3 text-muted-foreground">
                        {cell.startsWith("✓") ? (
                          <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />{formatInline(cell.replace(/^✓\s*/, ""))}
                          </span>
                        ) : cell.startsWith("✗") ? (
                          <span className="inline-flex items-center gap-1.5 text-red-500 dark:text-red-400 font-medium">
                            <Circle className="h-3.5 w-3.5" />{formatInline(cell.replace(/^✗\s*/, ""))}
                          </span>
                        ) : (
                          <>{formatInline(cell)}</>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {nonTableLines.length > 0 && nonTableLines.map((l, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">{formatInline(l)}</p>
          ))}
        </div>
      )
    }
  }

  // If only plain text (no lists, no flow arrows, no check markers), render as paragraph
  if (!hasNumberedList && !hasBulletList && !hasFlowArrows && !hasCheckMarkers) {
    return (
      <div className={cn("text-sm text-muted-foreground leading-relaxed", className)}>
        {formatInline(text)}
      </div>
    )
  }

  // Render with list support
  const elements: React.ReactNode[] = []
  let currentList: { type: "ol" | "ul"; items: React.ReactNode[] } | null = null
  let elKey = 0

  function flushList() {
    if (!currentList) return
    if (currentList.type === "ol") {
      elements.push(
        <ol key={elKey++} className="space-y-2 my-2">
          {currentList.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed pt-0.5">{item}</span>
            </li>
          ))}
        </ol>
      )
    } else {
      elements.push(
        <ul key={elKey++} className="space-y-1.5 my-2">
          {currentList.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary mt-1" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )
    }
    currentList = null
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim()
    if (!line) {
      flushList()
      return
    }

    // Numbered list item: 1️⃣, 1., 1)
    const numMatch = line.match(/^[1-9]️⃣\s*(.+)/) || line.match(/^[1-9][0-9]?\.\s+(.+)/) || line.match(/^[1-9][0-9]?\)\s+(.+)/)
    if (numMatch) {
      if (!currentList || currentList.type !== "ol") {
        flushList()
        currentList = { type: "ol", items: [] }
      }
      currentList.items.push(<>{formatInline(numMatch[1])}</>)
      return
    }

    // Bullet list: -, •, ●, ✅, ✏️, etc.
    const bulletMatch = line.match(/^[-•●▪▫]\s+(.+)/) || line.match(/^[✅✏️🟢🟡🔴✨▸▹☑☐]\s*(.+)/)
    if (bulletMatch) {
      if (!currentList || currentList.type !== "ul") {
        flushList()
        currentList = { type: "ul", items: [] }
      }
      currentList.items.push(<>{formatInline(bulletMatch[1])}</>)
      return
    }

    // Check/cross markers: ✓, ✗, ❌
    const checkMatch = line.match(/^✓\s*(.+)/)
    const crossMatch = line.match(/^[✗❌]\s*(.+)/)
    if (checkMatch || crossMatch) {
      flushList()
      const isCheck = !!checkMatch
      const content = isCheck ? checkMatch![1] : crossMatch![1]
      elements.push(
        <div key={elKey++} className={cn(
          "flex items-start gap-2.5 text-sm py-1.5 px-3 rounded-lg my-0.5",
          isCheck
            ? "text-green-700 dark:text-green-300 bg-green-50/60 dark:bg-green-950/20"
            : "text-red-600 dark:text-red-400 bg-red-50/60 dark:bg-red-950/20"
        )}>
          {isCheck ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed font-medium">{formatInline(content)}</span>
        </div>
      )
      return
    }

    // Option-style lines: A) B) C) etc.
    const optionMatch = line.match(/^\s*[A-Zأ-ي]\)\s+(.+)/)
    if (optionMatch) {
      flushList()
      const hasCorrect = line.includes("✓")
      const hasWrong = line.includes("✗")
      elements.push(
        <div key={elKey++} className={cn(
          "flex items-center gap-2 text-sm py-1 px-3 rounded-md my-0.5 font-mono",
          hasCorrect ? "bg-green-50/80 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200/60 dark:border-green-800/40"
            : hasWrong ? "bg-muted/30 text-muted-foreground"
            : "text-muted-foreground"
        )}>
          <span className="leading-relaxed">{formatInline(line.trim())}</span>
        </div>
      )
      return
    }

    // Flow arrow line: contains 2+ → or ← arrows (e.g., "Step A → Step B → Step C")
    if (hasFlowArrows && ((line.match(/→/g) || []).length >= 2 || (line.match(/←/g) || []).length >= 2)) {
      flushList()
      elements.push(renderFlowLine(line, elKey++))
      return
    }

    // Plain text line
    flushList()
    elements.push(
      <p key={elKey++} className="text-sm text-muted-foreground leading-relaxed">
        {formatInline(line)}
      </p>
    )
  })

  flushList()

  return <div className={cn("space-y-1", className)}>{elements}</div>
}

// ─── Step Renderer ─────────────────────────────
function StepCard({ step, stepIndex, language }: { step: TutorialStep; stepIndex: number; language: string }) {
  const isRTL = language === "ar"
  const title = language === "ar" ? step.titleAr : step.titleEn
  const description = language === "ar" ? step.descriptionAr : step.descriptionEn
  const tip = language === "ar" ? step.tipAr : step.tipEn
  const note = language === "ar" ? step.noteAr : step.noteEn

  return (
    <div className="relative">
      {/* Step connector line */}
      <div className="flex items-start gap-4">
        {/* Step number */}
        <div className="flex flex-col items-center shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground text-sm font-bold shadow-md ring-2 ring-primary/20">
            {stepIndex + 1}
          </div>
          <div className="w-0.5 h-full min-h-4 bg-gradient-to-b from-primary/40 via-primary/15 to-transparent rounded-full" />
        </div>

        {/* Step Content */}
        <div className="flex-1 pb-8 space-y-3">
          <h4 className="text-base font-bold leading-tight pt-2 tracking-tight">{title}</h4>

          {/* Rich description */}
          <RichText text={description} />

          {/* Screenshot Image */}
          {step.imagePlaceholder && (
            <div className="rounded-lg border overflow-hidden bg-muted/10">
              <img
                src={`/api/backend-files${step.imagePlaceholder}`}
                alt={language === "ar" ? step.titleAr : step.titleEn}
                className="w-full h-auto rounded-lg"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <div className="hidden rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-8 flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
                <p className="text-xs">
                  {language === "ar" ? "صورة توضيحية" : "Screenshot placeholder"}
                </p>
                <p className="text-xs text-muted-foreground/60 font-mono">{step.imagePlaceholder}</p>
              </div>
            </div>
          )}

          {/* Fields Table */}
          {step.fields && step.fields.length > 0 && (
            <div className="rounded-xl border overflow-hidden shadow-sm">
              <div className="bg-muted/60 px-4 py-2 border-b">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {language === "ar" ? "الحقول" : "Fields Reference"}
                </h5>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b">
                    <th className="text-start px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">
                      {language === "ar" ? "الحقل" : "Field"}
                    </th>
                    <th className="text-center px-4 py-2.5 font-semibold text-xs uppercase tracking-wider w-28">
                      {language === "ar" ? "مطلوب" : "Required"}
                    </th>
                    <th className="text-start px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">
                      {language === "ar" ? "الوصف" : "Description"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {step.fields.map((field, fi) => (
                    <tr key={fi} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <code className="px-1.5 py-0.5 bg-primary/5 rounded text-primary text-xs font-semibold">
                          {language === "ar" ? field.nameAr : field.nameEn}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {field.required ? (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <Circle className="h-2 w-2 fill-current" />
                            {language === "ar" ? "مطلوب" : "Required"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Circle className="h-2 w-2" />
                            {language === "ar" ? "اختياري" : "Optional"}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-sm leading-relaxed">
                        {language === "ar" ? field.descriptionAr : field.descriptionEn}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tip */}
          {tip && (
            <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-sky-50/60 dark:from-blue-950/40 dark:to-sky-950/20 border border-blue-200/80 dark:border-blue-800/60 p-4 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-sky-600 shrink-0 shadow-sm">
                <Lightbulb className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider">
                  {language === "ar" ? "نصيحة" : "Pro Tip"}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">{tip}</p>
              </div>
            </div>
          )}

          {/* Note / Warning */}
          {note && (
            <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/60 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 p-4 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shrink-0 shadow-sm">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1 uppercase tracking-wider">
                  {language === "ar" ? "ملاحظة مهمة" : "Important"}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">{note}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Example Card ─────────────────────────────
function ExampleCard({ example, language }: { example: TutorialExample; language: string }) {
  const title = language === "ar" ? example.titleAr : example.titleEn
  const content = language === "ar" ? example.contentAr : example.contentEn

  return (
    <div className="rounded-xl border-2 bg-gradient-to-br from-green-50/90 via-emerald-50/60 to-teal-50/40 dark:from-green-950/30 dark:via-emerald-950/15 dark:to-teal-950/10 border-green-200/80 dark:border-green-800/60 p-5 shadow-sm">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-white" />
        </div>
        <h5 className="text-sm font-bold text-green-800 dark:text-green-300 tracking-tight">{title}</h5>
      </div>
      <div className="rounded-lg bg-white/70 dark:bg-green-950/40 border border-green-100/80 dark:border-green-900/50 p-4 backdrop-blur-sm">
        <RichText
          text={content}
          className="text-green-800 dark:text-green-300 [&_strong]:text-green-900 dark:[&_strong]:text-green-200 [&_ol]:space-y-2.5 [&_ul]:space-y-2"
        />
      </div>
    </div>
  )
}

// ─── Section Renderer ─────────────────────────
export function TutorialSectionRenderer({ section, language, sectionIndex }: { section: TutorialSection; language: string; sectionIndex?: number }) {
  const title = language === "ar" ? section.titleAr : section.titleEn
  const description = language === "ar" ? section.descriptionAr : section.descriptionEn

  return (
    <div id={`section-${section.id}`} className="scroll-mt-24">
      <Card className="mb-8 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-muted/40 via-muted/20 to-transparent pb-5">
          <div className="flex items-start gap-3">
            {sectionIndex !== undefined && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-bold shadow-sm shrink-0 mt-0.5">
                {sectionIndex + 1}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-6">
          {/* Steps */}
          {section.steps.map((step, i) => (
            <StepCard key={step.id} step={step} stepIndex={i} language={language} />
          ))}

          {/* Examples */}
          {section.examples && section.examples.length > 0 && (
            <div className="space-y-3 pt-5 mt-2 border-t-2 border-dashed border-green-200/60 dark:border-green-800/40">
              <h4 className="text-sm font-bold flex items-center gap-2.5 text-green-700 dark:text-green-400">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm">
                  <FileText className="h-3.5 w-3.5 text-white" />
                </div>
                {language === "ar" ? "أمثلة عملية" : "Practical Examples"}
              </h4>
              {section.examples.map((example, i) => (
                <ExampleCard key={i} example={example} language={language} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Module Header ─────────────────────────────
export function TutorialModuleHeader({ module: mod, language }: { module: TutorialModule; language: string }) {
  const title = language === "ar" ? mod.titleAr : mod.titleEn
  const description = language === "ar" ? mod.descriptionAr : mod.descriptionEn

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <a href="/tutorials" className="hover:text-primary transition-colors">
          {language === "ar" ? "دليل المستخدم" : "User Guide"}
        </a>
        <span>/</span>
        <span className="text-foreground font-medium">{title}</span>
      </div>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground leading-relaxed">{description}</p>

      {/* Tutorial Video */}
      {mod.videoPlaceholder && (
        <div className="mt-6 rounded-xl overflow-hidden border bg-black/5">
          <video
            src={`/api/backend-files${mod.videoPlaceholder}`}
            controls
            className="w-full h-auto rounded-xl"
            preload="metadata"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div className="hidden rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-12 flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <PlayCircle className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-medium">
              {language === "ar" ? "فيديو تعليمي" : "Tutorial Video"}
            </p>
            <p className="text-xs text-muted-foreground/60 font-mono">{mod.videoPlaceholder}</p>
            <p className="text-xs text-muted-foreground">
              {language === "ar" 
                ? "يمكن تحميل الفيديو في مجلد wwwroot/tutorials"
                : "Video can be uploaded to wwwroot/tutorials folder"}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Full Module Page Renderer ─────────────────
export function TutorialModulePage({ module: mod }: { module: TutorialModule }) {
  const { language } = useI18n()

  return (
    <>
      <TutorialModuleHeader module={mod} language={language} />
      {mod.sections.map((section, i) => (
        <TutorialSectionRenderer key={section.id} section={section} language={language} sectionIndex={i} />
      ))}
    </>
  )
}
