import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPolicyPage } from "@/components/legal/LegalPolicyPage";
import { legalCopy } from "@/lib/i18n/legal-copy";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["en", "ar"];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) return { title: "KULHA!" };
  return { title: `${legalCopy[locale as SiteLocale].privacy.title} | KULHA!` };
}

export default async function LocalizedPrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  const selected = locale as SiteLocale;
  return <LegalPolicyPage locale={selected} document={legalCopy[selected].privacy} />;
}
