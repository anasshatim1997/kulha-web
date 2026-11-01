import type { Metadata } from "next";
import { LocalizedInfoPage } from "@/components/landing/LocalizedInfoPage";
import { pageCopy } from "@/lib/i18n/page-copy";

export const metadata: Metadata = { title: "Pour les commerces | KULHA!" };
export default function Page() {
  return <LocalizedInfoPage locale="fr" slug="for-shops" page={pageCopy.fr["for-shops"]} />;
}
