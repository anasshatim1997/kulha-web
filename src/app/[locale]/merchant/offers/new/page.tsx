import { notFound } from "next/navigation";
import { requireMerchantPage } from "@/lib/auth/server-merchant";
import { OfferForm } from "@/components/merchant/offers/OfferForm";
import { offerCopy } from "@/lib/i18n/offer-copy";
const locales = ["fr", "en", "ar"];
export default async function NewOfferPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!locales.includes(locale)) notFound();
  await requireMerchantPage(locale); const t = offerCopy(locale);
  return <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-8" dir={locale === "ar" ? "rtl" : "ltr"}><header><p className="section-kicker">KULHA! · PARTNERS</p><h1 className="text-3xl font-black text-forest-800">{t.newOffer}</h1></header><OfferForm locale={locale}/></div>;
}
