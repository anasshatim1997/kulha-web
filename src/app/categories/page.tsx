import type { Metadata } from "next";
import { LocalizedInfoPage } from "@/components/landing/LocalizedInfoPage";
import { pageCopy } from "@/lib/i18n/page-copy";
import { BasketDiscovery } from "@/components/landing/BasketDiscovery";

export const metadata: Metadata = { title: "Les paniers anti-gaspillage | KULHA!" };
export default function Page() {
  return <><LocalizedInfoPage locale="fr" page={pageCopy.fr["categories"]} /><BasketDiscovery locale="fr" /></>;
}
