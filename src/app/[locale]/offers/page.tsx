import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OfferListPage } from "@/components/offers/OfferListPage";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["fr", "en", "ar"];
export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale === "ar") return { title: "السلال المتاحة | KULHA!", description: "اكتشف العروض المنشورة من المتاجر المشاركة." };
  if (locale === "fr") return { title: "Paniers disponibles | KULHA!", description: "Découvrez les paniers anti-gaspillage proposés par les commerces participants." };
  return { title: "Available baskets | KULHA!", description: "Browse surplus-food baskets published by participating shops." };
}

export function generateStaticParams() { return locales.map(locale => ({ locale })); }

export default async function LocalizedOffersPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!locales.includes(locale as SiteLocale)) notFound();
  return <OfferListPage locale={locale as SiteLocale} params={query}/>;
}
