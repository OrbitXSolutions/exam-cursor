"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { getSystemSettings, type BrandSettings } from "@/lib/api/admin"
import { getAttemptIdForCandidate } from "@/lib/api/results"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  ArrowLeft,
  Award,
  Download,
  ExternalLink,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Copy,
} from "lucide-react"
import { toast } from "sonner"

interface CertificateData {
  id: number
  certificateCode: string
  resultId: number
  examId: number
  attemptId: number
  examTitleEn: string
  examTitleAr: string
  candidateNameEn: string | null
  candidateNameAr: string | null
  score: number
  maxScore: number
  passScore: number
  issuedAt: string
  isRevoked: boolean
  downloadUrl: string
}

interface ResultData {
  id: number
  examId: number
  examTitleEn: string
  examTitleAr: string
  attemptId: number
  candidateId: string
  candidateName: string
  totalScore: number
  maxPossibleScore: number
  passScore: number
  percentage: number
  isPassed: boolean
  isPublishedToCandidate: boolean
  finalizedAt: string
}

function getLocalizedText(en: string | null | undefined, ar: string | null | undefined, language: string): string {
  return (language === "ar" ? ar : en) || en || ""
}

export default function CertificatePage() {
  const params = useParams<{ examId: string; candidateId: string }>()
  const examId = Number(params.examId)
  const candidateId = params.candidateId
  const router = useRouter()
  const { language, dir } = useI18n()

  const [certificate, setCertificate] = useState<CertificateData | null>(null)
  const [result, setResult] = useState<ResultData | null>(null)
  const [brand, setBrand] = useState<BrandSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCertificate() {
      try {
        setLoading(true)
        setError(null)
        setCertificate(null)
        setResult(null)

        const settings = await getSystemSettings()
        setBrand(settings?.brand ?? null)

        const attemptId = await getAttemptIdForCandidate(examId, candidateId)
        if (!attemptId) {
          setError(
            language === "ar"
              ? "لم يتم العثور على محاولة لهذا المرشح"
              : "No attempt found for this candidate"
          )
          return
        }

        try {
          const resultRes = await apiClient.get<{ data?: ResultData; Data?: ResultData } | ResultData>(
            `/ExamResult/attempt/${attemptId}`
          )
          const resultData =
            (resultRes as { data?: ResultData; Data?: ResultData })?.data ??
            (resultRes as { data?: ResultData; Data?: ResultData })?.Data ??
            (resultRes as ResultData)
          setResult(resultData ?? null)

          if (resultData?.id) {
            try {
              const certRes = await apiClient.get<
                { data?: CertificateData; Data?: CertificateData } | CertificateData
              >(`/Certificate/by-result/${resultData.id}`)
              const certData =
                (certRes as { data?: CertificateData; Data?: CertificateData })?.data ??
                (certRes as { data?: CertificateData; Data?: CertificateData })?.Data ??
                (certRes as CertificateData)
              if (certData?.certificateCode) {
                setCertificate(certData)
              }
            } catch {
              console.log("No certificate found for this result")
            }
          }
        } catch (err) {
          console.error("Failed to load result:", err)
          setResult(null)
        }
      } catch (err) {
        console.error("Failed to load certificate:", err)
        setError(language === "ar" ? "فشل في تحميل الشهادة" : "Failed to load certificate")
      } finally {
        setLoading(false)
      }
    }

    if (examId && candidateId) {
      loadCertificate()
    }
  }, [examId, candidateId, language])

  const copyCode = () => {
    if (certificate?.certificateCode) {
      navigator.clipboard.writeText(certificate.certificateCode)
      toast.success(language === "ar" ? "تم نسخ الكود" : "Code copied")
    }
  }

  const formatDate = (value: string | null | undefined) => {
    if (!value) return language === "ar" ? "غير متاح" : "Not available"
    return new Date(value).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium text-destructive">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {language === "ar" ? "رجوع" : "Go Back"}
        </Button>
      </div>
    )
  }

  const examTitle = certificate
    ? getLocalizedText(certificate.examTitleEn, certificate.examTitleAr, language)
    : result
      ? getLocalizedText(result.examTitleEn, result.examTitleAr, language)
      : ""

  const candidateName = certificate
    ? getLocalizedText(certificate.candidateNameEn, certificate.candidateNameAr, language)
    : result?.candidateName || ""

  const brandName = brand?.brandName?.trim() || "SmartExam"
  const logoUrl = brand?.logoUrl?.trim() || ""
  const displayExamTitle = examTitle || (language === "ar" ? "اختبار غير محدد" : "Unknown exam")
  const displayCandidate =
    candidateName || candidateId || (language === "ar" ? "مرشح غير محدد" : "Unknown candidate")

  const score = certificate?.score ?? result?.totalScore ?? 0
  const maxScore = certificate?.maxScore ?? result?.maxPossibleScore ?? 0
  const passScore = certificate?.passScore ?? result?.passScore ?? 0
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0
  const issuedAt = certificate?.issuedAt ?? result?.finalizedAt ?? null
  const isCertificateIssued = Boolean(certificate?.certificateCode)

  return (
    <div className="flex-1 space-y-6 p-6" dir={dir}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {language === "ar" ? "الشهادة" : "Certificate"}
            </h1>
            <p className="text-muted-foreground">{displayExamTitle}</p>
          </div>
        </div>
      </div>

      {isCertificateIssued ? (
        <Card className="mx-auto max-w-3xl overflow-hidden border-2 border-primary/20 shadow-sm">
          <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={brandName}
                    className="h-12 w-12 rounded-full object-cover ring-1 ring-border"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{brandName}</p>
                  <CardTitle className="text-2xl">
                    {language === "ar" ? "شهادة إنجاز" : "Certificate of Achievement"}
                  </CardTitle>
                  <CardDescription className="text-sm">{displayExamTitle}</CardDescription>
                </div>
              </div>
              <Badge
                className={
                  certificate?.isRevoked
                    ? "border border-rose-200 bg-rose-50 text-rose-700"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                }
              >
                {certificate?.isRevoked
                  ? language === "ar"
                    ? "ملغاة"
                    : "Revoked"
                  : language === "ar"
                    ? "صالحة"
                    : "Valid"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "تُمنح هذه الشهادة إلى" : "This certificate is proudly presented to"}
              </p>
              <p className="text-3xl font-bold text-primary">{displayCandidate}</p>
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "لإكمال اختبار" : "for successfully completing"}
              </p>
              <p className="text-xl font-semibold">{displayExamTitle}</p>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-muted/70 p-4 text-center">
                <p className="text-xs text-muted-foreground">{language === "ar" ? "الدرجة" : "Score"}</p>
                <p className="text-2xl font-bold">
                  {score} / {maxScore}
                </p>
                <p className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</p>
              </div>
              <div className="rounded-lg bg-muted/70 p-4 text-center">
                <p className="text-xs text-muted-foreground">{language === "ar" ? "درجة النجاح" : "Pass Score"}</p>
                <p className="text-2xl font-bold">{passScore}</p>
                <p className="text-xs text-muted-foreground">
                  {language === "ar" ? "حد النجاح المعتمد" : "Required threshold"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/70 p-4 text-center">
                <p className="text-xs text-muted-foreground">{language === "ar" ? "تاريخ الإصدار" : "Issued On"}</p>
                <p className="text-lg font-semibold">{formatDate(issuedAt)}</p>
                <div className="mt-1 inline-flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{language === "ar" ? "تاريخ الشهادة" : "Certificate date"}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === "ar" ? "رمز التحقق" : "Verification Code"}
                </p>
                <p className="font-mono text-lg font-semibold">{certificate?.certificateCode}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={copyCode}>
                  <Copy className="mr-2 h-4 w-4" />
                  {language === "ar" ? "نسخ" : "Copy"}
                </Button>
                {certificate?.downloadUrl && (
                  <Button size="sm" asChild>
                    <a href={certificate.downloadUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      {language === "ar" ? "تحميل" : "Download"}
                    </a>
                  </Button>
                )}
                <Button variant="secondary" size="sm" asChild>
                  <a href={`/verify-certificate?code=${certificate?.certificateCode}`} target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {language === "ar" ? "تحقق" : "Verify"}
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mx-auto max-w-2xl border border-dashed border-muted-foreground/40">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-amber-500" />
            <CardTitle>{language === "ar" ? "الشهادة قيد الإصدار" : "Certificate Pending"}</CardTitle>
            <CardDescription>
              {language === "ar"
                ? "سيتم إصدار الشهادة بعد الانتهاء من التصحيح ونشر النتيجة."
                : "The certificate will be issued once grading is finalized and the result is published."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-foreground">{displayExamTitle}</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-foreground">{displayCandidate}</span>
              </div>
              {result?.isPublishedToCandidate === false && (
                <Badge variant="secondary" className="mt-2">
                  {language === "ar" ? "لم تُنشر للمرشح بعد" : "Not published to candidate"}
                </Badge>
              )}
            </div>

            {result ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-muted/70 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{language === "ar" ? "الدرجة" : "Score"}</p>
                  <p className="text-lg font-semibold">
                    {score} / {maxScore}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/70 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{language === "ar" ? "درجة النجاح" : "Pass Score"}</p>
                  <p className="text-lg font-semibold">{passScore}</p>
                </div>
                <div className="rounded-lg bg-muted/70 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{language === "ar" ? "تاريخ النتيجة" : "Result Date"}</p>
                  <p className="text-sm font-semibold">{formatDate(result.finalizedAt)}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-muted/70 p-4 text-center text-sm text-muted-foreground">
                {language === "ar"
                  ? "النتيجة لا تزال قيد المعالجة. سيتم تحديث هذه الصفحة عند اكتمال التصحيح."
                  : "The result is still being processed. This page will update once grading completes."}
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Award className="h-4 w-4" />
              <span>
                {language === "ar"
                  ? "سيظهر رمز التحقق هنا بمجرد إصدار الشهادة."
                  : "The verification code will appear here once the certificate is issued."}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {language === "ar" ? "رجوع إلى القائمة" : "Back to List"}
        </Button>
      </div>
    </div>
  )
}
