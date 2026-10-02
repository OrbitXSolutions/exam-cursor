"use client"

import Image from "next/image"

import { BRAND_ASSETS, DEFAULT_BRANDING } from "@/lib/branding"
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
  const footerText = language === "ar" && branding.footerText === DEFAULT_BRANDING.footerText
    ? "دبي الرقمية · مؤسسة دبي للبيانات والإحصاء" : branding.footerText
  const supportUrl = /^https?:\/\//i.test(branding.supportUrl || "") ? branding.supportUrl : null
  return (
    <footer className="brand-footer" dir={dir}>
      <p><bdi dir="ltr">© {new Date().getFullYear()}</bdi> <bdi>{footerText}</bdi></p>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {branding.supportEmail && <a dir="ltr" href={`mailto:${branding.supportEmail}`}>{branding.supportEmail}</a>}
        {branding.mobileNumber && <a dir="ltr" href={`tel:${branding.mobileNumber}`}>{branding.mobileNumber}</a>}
        {branding.officeNumber && <a dir="ltr" href={`tel:${branding.officeNumber}`}>{branding.officeNumber}</a>}
        {supportUrl && <a href={supportUrl} target="_blank" rel="noopener noreferrer">{language === "ar" ? "الدعم" : "Support"}</a>}
      </div>
    </footer>
  )
}
