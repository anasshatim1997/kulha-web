import type { Metadata } from "next";
import { ReservationCheckout } from "@/components/reservations/ReservationCheckout";
type Props = { params: Promise<{ offerId: string }> };
export const metadata: Metadata = { title: "Réserver votre panier" };
export default async function ReservationCheckoutPage({ params }: Props) {
  const { offerId } = await params;
  return <ReservationCheckout offerId={offerId} locale="fr" />;
}
