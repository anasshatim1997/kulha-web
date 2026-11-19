import type { Metadata } from "next";
import { requireMerchantPage } from "@/lib/auth/server-merchant";
import { PickupScanner } from "@/components/merchant/PickupScanner";

export const metadata: Metadata = { title: "Scanner les retraits | KULHA!", robots: { index: false } };

export default async function MerchantPickupScannerPage() {
  await requireMerchantPage("fr");
  return <PickupScanner locale="fr" />;
}
