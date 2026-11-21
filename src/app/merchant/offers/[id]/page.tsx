import { requireMerchantPage } from "@/lib/auth/server-merchant";
import { OfferForm } from "@/components/merchant/offers/OfferForm";
import { offerCopy } from "@/lib/i18n/offer-copy";
export const dynamic = "force-dynamic";
export default async function MerchantOfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireMerchantPage("fr");
  const { id } = await params;
  const t = offerCopy("fr");
  return <div className="mw-shell" dir="ltr"><header className="mw-head"><h1 className="mw-title">{t.title}</h1></header><OfferForm key={id} locale="fr" offerId={id}/></div>;
}
