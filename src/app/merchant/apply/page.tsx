import type { Metadata } from "next";
import { MerchantApplicationPanel } from "@/components/auth/MerchantApplicationPanel";

export const metadata: Metadata = {
  title: "Espace commerçant | KULHA!",
  robots: { index: false },
};

export default function MerchantApplyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <p className="section-kicker">KULHA! · PARTENAIRES</p>
        <h1 className="text-3xl font-black tracking-tight text-forest-800">Espace commerçant</h1>
        <p className="mt-2 text-sm leading-6 text-forest-600">Déposez votre demande et suivez son examen par l’équipe KULHA!.</p>
      </div>
      <MerchantApplicationPanel />
    </div>
  );
}
