import { OfferListSkeleton } from "@/components/merchant/offers/OfferSkeletons";
import { offerCopy } from "@/lib/i18n/offer-copy";
export default function Loading() { const t = offerCopy("fr"); return <div className="mw-shell" aria-busy="true"><span className="sr-only">{t.loading}</span><OfferListSkeleton label={t.loading}/></div>; }
