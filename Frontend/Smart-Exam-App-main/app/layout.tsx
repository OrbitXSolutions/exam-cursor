import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Providers } from "./providers"

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "SmartExam - Enterprise Online Examination Platform",
    template: "%s | SmartExam",
  },
  description:
    "Enterprise-grade bilingual online examination platform with AI-powered proctoring, automated grading, and real-time analytics. Secure, scalable assessments by Build4IT.",
  generator: "Next.js",
  applicationName: "SmartExam",
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
  metadataBase: new URL("https://app.smartexam.io"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SmartExam",
    title: "SmartExam - Enterprise Online Examination Platform",
    description:
      "Enterprise-grade bilingual online examination platform with AI-powered proctoring, automated grading, and real-time analytics.",
    images: [
      {
        url: "/hero-dashboard.jpg",
        width: 1200,
        height: 630,
        alt: "SmartExam Dashboard - Enterprise Exam Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartExam - Enterprise Online Examination Platform",
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
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`${geist.className} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}
