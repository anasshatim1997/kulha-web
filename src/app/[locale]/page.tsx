import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["fr", "ar", "en"];
export function generateStaticParams() { return locales.map((locale) => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = { en: "KULHA! — Discounted surplus-food baskets nearby", fr: "KULHA! — Paniers anti-gaspi près de chez vous", ar: "KULHA! — سلال غذائية بأسعار مخفضة في المغرب" };
  const descriptions: Record<string, string> = {
    en: "A Moroccan food-waste marketplace: reserve discounted surplus-food baskets online and collect them from participating shops.",
    fr: "Une plateforme marocaine anti-gaspillage : réservez des paniers d’invendus à prix réduit et récupérez-les chez les commerces participants.",
    ar: "منصة مغربية للحد من هدر الطعام، تتيح حجز سلال المنتجات المتاحة بأسعار مخفضة واستلامها من المتاجر المشاركة.",
  };
  return { title: titles[locale] ?? "Kulha!", description: descriptions[locale] ?? descriptions.fr };
}
export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  return <LandingPage locale={locale as SiteLocale} />;
}
