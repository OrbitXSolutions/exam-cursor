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
import { Moon, Sun, Palette } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme()

  const colorLabels: Record<AccentColor, string> = {
    emerald: "Emerald",
    blue: "Blue",
    violet: "Violet",
    amber: "Amber",
    rose: "Rose",
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
          {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("light")} className={theme === "light" ? "bg-accent" : ""}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className={theme === "dark" ? "bg-accent" : ""}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Accent Color
        </DropdownMenuLabel>
        <div className="grid grid-cols-5 gap-1 p-2">
          {(Object.keys(accentColors) as AccentColor[]).map((color) => (
            <button
              key={color}
              onClick={() => setAccentColor(color)}
              className={cn(
                "h-6 w-6 rounded-full transition-transform hover:scale-110",
                colorClasses[color],
                accentColor === color && "ring-2 ring-offset-2 ring-offset-background ring-primary",
              )}
              title={colorLabels[color]}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
