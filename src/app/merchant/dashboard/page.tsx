import type { Metadata } from "next";
import { MerchantApplicationPanel } from "@/components/auth/MerchantApplicationPanel";

export const metadata: Metadata = { title: "Tableau de bord commerçant | KULHA!", robots: { index: false } };

export default function MerchantDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <p className="section-kicker">KULHA! · PARTENAIRES</p>
        <h1 className="text-3xl font-black tracking-tight text-forest-800">Tableau de bord commerçant</h1>
      </div>
      <MerchantApplicationPanel />
    </div>
  );
}
