import type { Metadata } from "next";
import { LegalPolicyPage } from "@/components/legal/LegalPolicyPage";
import { legalCopy } from "@/lib/i18n/legal-copy";

export const metadata: Metadata = {
  title: "Politique de confidentialité | KULHA!",
  description: "Politique de confidentialité de KULHA!, version de travail préparée pour revue juridique au Maroc.",
};

export default function PrivacyPage() {
  return <LegalPolicyPage locale="fr" document={legalCopy.fr.privacy} />;
}
