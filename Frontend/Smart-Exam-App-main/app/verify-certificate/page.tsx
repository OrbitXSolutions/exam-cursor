"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { verifyCertificate, type CertificateVerification } from "@/lib/api/certificates"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Search } from "lucide-react"

export default function VerifyCertificatePage() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get("code") ?? ""
  const [code, setCode] = useState(codeFromUrl)
  const [result, setResult] = useState<CertificateVerification | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleVerify() {
    if (!code.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const verification = await verifyCertificate(code.trim())
      setResult(verification)
    } catch {
      setResult({ isValid: false, message: "Verification failed" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("certificate.verifyTitle")}</CardTitle>
          <CardDescription>{t("certificate.verifyDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">{t("certificate.codeLabel")}</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                placeholder={t("certificate.codePlaceholder")}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
              <Button onClick={handleVerify} disabled={loading || !code.trim()}>
                {loading ? t("common.loading") : (
                  <>
                    <Search className="h-4 w-4 me-2" />
                    {t("certificate.verify")}
                  </>
                )}
              </Button>
            </div>
          </div>

          {result && (
            <div
              className={`rounded-lg p-4 ${result.isValid
                ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                }`}
            >
              {result.isValid ? (
                <>
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">{t("certificate.validCertificate")}</span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    <p><strong>Code:</strong> {result.certificateCode}</p>
                    <p><strong>Exam:</strong> {result.examTitle}</p>
                    <p><strong>Candidate:</strong> {result.candidateName}</p>
                    <p><strong>Score:</strong> {result.score} / {result.maxScore}</p>
                    <p><strong>Issued:</strong> {result.issuedAt ? new Date(result.issuedAt).toLocaleDateString() : "-"}</p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">{result.message || t("certificate.invalidCertificate")}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
