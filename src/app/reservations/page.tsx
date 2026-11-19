import type { Metadata } from "next";
import { ReservationList } from "@/components/reservations/ReservationList";
export const metadata: Metadata = { title: "Mes réservations" };
export default function ReservationsPage() {
  return <ReservationList locale="fr" />;
}
