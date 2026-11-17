import type { Metadata } from "next";
import { OfferMapPage } from "@/components/offers/OfferMapPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Carte des commerces | KULHA!",
  description: "Explorez les commerces partenaires et leurs paniers disponibles sur la carte.",
};

export default async function OffersMapRoute({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <OfferMapPage locale="fr" params={await searchParams} />;
}
