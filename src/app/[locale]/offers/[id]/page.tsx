import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OfferDetailPage } from "@/components/offers/OfferDetailPage";
import type { SiteLocale } from "@/lib/i18n/site-copy";
const locales: SiteLocale[] = ["fr", "en", "ar"];
export const revalidate = 30;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "ar" ? "تفاصيل السلة | KULHA!" : locale === "fr" ? "Détails du panier | KULHA!" : "Basket details | KULHA!" };
}
export default async function LocalizedOfferPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  return <OfferDetailPage locale={locale as SiteLocale} id={id}/>;
}
