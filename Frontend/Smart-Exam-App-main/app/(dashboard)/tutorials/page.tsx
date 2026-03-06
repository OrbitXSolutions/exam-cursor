"use client"

import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  BookOpen,
  Library,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  ClipboardList,
  Monitor,
  BarChart3,
  Settings,
  X,
} from "lucide-react"
import Link from "next/link"
import { useState, useMemo } from "react"
import {
  allTutorialModules,
  type TutorialModule,
} from "@/lib/tutorials/tutorial-data"
import type React from "react"

// Icon map for modules
const iconMap: Record<string, React.ElementType> = {
  Library,
  Sparkles,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Monitor,
  BarChart3,
  Settings,
}

export default function TutorialsPage() {
  const { language, isRTL } = useI18n()
  const [searchQuery, setSearchQuery] = useState("")

  // Global search across all tutorial content
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    const results: { module: TutorialModule; sectionId: string; sectionTitle: string; matchType: string }[] = []

    allTutorialModules.forEach((mod) => {
      // Module-level match
      const modTitle = (language === "ar" ? mod.titleAr : mod.titleEn).toLowerCase()
      const modDesc = (language === "ar" ? mod.descriptionAr : mod.descriptionEn).toLowerCase()
      if (modTitle.includes(q) || modDesc.includes(q)) {
        results.push({
          module: mod,
          sectionId: "",
          sectionTitle: language === "ar" ? mod.titleAr : mod.titleEn,
          matchType: "module",
        })
      }

      // Section-level match
      mod.sections.forEach((section) => {
        const sTitle = (language === "ar" ? section.titleAr : section.titleEn).toLowerCase()
        const sDesc = (language === "ar" ? section.descriptionAr : section.descriptionEn).toLowerCase()
        const stepMatch = section.steps.some((step) =>
          (language === "ar" ? step.titleAr : step.titleEn).toLowerCase().includes(q) ||
          (language === "ar" ? step.descriptionAr : step.descriptionEn).toLowerCase().includes(q)
        )
        if (sTitle.includes(q) || sDesc.includes(q) || stepMatch) {
          results.push({
            module: mod,
            sectionId: section.id,
            sectionTitle: language === "ar" ? section.titleAr : section.titleEn,
            matchType: "section",
          })
        }
      })
    })

    return results
  }, [searchQuery, language])

  // Group modules for display: available and coming soon
  const availableModules = allTutorialModules
  const comingSoonModules = [
    {
      titleEn: "Grading & Results",
      titleAr: "التصحيح والنتائج",
      descriptionEn: "Manual grading, AI-assisted grading, candidate results, and analytics.",
      descriptionAr: "التصحيح اليدوي، التصحيح بمساعدة AI، نتائج المرشحين، والتحليلات.",
      iconName: "GraduationCap",
    },
    {
      titleEn: "Proctor Center",
      titleAr: "مركز المراقبة",
      descriptionEn: "Live monitoring, AI proctoring, identity verification, and incident management.",
      descriptionAr: "المراقبة الحية، المراقبة بالذكاء الاصطناعي، التحقق من الهوية، وإدارة الحوادث.",
      iconName: "Monitor",
    },
    {
      titleEn: "Settings & Administration",
      titleAr: "الإعدادات والإدارة",
      descriptionEn: "User management, roles, permissions, organization settings, and audit logs.",
      descriptionAr: "إدارة المستخدمين، الأدوار، الصلاحيات، إعدادات المنظمة، وسجلات التدقيق.",
      iconName: "Settings",
    },
  ]

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {language === "ar" ? "دليل المستخدم" : "User Guide"}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {language === "ar"
              ? "تعلم كيفية استخدام نظام SmartExam بالكامل. اختر قسماً للبدء."
              : "Learn how to use the SmartExam system. Choose a module to get started."}
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={language === "ar" ? "البحث في جميع الأقسام..." : "Search all tutorials..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10 pe-10 h-11 text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute end-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery.trim() && (
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-3">
              {language === "ar"
                ? `${searchResults.length} نتيجة لـ "${searchQuery}"`
                : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""} for "${searchQuery}"`}
            </p>
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((result, i) => (
                  <Link
                    key={i}
                    href={
                      result.sectionId
                        ? `/tutorials/${result.module.slug}#section-${result.sectionId}`
                        : `/tutorials/${result.module.slug}`
                    }
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{result.sectionTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {language === "ar" ? result.module.titleAr : result.module.titleEn}
                      </p>
                    </div>
                    {isRTL ? (
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {language === "ar" ? "لا توجد نتائج" : "No results found"}
              </p>
            )}
          </div>
        )}

        {/* Available Modules */}
        {!searchQuery.trim() && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {language === "ar" ? "الأقسام المتاحة" : "Available Modules"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableModules.map((mod) => {
                  const Icon = iconMap[mod.iconName] || BookOpen
                  return (
                    <Link key={mod.id} href={`/tutorials/${mod.slug}`}>
                      <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-semibold group-hover:text-primary transition-colors">
                                  {language === "ar" ? mod.titleAr : mod.titleEn}
                                </h3>
                                <Badge variant="default" className="text-xs shrink-0">
                                  {mod.sections.length} {language === "ar" ? "أقسام" : "sections"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {language === "ar" ? mod.descriptionAr : mod.descriptionEn}
                              </p>
                            </div>
                            {isRTL ? (
                              <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0 mt-2" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0 mt-2" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Coming Soon */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                {language === "ar" ? "قريباً" : "Coming Soon"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comingSoonModules.map((mod, i) => {
                  const Icon = iconMap[mod.iconName] || BookOpen
                  return (
                    <Card key={i} className="h-full opacity-60">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground shrink-0">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base font-semibold">
                                {language === "ar" ? mod.titleAr : mod.titleEn}
                              </h3>
                              <Badge variant="secondary" className="text-xs shrink-0">
                                {language === "ar" ? "قريباً" : "Soon"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {language === "ar" ? mod.descriptionAr : mod.descriptionEn}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  )
}
