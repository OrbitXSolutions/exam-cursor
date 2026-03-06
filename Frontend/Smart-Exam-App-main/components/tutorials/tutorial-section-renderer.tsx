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
} from "lucide-react"
import type {
  TutorialModule,
  TutorialSection,
  TutorialStep,
  TutorialExample,
  TutorialField,
} from "@/lib/tutorials/tutorial-data"

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
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
            {stepIndex + 1}
          </div>
          <div className="w-px h-full min-h-4 bg-border" />
        </div>

        {/* Step Content */}
        <div className="flex-1 pb-6 space-y-3">
          <h4 className="text-base font-semibold">{title}</h4>

          {/* Description with proper line breaks */}
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {description}
          </div>

          {/* Image Placeholder */}
          {step.imagePlaceholder && (
            <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
              <p className="text-xs">
                {language === "ar" ? "صورة توضيحية" : "Screenshot placeholder"}
              </p>
              <p className="text-xs text-muted-foreground/60 font-mono">{step.imagePlaceholder}</p>
            </div>
          )}

          {/* Fields Table */}
          {step.fields && step.fields.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-start px-3 py-2 font-medium">
                      {language === "ar" ? "الحقل" : "Field"}
                    </th>
                    <th className="text-center px-3 py-2 font-medium w-24">
                      {language === "ar" ? "مطلوب" : "Required"}
                    </th>
                    <th className="text-start px-3 py-2 font-medium">
                      {language === "ar" ? "الوصف" : "Description"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {step.fields.map((field, fi) => (
                    <tr key={fi} className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium">
                        {language === "ar" ? field.nameAr : field.nameEn}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {field.required ? (
                          <Badge variant="destructive" className="text-xs">
                            {language === "ar" ? "مطلوب" : "Required"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {language === "ar" ? "اختياري" : "Optional"}
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
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
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
              <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">{tip}</p>
            </div>
          )}

          {/* Note / Warning */}
          {note && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">{note}</p>
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
    <div className="rounded-lg border bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <h5 className="text-sm font-semibold text-green-700 dark:text-green-400">{title}</h5>
      </div>
      <pre className="text-sm text-green-800 dark:text-green-300 whitespace-pre-wrap font-sans leading-relaxed">
        {content}
      </pre>
    </div>
  )
}

// ─── Section Renderer ─────────────────────────
export function TutorialSectionRenderer({ section, language }: { section: TutorialSection; language: string }) {
  const title = language === "ar" ? section.titleAr : section.titleEn
  const description = language === "ar" ? section.descriptionAr : section.descriptionEn

  return (
    <div id={`section-${section.id}`} className="scroll-mt-24">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </CardHeader>
        <CardContent className="space-y-2">
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

      {/* Video Placeholder */}
      {mod.videoPlaceholder && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
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
