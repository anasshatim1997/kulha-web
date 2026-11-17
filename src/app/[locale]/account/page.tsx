import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountPanel } from "@/components/auth/AccountPanel";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["en", "ar"];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale === "ar") return { title: "ملفي الشخصي | KULHA!" };
  return { title: "My profile | KULHA!" };
}

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export default async function LocalizedAccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  return <AccountPanel />;
}
