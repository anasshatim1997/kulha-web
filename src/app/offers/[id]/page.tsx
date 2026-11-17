import type { Metadata } from "next";
import { OfferDetailPage } from "@/components/offers/OfferDetailPage";
export const revalidate = 30;
export const metadata: Metadata = { title: "Détail du panier | KULHA!" };
export default async function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  return <OfferDetailPage locale="fr" id={(await params).id}/>;
}
