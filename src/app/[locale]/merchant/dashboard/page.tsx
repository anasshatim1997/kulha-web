import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MerchantApplicationPanel } from "@/components/auth/MerchantApplicationPanel";
import { MerchantConsole } from "@/components/merchant/MerchantConsole";
import { requireMerchantPage } from "@/lib/auth/server-merchant";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["fr", "en", "ar"];

export const metadata: Metadata = { title: "Shop dashboard | KULHA!", robots: { index: false } };

export default async function LocalizedMerchantDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  const isOwner = await requireMerchantPage(locale);
  if (!isOwner) return <MerchantConsole locale={locale as SiteLocale} page="dashboard" />;
  return <MerchantApplicationPanel />;
}
