"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/context"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Camera,
  Upload,
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  User,
  CreditCard,
  ArrowRight,
} from "lucide-react"
import {
  getCandidateVerificationStatus,
  submitCandidateVerification,
  type CandidateVerificationStatus,
} from "@/lib/api/proctoring"

type Step = "check" | "capture" | "review" | "submitted"

export default function VerifyIdentityPage() {
  const { user } = useAuth()
  const { t, language, isRTL, dir } = useI18n()
  const router = useRouter()

  const [step, setStep] = useState<Step>("check")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<CandidateVerificationStatus | null>(null)

  // Capture state
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [idFile, setIdFile] = useState<File | null>(null)
  const [idPreview, setIdPreview] = useState<string | null>(null)
  const [idDocumentType, setIdDocumentType] = useState("Emirates ID")
  const [idNumber, setIdNumber] = useState("")

  // Webcam state
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Check existing verification status
  useEffect(() => {
    async function checkStatus() {
      try {
        const status = await getCandidateVerificationStatus()
        setVerificationStatus(status)

        if (status.status === "Approved") {
          setStep("submitted")
        } else if (status.status === "Pending") {
          setStep("submitted")
        } else if (status.status === "Rejected" || status.status === "Flagged") {
          setStep("capture") // Allow re-submission
        } else {
          setStep("capture")
        }
      } catch {
        setStep("capture")
      } finally {
        setLoading(false)
      }
    }
    checkStatus()
  }, [])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      })
      streamRef.current = stream
      // Set cameraActive first so the video element renders,
      // then assign srcObject in a useEffect below
      setCameraActive(true)
    } catch {
      setCameraError("Camera access denied. Please allow camera access and try again.")
    }
  }, [])

  // Assign stream to video element after it renders
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [cameraActive])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(
      blob => {
        if (blob) {
          const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: "image/jpeg" })
          setSelfieFile(file)
          setSelfiePreview(URL.createObjectURL(file))
          stopCamera()
        }
      },
      "image/jpeg",
      0.9,
    )
  }, [stopCamera])

  const handleIdFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error(t("verifyIdentity.invalidFileType"))
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t("verifyIdentity.fileTooLarge"))
        return
      }
      setIdFile(file)
      setIdPreview(URL.createObjectURL(file))
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!selfieFile || !idFile) {
      toast.error(t("verifyIdentity.validationSelfieId"))
      return
    }
    if (!idNumber.trim()) {
      toast.error(t("verifyIdentity.validationIdNumber"))
      return
    }

    setSubmitting(true)
    try {
      const result = await submitCandidateVerification(
        selfieFile,
        idFile,
        idDocumentType,
        idNumber,
      )
      toast.success(result.message || "Verification submitted successfully!")
      setVerificationStatus({
        hasSubmitted: true,
        status: result.status,
        reviewNotes: null,
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
      })
      setStep("submitted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }, [selfieFile, idFile, idDocumentType, idNumber])

  const resetForm = useCallback(() => {
    setSelfieFile(null)
    setSelfiePreview(null)
    setIdFile(null)
    setIdPreview(null)
    setIdNumber("")
    setStep("capture")
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // ─── Submitted / Status View ───────────────────────
  if (step === "submitted") {
    const status = verificationStatus?.status || "Pending"
    const isPending = status === "Pending"
    const isApproved = status === "Approved"
    const isRejected = status === "Rejected"
    const isFlagged = status === "Flagged"

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={dir}>
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            {isApproved && (
              <>
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-green-600">{t("verifyIdentity.identityVerified")}</CardTitle>
                <CardDescription>
                  {t("verifyIdentity.identityVerifiedDesc")}
                </CardDescription>
              </>
            )}
            {isPending && (
              <>
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <CardTitle className="text-yellow-600">{t("verifyIdentity.verificationPending")}</CardTitle>
                <CardDescription>
                  {t("verifyIdentity.verificationPendingDesc")}
                </CardDescription>
              </>
            )}
            {(isRejected || isFlagged) && (
              <>
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  {isRejected ? <XCircle className="h-8 w-8 text-red-600" /> : <AlertTriangle className="h-8 w-8 text-orange-600" />}
                </div>
                <CardTitle className={isRejected ? "text-red-600" : "text-orange-600"}>
                  {isRejected ? t("verifyIdentity.verificationRejected") : t("verifyIdentity.verificationFlagged")}
                </CardTitle>
                <CardDescription>
                  {verificationStatus?.reviewNotes || t("verifyIdentity.verificationPendingDesc")}
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {verificationStatus?.submittedAt && (
              <div className="text-sm text-muted-foreground text-center">
                {t("verifyIdentity.submittedAt")}:{" "}
                {new Date(verificationStatus.submittedAt).toLocaleString(
                  language === "ar" ? "ar-SA" : "en-US",
                  { timeZone: "Asia/Dubai" },
                )}
              </div>
            )}
            {verificationStatus?.reviewedAt && (
              <div className="text-sm text-muted-foreground text-center">
                {t("verifyIdentity.reviewedAt")}:{" "}
                {new Date(verificationStatus.reviewedAt).toLocaleString(
                  language === "ar" ? "ar-SA" : "en-US",
                  { timeZone: "Asia/Dubai" },
                )}
              </div>
            )}
            <div className="flex gap-3 justify-center">
              {(isRejected || isFlagged) && (
                <Button onClick={resetForm} variant="outline">
                  <RefreshCw className="h-4 w-4 me-2" />
                  {t("verifyIdentity.resubmit")}
                </Button>
              )}
              <Button onClick={() => router.push("/my-exams")}>
                <ArrowRight className="h-4 w-4 me-2" />
                {t("verifyIdentity.goToMyExams")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Capture & Review Form ─────────────────────────
  const canProceedToReview = selfieFile && idFile && idNumber.trim()

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{t("verifyIdentity.pageTitle")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("verifyIdentity.pageSubtitle")}
          </p>
          {(verificationStatus?.status === "Rejected" || verificationStatus?.status === "Flagged") && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 inline me-1 text-red-600" />
              <span className="text-red-700 dark:text-red-400">
                {verificationStatus.status === "Rejected"
                  ? t("verifyIdentity.verificationRejected")
                  : t("verifyIdentity.verificationFlagged")}
                {verificationStatus.reviewNotes && ` — ${verificationStatus.reviewNotes}`}
              </span>
            </div>
          )}
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Badge variant={selfieFile ? "default" : "outline"} className="px-4 py-1.5">
            1. {t("verifyIdentity.step1")}
          </Badge>
          <div className="w-8 h-px bg-muted-foreground/30" />
          <Badge variant={idFile ? "default" : "outline"} className="px-4 py-1.5">
            2. {t("verifyIdentity.step2")}
          </Badge>
          <div className="w-8 h-px bg-muted-foreground/30" />
          <Badge variant={idNumber ? "default" : "outline"} className="px-4 py-1.5">
            3. {t("verifyIdentity.step3")}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Selfie Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="h-5 w-5" />
                {t("verifyIdentity.selfieTitle")}
              </CardTitle>
              <CardDescription>
                {t("verifyIdentity.selfieDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selfiePreview ? (
                <div className="space-y-4">
                  {cameraActive ? (
                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full rounded-lg border bg-black aspect-[4/3] object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="flex gap-2 mt-3">
                        <Button onClick={capturePhoto} className="flex-1">
                          <Camera className="h-4 w-4 me-2" />
                          {t("verifyIdentity.capturePhoto")}
                        </Button>
                        <Button onClick={stopCamera} variant="outline" size="icon">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-lg">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                      {cameraError && (
                        <p className="text-sm text-destructive text-center">{t("verifyIdentity.cameraError")}</p>
                      )}
                      <Button onClick={startCamera}>
                        <Camera className="h-4 w-4 me-2" />
                        {t("verifyIdentity.openCamera")}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <img
                    src={selfiePreview}
                    alt={t("verifyIdentity.selfieTitle")}
                    className="w-full rounded-lg border aspect-[4/3] object-cover"
                  />
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {t("verifyIdentity.captured")}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelfieFile(null)
                        setSelfiePreview(null)
                      }}
                    >
                      <RefreshCw className="h-3 w-3 me-1" />
                      {t("verifyIdentity.retake")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ID Document Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" />
                {t("verifyIdentity.idTitle")}
              </CardTitle>
              <CardDescription>
                {t("verifyIdentity.idDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!idPreview ? (
                <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-lg">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {t("verifyIdentity.idFileHint")}
                  </p>
                  <label className="cursor-pointer">
                    <Button asChild>
                      <span>
                        <Upload className="h-4 w-4 me-2" />
                        {t("verifyIdentity.uploadIdPhoto")}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleIdFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <img
                    src={idPreview}
                    alt={t("verifyIdentity.idTitle")}
                    className="w-full rounded-lg border aspect-[16/10] object-cover"
                  />
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {t("verifyIdentity.uploaded")}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIdFile(null)
                        setIdPreview(null)
                      }}
                    >
                      <RefreshCw className="h-3 w-3 me-1" />
                      {t("verifyIdentity.change")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ID Information Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              {t("verifyIdentity.idInfoTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("verifyIdentity.documentType")}</Label>
                <Select value={idDocumentType} onValueChange={setIdDocumentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Emirates ID">{t("verifyIdentity.emiratesId")}</SelectItem>
                    <SelectItem value="National ID">{t("verifyIdentity.nationalId")}</SelectItem>
                    <SelectItem value="Passport">{t("verifyIdentity.passport")}</SelectItem>
                    <SelectItem value="Driving License">{t("verifyIdentity.drivingLicense")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("verifyIdentity.idNumber")}</Label>
                <Input
                  placeholder={t("verifyIdentity.idNumberPlaceholder")}
                  value={idNumber}
                  onChange={e => setIdNumber(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            className="px-12"
            disabled={!canProceedToReview || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" className="me-2" />
                {t("verifyIdentity.submitting")}
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 me-2" />
                {t("verifyIdentity.submitVerification")}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
