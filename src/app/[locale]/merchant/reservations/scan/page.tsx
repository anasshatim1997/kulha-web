import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireMerchantPage } from "@/lib/auth/server-merchant";
import { ReservationScanner } from "@/components/reservations/ReservationScanner";
import type { SiteLocale } from "@/lib/i18n/site-copy";
const locales: SiteLocale[] = ["fr", "en", "ar"];
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pickup scanner | KULHA!", robots: { index: false } };
export default async function LocalizedMerchantReservationScannerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  await requireMerchantPage(locale as SiteLocale);
  return <ReservationScanner locale={locale as SiteLocale} />;
}
