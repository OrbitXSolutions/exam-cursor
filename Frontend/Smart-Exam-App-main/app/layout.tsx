import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: {
    default: "Digital Dubai Exams - Enterprise Online Examination Platform",
    template: "%s | Digital Dubai Exams",
  },
  description:
    "Enterprise-grade bilingual online examination platform with AI-powered proctoring, automated grading, and real-time analytics. Secure, scalable assessments for Digital Dubai.",
  generator: "Next.js",
  applicationName: "Digital Dubai Exams",
  keywords: [
    "online exam platform",
    "smart exam",
    "AI proctoring",
    "online assessment",
    "exam management",
    "question bank",
    "enterprise exam",
    "secure online exam",
    "exam analytics",
    "automated grading",
    "Build4IT",
  ],
  authors: [{ name: "Build4IT", url: "https://www.build4it.com" }],
  creator: "Build4IT",
  publisher: "Build4IT",
  metadataBase: new URL(process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Digital Dubai Exams",
    title: "Digital Dubai Exams - Enterprise Online Examination Platform",
    description:
      "Enterprise-grade bilingual online examination platform with AI-powered proctoring, automated grading, and real-time analytics.",
    images: [
      {
        url: "/hero-dashboard.jpg",
        width: 1200,
        height: 630,
        alt: "Digital Dubai Exams Dashboard - Enterprise Exam Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Dubai Exams - Enterprise Online Examination Platform",
    description:
      "Enterprise-grade online examination platform with AI-powered proctoring, automated grading, and real-time analytics.",
    images: ["/hero-dashboard.jpg"],
    creator: "@Build4IT",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/branding/favicon.png", type: "image/png" }],
    apple: "/branding/favicon.png",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#67ccee" },
    { media: "(prefers-color-scheme: dark)", color: "#102a43" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}
