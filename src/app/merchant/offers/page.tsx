import { requireMerchantPage } from "@/lib/auth/server-merchant";
import { OfferList } from "@/components/merchant/offers/OfferList";
import { offerCopy } from "@/lib/i18n/offer-copy";
export const dynamic = "force-dynamic";
export default async function MerchantOffersPage() {
  await requireMerchantPage("fr");
  const t = offerCopy("fr");
  return <div className="mw-shell" dir="ltr"><header className="mw-head"><h1 className="mw-title">{t.title}</h1></header><OfferList locale="fr"/></div>;
}
