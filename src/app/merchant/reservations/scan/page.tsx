import type { Metadata } from "next";
import { requireMerchantPage } from "@/lib/auth/server-merchant";
import { ReservationScanner } from "@/components/reservations/ReservationScanner";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Scanner de retrait | KULHA!", robots: { index: false } };
export default async function MerchantReservationScannerPage() {
  await requireMerchantPage("fr");
  return <ReservationScanner locale="fr" />;
}
