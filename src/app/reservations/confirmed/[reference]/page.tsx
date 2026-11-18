import type { Metadata } from "next";
import { ReservationConfirmation } from "@/components/reservations/ReservationConfirmation";
type Props = { params: Promise<{ reference: string }> };
export const metadata: Metadata = { title: "Réservation confirmée" };
export default async function ReservationConfirmedPage({ params }: Props) {
  const { reference } = await params;
  return <ReservationConfirmation reference={reference} locale="fr" />;
}
