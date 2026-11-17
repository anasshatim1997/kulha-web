import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { OfferMapPage } from "@/components/offers/OfferMapPage";

const locales: SiteLocale[] = ["en", "ar"];
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "ar" ? "خريطة المتاجر | KULHA!" : "Store map | KULHA!" };
}

export default async function LocalizedOffersMapRoute({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!locales.includes(locale as SiteLocale)) notFound();
  return <OfferMapPage locale={locale as SiteLocale} params={query} />;
}
