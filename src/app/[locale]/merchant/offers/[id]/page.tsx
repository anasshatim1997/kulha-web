import { notFound } from "next/navigation";
import { requireMerchantPage } from "@/lib/auth/server-merchant";
import { OfferForm } from "@/components/merchant/offers/OfferForm";
import { offerCopy } from "@/lib/i18n/offer-copy";
const locales = ["en", "ar"];
export default async function OfferDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params; if (!locales.includes(locale)) notFound();
  await requireMerchantPage(locale); const t = offerCopy(locale);
  return <div className="mw-shell" dir={locale === "ar" ? "rtl" : "ltr"}><header className="mw-head"><p className="section-kicker">KULHA! · PARTNERS</p><h1 className="mw-title">{t.title}</h1></header><OfferForm key={id} locale={locale} offerId={id}/></div>;
}
