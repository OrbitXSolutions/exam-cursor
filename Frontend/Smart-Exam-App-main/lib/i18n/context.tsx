"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { translations, type Language } from "./translations"

interface I18nContextType {
  language: Language
  locale: Language // Alias for language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
  isRTL: boolean
  dir: "ltr" | "rtl"
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language
    if (saved && (saved === "en" || saved === "ar")) {
      setLanguageState(saved)
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split(".")
    let value: unknown = translations[language]

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k]
      } else {
        return key
      }
    }

    let result = typeof value === "string" ? value : key
    
    // Replace parameters like {passScore} with actual values
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramValue))
      }
    }
    
    return result
  }

  const isRTL = language === "ar"
  const dir = isRTL ? "rtl" : "ltr"

  return <I18nContext.Provider value={{ language, locale: language, setLanguage, t, isRTL, dir }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}

// Helper to get localized field value
export function getLocalizedField<T extends Record<string, unknown>>(
  obj: T,
  fieldName: string,
  language: Language,
): string {
  const enKey = `${fieldName}En` as keyof T
  const arKey = `${fieldName}Ar` as keyof T

  if (language === "ar" && obj[arKey]) {
    return String(obj[arKey])
  }
  return String(obj[enKey] || "")
}
