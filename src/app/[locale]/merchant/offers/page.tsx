import { notFound } from "next/navigation";
import { requireMerchantPage } from "@/lib/auth/server-merchant";
import { OfferList } from "@/components/merchant/offers/OfferList";
import { offerCopy } from "@/lib/i18n/offer-copy";

const locales = ["fr", "en", "ar"];
export default async function MerchantOffersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale)) notFound();
  await requireMerchantPage(locale);
  const t = offerCopy(locale);
  return <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8 sm:py-12" dir={locale === "ar" ? "rtl" : "ltr"}>
    <header><p className="section-kicker">KULHA! · PARTNERS</p><h1 className="text-3xl font-black tracking-tight text-forest-800">{t.title}</h1></header>
    <OfferList locale={locale}/>
  </div>;
}
