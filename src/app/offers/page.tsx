import type { Metadata } from "next";
import { OfferListPage } from "@/components/offers/OfferListPage";

export const revalidate = 30;
export const metadata: Metadata = { title: "Paniers disponibles | KULHA!", description: "Découvrez les paniers anti-gaspillage disponibles chez les commerces participants." };
export default async function OffersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <OfferListPage locale="fr" params={await searchParams}/>;
}
