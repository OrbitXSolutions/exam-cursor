"use client"

interface PageHeaderProps {
  title: string
  subtitle?: string
  className?: string
}

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <div className={`border-b bg-background/95 px-6 py-4 ${className || ""}`}>
      <h1 className="text-lg font-semibold">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  )
}
