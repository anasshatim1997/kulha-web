import { notFound } from "next/navigation";
import { requireMerchantPage } from "@/lib/auth/server-merchant";
import { OfferList } from "@/components/merchant/offers/OfferList";
import { offerCopy } from "@/lib/i18n/offer-copy";

const locales = ["en", "ar"];
export default async function MerchantOffersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale)) notFound();
  await requireMerchantPage(locale);
  const t = offerCopy(locale);
  return <div className="mw-shell" dir={locale === "ar" ? "rtl" : "ltr"}>
    <header className="mw-head"><p className="section-kicker">KULHA! · PARTNERS</p><h1 className="mw-title">{t.title}</h1></header>
    <OfferList locale={locale}/>
  </div>;
}
