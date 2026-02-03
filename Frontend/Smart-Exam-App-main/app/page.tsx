import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { ProctorShowcase } from "@/components/landing/proctor-showcase"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { ScreenshotsSection } from "@/components/landing/screenshots-section"
import { StatsSection } from "@/components/landing/stats-section"
import { GettingStartedSection } from "@/components/landing/getting-started-section"
import { FAQSection } from "@/components/landing/faq-section"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ProctorShowcase />
      <HowItWorksSection />
      <ScreenshotsSection />
      <StatsSection />
      <GettingStartedSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  )
}
