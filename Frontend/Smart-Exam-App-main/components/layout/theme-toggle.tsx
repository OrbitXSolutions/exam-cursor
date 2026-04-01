"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme, accentColors, type AccentColor } from "@/lib/theme/context"
import { useI18n } from "@/lib/i18n/context"
import { localizeText } from "@/lib/i18n/runtime"
import { Moon, Palette, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { language, dir } = useI18n()
  const { theme, setTheme, accentColor, setAccentColor } = useTheme()

  const colorLabels: Record<AccentColor, string> = {
    emerald: localizeText("Emerald", "زمردي", language),
    blue: localizeText("Blue", "أزرق", language),
    violet: localizeText("Violet", "بنفسجي", language),
    amber: localizeText("Amber", "كهرماني", language),
    rose: localizeText("Rose", "وردي", language),
  }

  const colorClasses: Record<AccentColor, string> = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    violet: "bg-violet-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          {theme === "light" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="sr-only">
            {localizeText("Toggle theme", "تبديل المظهر", language)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" dir={dir}>
        <DropdownMenuLabel>
          {localizeText("Appearance", "المظهر", language)}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={theme === "light" ? "bg-accent" : ""}
        >
          <Sun className="h-4 w-4" />
          {localizeText("Light", "فاتح", language)}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={theme === "dark" ? "bg-accent" : ""}
        >
          <Moon className="h-4 w-4" />
          {localizeText("Dark", "داكن", language)}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          {localizeText("Accent Color", "اللون الأساسي", language)}
        </DropdownMenuLabel>
        <div className="grid grid-cols-5 gap-1 p-2">
          {(Object.keys(accentColors) as AccentColor[]).map((color) => (
            <button
              key={color}
              onClick={() => setAccentColor(color)}
              className={cn(
                "h-6 w-6 rounded-full transition-transform hover:scale-110",
                colorClasses[color],
                accentColor === color &&
                  "ring-2 ring-offset-2 ring-offset-background ring-primary",
              )}
              title={colorLabels[color]}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
