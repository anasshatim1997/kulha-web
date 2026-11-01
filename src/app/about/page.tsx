import type { Metadata } from "next";
import { LocalizedInfoPage } from "@/components/landing/LocalizedInfoPage";
import { pageCopy } from "@/lib/i18n/page-copy";

export const metadata: Metadata = { title: "À propos de KULHA! | KULHA!" };
export default function Page() {
  return <LocalizedInfoPage locale="fr" page={pageCopy.fr["about"]} />;
}
