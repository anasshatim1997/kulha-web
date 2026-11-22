import { notFound } from "next/navigation";
import { requireMerchantPage } from "@/lib/auth/server-merchant";
import { MerchantConsole } from "@/components/merchant/MerchantConsole";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["fr", "en", "ar"];
export const dynamic = "force-dynamic";
export const metadata = { title: "KULHA! — Merchant", robots: { index: false } };

export default async function MerchantWorkspacePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  await requireMerchantPage(locale);
  return <MerchantConsole locale={locale as SiteLocale} page="sales" />;
}
