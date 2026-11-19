import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireMerchantPage } from "@/lib/auth/server-merchant";
import { PickupScanner } from "@/components/merchant/PickupScanner";
import type { SiteLocale } from "@/lib/i18n/site-copy";

type Props = { params: Promise<{ locale: string }> };
const locales: SiteLocale[] = ["en", "ar"];

export const metadata: Metadata = { title: "Scan pickups | KULHA!", robots: { index: false } };

export default async function LocalizedMerchantPickupScannerPage({ params }: Props) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  await requireMerchantPage(locale);
  return <PickupScanner locale={locale as SiteLocale} />;
}
