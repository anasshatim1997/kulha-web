import type { Metadata } from "next";
import { MerchantApplicationPanel } from "@/components/auth/MerchantApplicationPanel";

export const metadata: Metadata = {
  title: "Espace commerçant | KULHA!",
  robots: { index: false },
};

export default function MerchantApplyPage() {
  return <MerchantApplicationPanel />;
}
