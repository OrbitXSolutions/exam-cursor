"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Theme = "light" | "dark"
type AccentColor = "emerald" | "blue" | "violet" | "amber" | "rose"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  accentColor: AccentColor
  setAccentColor: (color: AccentColor) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const accentColors: Record<AccentColor, { primary: string; primaryForeground: string }> = {
  emerald: { primary: "160 84% 39%", primaryForeground: "0 0% 100%" },
  blue: { primary: "217 91% 60%", primaryForeground: "0 0% 100%" },
  violet: { primary: "263 70% 50%", primaryForeground: "0 0% 100%" },
  amber: { primary: "38 92% 50%", primaryForeground: "0 0% 0%" },
  rose: { primary: "346 77% 49%", primaryForeground: "0 0% 100%" },
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light")
  const [accentColor, setAccentColorState] = useState<AccentColor>("emerald")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("theme") as Theme
    const savedAccent = localStorage.getItem("accentColor") as AccentColor

    if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
      setThemeState(savedTheme)
    }
    if (savedAccent && accentColors[savedAccent]) {
      setAccentColorState(savedAccent)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)

    // Apply accent color CSS variables
    const colors = accentColors[accentColor]
    root.style.setProperty("--primary", colors.primary)
    root.style.setProperty("--primary-foreground", colors.primaryForeground)
  }, [theme, accentColor, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem("theme", newTheme)
  }

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color)
    localStorage.setItem("accentColor", color)
  }

  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accentColor, setAccentColor }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export { accentColors, type AccentColor, type Theme }
