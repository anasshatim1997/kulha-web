import { notFound } from "next/navigation";
import { requireMerchantPage } from "@/lib/auth/server-merchant";
import { OfferForm } from "@/components/merchant/offers/OfferForm";
import { offerCopy } from "@/lib/i18n/offer-copy";
const locales = ["fr", "en", "ar"];
export default async function NewOfferPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!locales.includes(locale)) notFound();
  await requireMerchantPage(locale); const t = offerCopy(locale);
  return <div className="mw-shell" dir={locale === "ar" ? "rtl" : "ltr"}><header className="mw-head"><h1 className="mw-title">{t.newOffer}</h1></header><OfferForm locale={locale}/></div>;
}
