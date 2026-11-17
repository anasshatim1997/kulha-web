import type { SiteLocale } from "@/lib/i18n/site-copy";
import { getPublicOffer } from "@/lib/offers/public-api";
import { publicOfferCopy } from "@/lib/offers/public-copy";
import { OfferDetail } from "@/components/offers/OfferDetail";

export async function OfferDetailPage({ locale, id }: { locale: SiteLocale; id: string }) {
  try {
    const offer = await getPublicOffer(id);
    return <div className="kulha-offer-detail-page" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><OfferDetail offer={offer} locale={locale} /></div>;
  } catch {
    const t = publicOfferCopy(locale);
    return (
      <div className="kulha-detail-unavailable" role="alert" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
        <p>{t.unavailable}</p>
        <a href={locale === "fr" ? "/offers" : `/${locale}/offers`}>{t.back}</a>
      </div>
    );
  }
}
