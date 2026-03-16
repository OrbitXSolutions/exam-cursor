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
// Supports: **bold**, "highlighted", numbered lines (1️⃣ or 1.), bullet lines (- or •), → arrows
function RichText({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n")

  // Detect if content has list items
  const hasNumberedList = lines.some(
    (l) => /^[1-9]️⃣/.test(l.trim()) || /^[1-9]\.\s/.test(l.trim()) || /^[1-9]\)\s/.test(l.trim())
  )
  const hasBulletList = lines.some(
    (l) => /^[-•●]\s/.test(l.trim()) || /^[✅✏️🟢🟡🔴✨→←▸▹▪▫☑☐]\s?/.test(l.trim())
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

  // If only plain text (no lists), render as paragraph
  if (!hasNumberedList && !hasBulletList) {
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
    const bulletMatch = line.match(/^[-•●▪▫]\s+(.+)/) || line.match(/^[✅✏️🟢🟡🔴✨→←▸▹☑☐]\s*(.+)/)
    if (bulletMatch) {
      if (!currentList || currentList.type !== "ul") {
        flushList()
        currentList = { type: "ul", items: [] }
      }
      currentList.items.push(<>{formatInline(bulletMatch[1])}</>)
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
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-bold shadow-sm">
            {stepIndex + 1}
          </div>
          <div className="w-px h-full min-h-4 bg-gradient-to-b from-primary/30 to-border" />
        </div>

        {/* Step Content */}
        <div className="flex-1 pb-8 space-y-3">
          <h4 className="text-base font-semibold leading-tight pt-1.5">{title}</h4>

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
            <div className="flex items-start gap-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 shadow-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 shrink-0">
                <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                  {language === "ar" ? "نصيحة" : "Tip"}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">{tip}</p>
              </div>
            </div>
          )}

          {/* Note / Warning */}
          {note && (
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 shadow-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50 shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
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
    <div className="rounded-xl border bg-gradient-to-br from-green-50/80 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/10 border-green-200 dark:border-green-800 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        </div>
        <h5 className="text-sm font-semibold text-green-700 dark:text-green-400">{title}</h5>
      </div>
      <div className="rounded-lg bg-white/60 dark:bg-green-950/30 border border-green-100 dark:border-green-900 p-4">
        <RichText
          text={content}
          className="text-green-800 dark:text-green-300 [&_strong]:text-green-900 dark:[&_strong]:text-green-200"
        />
      </div>
    </div>
  )
}

// ─── Section Renderer ─────────────────────────
export function TutorialSectionRenderer({ section, language }: { section: TutorialSection; language: string }) {
  const title = language === "ar" ? section.titleAr : section.titleEn
  const description = language === "ar" ? section.descriptionAr : section.descriptionEn

  return (
    <div id={`section-${section.id}`} className="scroll-mt-24">
      <Card className="mb-8 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-xl">{title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </CardHeader>
        <CardContent className="space-y-2 pt-6">
          {/* Steps */}
          {section.steps.map((step, i) => (
            <StepCard key={step.id} step={step} stepIndex={i} language={language} />
          ))}

          {/* Examples */}
          {section.examples && section.examples.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {language === "ar" ? "أمثلة" : "Examples"}
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
      {mod.sections.map((section) => (
        <TutorialSectionRenderer key={section.id} section={section} language={language} />
      ))}
    </>
  )
}
