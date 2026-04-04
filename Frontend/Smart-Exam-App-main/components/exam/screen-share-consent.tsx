"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Monitor } from "lucide-react"

interface ScreenShareConsentProps {
  open: boolean
  mode: "optional" | "required" | "strict"
  onShare: () => void
  onSkip: () => void
}

export function ScreenShareConsent({
  open,
  mode,
  onShare,
  onSkip,
}: ScreenShareConsentProps) {
  const isRequired = mode === "required" || mode === "strict"

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-blue-600" />
            <AlertDialogTitle>
              {isRequired ? "Screen Sharing Required" : "Screen Sharing"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2 text-start">
            <span className="block">
              {isRequired
                ? "This exam requires you to share your screen with the proctor. You must enable screen sharing before starting the exam."
                : "This exam supports screen sharing with the proctor. You may share your screen for monitoring purposes."}
            </span>
            <span className="block text-xs text-muted-foreground">
              Only the selected window or tab will be visible to the proctor. You can stop sharing at any time using your browser controls.
            </span>
            {mode === "strict" && (
              <span className="block text-xs font-medium text-amber-600 dark:text-amber-400">
                Note: If screen sharing stops during the exam, a grace period will apply before an action is taken.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!isRequired && (
            <AlertDialogCancel onClick={onSkip}>
              Skip
            </AlertDialogCancel>
          )}
          <AlertDialogAction onClick={onShare}>
            Share Screen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
