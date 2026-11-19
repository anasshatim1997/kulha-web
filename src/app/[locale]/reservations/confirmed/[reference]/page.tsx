import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReservationConfirmation } from "@/components/reservations/ReservationConfirmation";
import type { SiteLocale } from "@/lib/i18n/site-copy";
type Props = { params: Promise<{ locale: string; reference: string }> };
const locales: SiteLocale[] = ["en", "ar"];
export const metadata: Metadata = { title: "Reservation confirmed" };
export default async function LocalizedReservationConfirmedPage({ params }: Props) {
  const { locale, reference } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  return <ReservationConfirmation reference={reference} locale={locale as SiteLocale} />;
}
