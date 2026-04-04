"use client"

import { useState, useEffect, useCallback } from "react"
import { QRCodeSVG } from "qrcode.react"
import { useI18n } from "@/lib/i18n/context"
import {
  generateShareLink,
  getShareLink,
  revokeShareLink,
  type ExamShareLink,
} from "@/lib/api/exams"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import {
  Copy,
  Check,
  Link2,
  RefreshCw,
  Trash2,
  AlertCircle,
  Share2,
  Clock,
  Download,
} from "lucide-react"

interface ExamShareDialogProps {
  examId: number
  examTitle?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExamShareDialog({
  examId,
  examTitle,
  open,
  onOpenChange,
}: ExamShareDialogProps) {
  const { language } = useI18n()
  const isRTL = language === "ar"

  const [shareLink, setShareLink] = useState<ExamShareLink | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [copied, setCopied] = useState(false)

  const loadShareLink = useCallback(async () => {
    setLoading(true)
    try {
      const link = await getShareLink(examId)
      setShareLink(link)
    } catch {
      setShareLink(null)
    }
    setLoading(false)
  }, [examId])

  // Load existing share link when dialog opens
  useEffect(() => {
    if (open && examId) {
      setCopied(false)
      loadShareLink()
    }
  }, [open, examId, loadShareLink])

  async function handleGenerate() {
    setGenerating(true)
    try {
      const link = await generateShareLink(examId)
      setShareLink(link)
      toast.success(
        isRTL ? "تم إنشاء رابط المشاركة" : "Share link generated",
      )
    } catch (error: any) {
      toast.error(
        error?.message ||
          (isRTL ? "فشل في إنشاء الرابط" : "Failed to generate link"),
      )
    }
    setGenerating(false)
  }

  async function handleRevoke() {
    setRevoking(true)
    try {
      await revokeShareLink(examId)
      setShareLink(null)
      toast.success(isRTL ? "تم إلغاء الرابط" : "Share link revoked")
    } catch (error: any) {
      toast.error(
        error?.message ||
          (isRTL ? "فشل في إلغاء الرابط" : "Failed to revoke link"),
      )
    }
    setRevoking(false)
  }

  function getShareUrl(): string {
    if (!shareLink) return ""
    const origin =
      typeof window !== "undefined" ? window.location.origin : ""
    return `${origin}/share/${shareLink.shareToken}`
  }

  async function handleCopy() {
    const url = getShareUrl()
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success(isRTL ? "تم نسخ الرابط" : "Link copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(isRTL ? "فشل في النسخ" : "Failed to copy")
    }
  }

  function handleDownloadQR() {
    const svg = document.getElementById("share-qr-code")
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const link = document.createElement("a")
      link.download = `exam-share-qr-${examId}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    }
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: "1000px" }}>
        <DialogHeader className="items-center text-center pb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
            <Share2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-lg">
            {isRTL ? "مشاركة الاختبار" : "Share Exam"}
          </DialogTitle>
          {examTitle && (
            <p className="text-sm font-medium text-foreground mt-0.5">{examTitle}</p>
          )}
          <DialogDescription>
            {isRTL
              ? "شارك رابط الاختبار أو رمز QR مع المرشحين"
              : "Share exam link or QR code with candidates"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <LoadingSpinner size="md" />
          </div>
        ) : !shareLink ? (
          /* No link yet — generate */
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {isRTL
                  ? "سيتم إنشاء رابط فريد يمكن للمرشحين استخدامه للوصول إلى الاختبار دون تسجيل دخول."
                  : "A unique link will be generated that candidates can use to access the exam without login."}
              </p>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <LoadingSpinner size="sm" className="me-2" />
              ) : (
                <Link2 className="h-4 w-4 me-2" />
              )}
              {isRTL ? "إنشاء رابط المشاركة" : "Generate Share Link"}
            </Button>
          </div>
        ) : (
          /* Link exists — show QR + URL + actions */
          <div className="space-y-4 pt-2 max-w-[85%] mx-auto">
            {/* QR Code with download */}
            <div className="relative flex flex-col items-center gap-3 p-5 bg-white dark:bg-gray-950 rounded-xl border-2 border-dashed border-muted-foreground/20">
              <QRCodeSVG
                id="share-qr-code"
                value={getShareUrl()}
                size={200}
                level="M"
                includeMargin
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={handleDownloadQR}
              >
                <Download className="h-3.5 w-3.5 me-1.5" />
                {isRTL ? "تحميل QR" : "Download QR"}
              </Button>
            </div>

            {/* URL with copy */}
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 rounded-lg border bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground truncate text-start font-mono select-all">
                {getShareUrl()}
              </div>
              <Button variant="outline" size="icon" className="shrink-0 h-9 w-9" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Expiry notice */}
            {shareLink.expiresAt && (
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5 w-full">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {isRTL ? "ينتهي الرابط في:" : "Link expires at:"}{" "}
                  {new Date(shareLink.expiresAt).toLocaleString(
                    isRTL ? "ar-SA" : "en-US",
                    { timeZone: "Asia/Dubai" }
                  )}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 w-full pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <LoadingSpinner size="sm" className="me-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 me-2" />
                )}
                {isRTL ? "إعادة إنشاء" : "Regenerate"}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleRevoke}
                disabled={revoking}
              >
                {revoking ? (
                  <LoadingSpinner size="sm" className="me-2" />
                ) : (
                  <Trash2 className="h-4 w-4 me-2" />
                )}
                {isRTL ? "إلغاء الرابط" : "Revoke Link"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
