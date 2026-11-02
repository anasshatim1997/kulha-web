import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MerchantApplicationPanel } from "@/components/auth/MerchantApplicationPanel";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["fr", "en", "ar"];

export const metadata: Metadata = { title: "Shop owner dashboard | KULHA!", robots: { index: false } };

export default async function LocalizedMerchantDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <p className="section-kicker">KULHA! · PARTNERS</p>
        <h1 className="text-3xl font-black tracking-tight text-forest-800">{locale === "ar" ? "لوحة المتجر" : locale === "en" ? "Shop owner dashboard" : "Tableau de bord commerçant"}</h1>
      </div>
      <MerchantApplicationPanel />
    </div>
  );
}
