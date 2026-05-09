"use client"

import * as React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface SearchableSelectItem {
  id: number
  nameEn: string
  nameAr: string
}

export interface PaginatedResult<T> {
  items: T[]
  hasNextPage?: boolean
  totalCount?: number
}

export interface SearchableSelectInputProps {
  /** Controlled selected id value (string or number or null) */
  value: string | number | null
  /** Called with (id as string, display label) on selection */
  onChange: (value: string, label: string) => void
  /** Server fetch function: (search, pageNumber) => paginated result */
  fetchFn: (search: string, page: number) => Promise<PaginatedResult<SearchableSelectItem>>
  placeholder?: string
  disabled?: boolean
  /** "en" | "ar" — controls which name field is displayed */
  language?: "en" | "ar"
  /**
   * When this value changes, the component clears internal state and reloads page 1.
   * Use this to reset Topics when Subject changes.
   */
  resetOn?: unknown
  /**
   * Label to display immediately on mount before the list is fetched.
   * Use on edit pages where a value is already selected and the list hasn't loaded yet.
   */
  initialLabel?: string
  /** Extra className on the trigger button */
  className?: string
  /** ID forwarded to the trigger button for label association */
  id?: string
}

const DEBOUNCE_MS = 300

export function SearchableSelectInput({
  value,
  onChange,
  fetchFn,
  placeholder,
  disabled = false,
  language = "en",
  resetOn,
  initialLabel,
  className,
  id,
}: SearchableSelectInputProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [items, setItems] = useState<SearchableSelectItem[]>([])
  const [page, setPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<string>("")

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Seed selectedLabel from initialLabel on mount (edit-page pre-population)
  useEffect(() => {
    if (initialLabel && value && !selectedLabel) {
      setSelectedLabel(initialLabel)
    }
  // Only run when initialLabel/value become available — not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLabel, value])

  // Derive display label from current items whenever value changes
  useEffect(() => {
    if (!value) {
      setSelectedLabel("")
      return
    }
    const found = items.find((item) => String(item.id) === String(value))
    if (found) {
      setSelectedLabel(language === "ar" ? found.nameAr : found.nameEn)
    }
    // If not in current list (e.g., initial load) keep whatever was set before
  }, [value, items, language])

  // Reset and reload when resetOn changes (e.g., Subject changes → Topics reset)
  const prevResetOn = useRef(resetOn)
  useEffect(() => {
    if (prevResetOn.current === resetOn) return
    prevResetOn.current = resetOn

    setItems([])
    setPage(1)
    setHasNextPage(false)
    setSearch("")
    setSelectedLabel("")
  }, [resetOn])

  // Fetch page 1 when search changes (debounced)
  // Guard: skip entirely when disabled (avoids spurious fetches with invalid params on mount)
  useEffect(() => {
    if (disabled) return
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      loadPage(1, search, true)
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, disabled])

  // Load initial list when popover opens (if not already loaded)
  useEffect(() => {
    if (open && items.length === 0 && !isLoading) {
      loadPage(1, search, true)
    }
    // Focus search input when popover opens
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const loadPage = useCallback(
    async (pageNum: number, searchTerm: string, replace: boolean) => {
      if (replace) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      try {
        const result = await fetchFn(searchTerm, pageNum)
        const newItems = result?.items ?? []
        if (replace) {
          setItems(newItems)
        } else {
          setItems((prev) => [...prev, ...newItems])
        }
        setPage(pageNum)
        setHasNextPage(result?.hasNextPage ?? false)
      } catch {
        // silently fail — user can retry by searching again
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [fetchFn],
  )

  const handleLoadMore = () => {
    loadPage(page + 1, search, false)
  }

  const handleSelect = (item: SearchableSelectItem) => {
    const label = language === "ar" ? item.nameAr : item.nameEn
    setSelectedLabel(label)
    onChange(String(item.id), label)
    setOpen(false)
  }

  const displayLabel =
    value && selectedLabel
      ? selectedLabel
      : placeholder ?? (language === "ar" ? "اختر..." : "Select...")

  const hasValue = Boolean(value && selectedLabel)

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "border-2 h-11 w-full justify-between font-normal",
            !hasValue && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0" align="start">
        {/* Search input */}
        <div className="flex items-center border-b px-3 py-2 gap-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === "ar" ? "بحث..." : "Search..."}
            className="h-8 border-0 p-0 shadow-none focus-visible:ring-0 text-sm"
          />
        </div>

        {/* Items list */}
        <div className="max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {language === "ar" ? "لا توجد نتائج" : "No results found"}
            </p>
          ) : (
            <div className="p-1">
              {items.map((item) => {
                const label = language === "ar" ? item.nameAr : item.nameEn
                const isSelected = String(item.id) === String(value)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-start hover:bg-accent hover:text-accent-foreground transition-colors",
                      isSelected && "bg-accent text-accent-foreground font-medium",
                    )}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Load more */}
        {hasNextPage && !isLoading && (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <Loader2 className="h-3 w-3 animate-spin me-1" />
              ) : null}
              {language === "ar" ? "تحميل المزيد" : "Load more"}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
