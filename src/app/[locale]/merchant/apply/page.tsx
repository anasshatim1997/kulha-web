import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MerchantApplicationPanel } from "@/components/auth/MerchantApplicationPanel";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["fr", "en", "ar"];

export const metadata: Metadata = {
  title: "Shop owner space | KULHA!",
  robots: { index: false },
};

export default async function LocalizedMerchantApplyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <p className="section-kicker">KULHA! · PARTNERS</p>
        <h1 className="text-3xl font-black tracking-tight text-forest-800">{locale === "ar" ? "مساحة أصحاب المتاجر" : locale === "en" ? "Shop owner space" : "Espace commerçant"}</h1>
        <p className="mt-2 text-sm leading-6 text-forest-600">{locale === "ar" ? "أرسل طلبك وتابع مراجعته من فريق KULHA!." : locale === "en" ? "Submit your application and follow its review by the KULHA! team." : "Déposez votre demande et suivez son examen par l’équipe KULHA!."}</p>
      </div>
      <MerchantApplicationPanel />
    </div>
  );
}
