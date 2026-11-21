import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReservationList } from "@/components/reservations/ReservationList";
import type { SiteLocale } from "@/lib/i18n/site-copy";

type Props = { params: Promise<{ locale: string }> };
const locales: SiteLocale[] = ["fr", "en", "ar"];
export const metadata: Metadata = { title: "Réservations | KULHA!" };

export default async function LocalizedReservationsPage({ params }: Props) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  return <ReservationList locale={locale as SiteLocale} />;
}
