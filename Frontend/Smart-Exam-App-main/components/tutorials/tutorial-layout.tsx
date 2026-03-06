"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  Library,
  Sparkles,
  ClipboardList,
  X,
} from "lucide-react"
import {
  allTutorialModules,
  tutorialModuleOrder,
  type TutorialModule,
  type TutorialSection,
} from "@/lib/tutorials/tutorial-data"

// Icon map
const iconMap: Record<string, React.ElementType> = {
  Library,
  Sparkles,
  BookOpen,
  ClipboardList,
}

interface TutorialLayoutProps {
  children: React.ReactNode
  currentModuleSlug: string
}

export function TutorialLayout({ children, currentModuleSlug }: TutorialLayoutProps) {
  const { language, isRTL } = useI18n()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

  // Current module
  const currentModule = allTutorialModules.find((m) => m.slug === currentModuleSlug)

  // Prev/Next module navigation
  const currentIndex = tutorialModuleOrder.indexOf(currentModuleSlug)
  const prevSlug = currentIndex > 0 ? tutorialModuleOrder[currentIndex - 1] : null
  const nextSlug = currentIndex < tutorialModuleOrder.length - 1 ? tutorialModuleOrder[currentIndex + 1] : null
  const prevModule = prevSlug ? allTutorialModules.find((m) => m.slug === prevSlug) : null
  const nextModule = nextSlug ? allTutorialModules.find((m) => m.slug === nextSlug) : null

  // Global search across all tutorial content
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    const results: { module: TutorialModule; section: TutorialSection; matchField: string }[] = []

    allTutorialModules.forEach((mod) => {
      mod.sections.forEach((section) => {
        const titleMatch =
          (language === "ar" ? section.titleAr : section.titleEn).toLowerCase().includes(q)
        const descMatch =
          (language === "ar" ? section.descriptionAr : section.descriptionEn).toLowerCase().includes(q)
        const stepMatch = section.steps.some((step) =>
          (language === "ar" ? step.titleAr : step.titleEn).toLowerCase().includes(q) ||
          (language === "ar" ? step.descriptionAr : step.descriptionEn).toLowerCase().includes(q)
        )

        if (titleMatch || descMatch || stepMatch) {
          results.push({
            module: mod,
            section,
            matchField: titleMatch ? "title" : descMatch ? "description" : "step",
          })
        }
      })
    })

    return results
  }, [searchQuery, language])

  // Auto-scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSectionId(sectionId)
    const el = document.getElementById(`section-${sectionId}`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  // Track active section on scroll
  useEffect(() => {
    if (!currentModule) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("section-", "")
            setActiveSectionId(id)
          }
        })
      },
      { rootMargin: "-100px 0px -50% 0px", threshold: 0.1 }
    )

    currentModule.sections.forEach((section) => {
      const el = document.getElementById(`section-${section.id}`)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [currentModule])

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar TOC */}
      <aside className="hidden lg:flex w-72 flex-col border-e bg-muted/30">
        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "ar" ? "البحث في الدليل..." : "Search tutorials..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 pe-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute end-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          {/* Search Results */}
          {searchQuery.trim() && (
            <div className="p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground px-2">
                {language === "ar"
                  ? `${searchResults.length} نتيجة`
                  : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""}`}
              </p>
              {searchResults.map((result, i) => (
                <Link
                  key={`${result.module.id}-${result.section.id}-${i}`}
                  href={`/tutorials/${result.module.slug}#section-${result.section.id}`}
                  onClick={() => {
                    setSearchQuery("")
                    if (result.module.slug === currentModuleSlug) {
                      scrollToSection(result.section.id)
                    }
                  }}
                  className="block rounded-lg p-2 hover:bg-accent text-sm"
                >
                  <p className="font-medium truncate">
                    {language === "ar" ? result.section.titleAr : result.section.titleEn}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {language === "ar" ? result.module.titleAr : result.module.titleEn}
                  </p>
                </Link>
              ))}
              {searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground px-2">
                  {language === "ar" ? "لا توجد نتائج" : "No results found"}
                </p>
              )}
            </div>
          )}

          {/* Module List + TOC */}
          {!searchQuery.trim() && (
            <div className="p-3 space-y-4">
              {/* All Modules */}
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
                  {language === "ar" ? "الأقسام" : "Modules"}
                </p>
                {allTutorialModules.map((mod) => {
                  const Icon = iconMap[mod.iconName] || BookOpen
                  const isActive = mod.slug === currentModuleSlug
                  return (
                    <Link
                      key={mod.id}
                      href={`/tutorials/${mod.slug}`}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {language === "ar" ? mod.titleAr : mod.titleEn}
                      </span>
                    </Link>
                  )
                })}
              </div>

              {/* Current Module TOC */}
              {currentModule && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
                    {language === "ar" ? "جدول المحتويات" : "Table of Contents"}
                  </p>
                  {currentModule.sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "flex items-center w-full text-start rounded-lg px-3 py-1.5 text-sm transition-colors",
                        activeSectionId === section.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <span className="truncate">
                        {language === "ar" ? section.titleAr : section.titleEn}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Back to Hub */}
        <div className="border-t p-3">
          <Link
            href="/tutorials"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {language === "ar" ? "العودة لدليل المستخدم" : "Back to User Guide"}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 min-h-0">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {children}
          </div>

          {/* Prev / Next Navigation */}
          <div className="max-w-4xl mx-auto px-6 pb-8">
            <div className="flex items-center justify-between border-t pt-6 mt-8">
              {prevModule ? (
                <Link
                  href={`/tutorials/${prevModule.slug}`}
                  className="group flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors max-w-xs"
                >
                  {isRTL ? (
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  ) : (
                    <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {language === "ar" ? "السابق" : "Previous"}
                    </p>
                    <p className="text-sm font-medium group-hover:text-primary">
                      {language === "ar" ? prevModule.titleAr : prevModule.titleEn}
                    </p>
                  </div>
                </Link>
              ) : (
                <div />
              )}
              {nextModule ? (
                <Link
                  href={`/tutorials/${nextModule.slug}`}
                  className="group flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors max-w-xs text-end"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {language === "ar" ? "التالي" : "Next"}
                    </p>
                    <p className="text-sm font-medium group-hover:text-primary">
                      {language === "ar" ? nextModule.titleAr : nextModule.titleEn}
                    </p>
                  </div>
                  {isRTL ? (
                    <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  )}
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
