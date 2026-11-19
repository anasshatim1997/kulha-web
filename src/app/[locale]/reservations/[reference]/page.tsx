import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReservationDetail } from "@/components/reservations/ReservationDetail";
import type { SiteLocale } from "@/lib/i18n/site-copy";
type Props = { params: Promise<{ locale: string; reference: string }> };
const locales: SiteLocale[] = ["en", "ar"];
export const metadata: Metadata = { title: "Reservation details" };
export default async function LocalizedReservationDetailPage({ params }: Props) {
  const { locale, reference } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  return <ReservationDetail reference={reference} locale={locale as SiteLocale} />;
}
