"use client"

import Image from "next/image"

import { BRAND_ASSETS } from "@/lib/branding"
import { useBranding } from "@/lib/hooks/use-branding"
import { useI18n } from "@/lib/i18n/context"

export function BrandHeader() {
  return (
    <header className="brand-header" dir="ltr" aria-label="Government of Dubai and Digital Dubai">
      <Image width={681} height={274} priority src={BRAND_ASSETS.government} alt="Government of Dubai" className="brand-government" />
      <Image width={2700} height={406} src={BRAND_ASSETS.digitalDubai} alt="Digital Dubai · Dubai Data and Statistics Establishment" className="brand-digital-dubai" />
    </header>
  )
}

export function BrandFooter() {
  const { branding } = useBranding()
  const { language, dir } = useI18n()
  const supportUrl = /^https?:\/\//i.test(branding.supportUrl || "") ? branding.supportUrl : null
  return (
    <footer className="brand-footer" dir={dir}>
      <p>© {new Date().getFullYear()} {branding.footerText}</p>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {branding.supportEmail && <a href={`mailto:${branding.supportEmail}`}>{branding.supportEmail}</a>}
        {branding.mobileNumber && <a href={`tel:${branding.mobileNumber}`}>{branding.mobileNumber}</a>}
        {branding.officeNumber && <a href={`tel:${branding.officeNumber}`}>{branding.officeNumber}</a>}
        {supportUrl && <a href={supportUrl} target="_blank" rel="noopener noreferrer">{language === "ar" ? "الدعم" : "Support"}</a>}
      </div>
    </footer>
  )
}
