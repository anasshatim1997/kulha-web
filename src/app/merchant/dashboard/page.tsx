import type { Metadata } from "next";
import { MerchantApplicationPanel } from "@/components/auth/MerchantApplicationPanel";

export const metadata: Metadata = { title: "Tableau de bord commerçant | KULHA!", robots: { index: false } };

export default function MerchantDashboardPage() {
  return <MerchantApplicationPanel />;
}
