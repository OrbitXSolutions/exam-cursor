"use client"

import Image from "next/image"

import { BRAND_ASSETS } from "@/lib/branding"
import { useBranding } from "@/lib/hooks/use-branding"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

export function Footer() {
  const { orgName } = useBranding()
  return (
    <footer className="bg-slate-900 text-slate-400 py-16">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image width={2700} height={406} src={BRAND_ASSETS.digitalDubai} alt="Digital Dubai · Dubai Data and Statistics Establishment" className="w-full max-w-sm object-contain" />
            </Link>
            <p className="text-slate-400 mb-4 max-w-sm">
              Enterprise-grade online examination platform with AI-powered proctoring for secure, scalable assessments.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span>Powered by</span>
              <Link
                href="https://www.build4it.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[var(--brand-sky)] hover:text-[var(--brand-sky)] font-medium"
              >
                Build4IT
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/#features" className="hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="https://www.build4it.com/about"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  About Us
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.build4it.com/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  Contact Us
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.build4it.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  Build4IT
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">© {new Date().getFullYear()} {orgName}. All rights reserved.</p>
          <p className="text-sm">
            A product by{" "}
            <Link
              href="https://www.build4it.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand-sky)] hover:text-[var(--brand-sky)]"
            >
              Build4IT
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
