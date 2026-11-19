import type { Metadata } from "next";
import { ReservationDetail } from "@/components/reservations/ReservationDetail";
type Props = { params: Promise<{ reference: string }> };
export const metadata: Metadata = { title: "Détails de la réservation" };
export default async function ReservationDetailPage({ params }: Props) {
  const { reference } = await params;
  return <ReservationDetail reference={reference} locale="fr" />;
}
