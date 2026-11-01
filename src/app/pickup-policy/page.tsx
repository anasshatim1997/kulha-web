import type { Metadata } from "next";
import { LocalizedInfoPage } from "@/components/landing/LocalizedInfoPage";
import { pageCopy } from "@/lib/i18n/page-copy";

export const metadata: Metadata = { title: "Réservation et retrait | KULHA!" };
export default function Page() {
  return <LocalizedInfoPage locale="fr" page={pageCopy.fr["pickup-policy"]} />;
}
