import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReservationCheckout } from "@/components/reservations/ReservationCheckout";
import type { SiteLocale } from "@/lib/i18n/site-copy";
type Props = { params: Promise<{ locale: string; offerId: string }> };
const locales: SiteLocale[] = ["en", "ar"];
export const metadata: Metadata = { title: "Reserve your basket" };
export default async function LocalizedReservationCheckoutPage({ params }: Props) {
  const { locale, offerId } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  return <ReservationCheckout offerId={offerId} locale={locale as SiteLocale} />;
}
