import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function GradingLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" />
    </div>
  )
}
