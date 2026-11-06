import type { Metadata } from "next";
import { LegalPolicyPage } from "@/components/legal/LegalPolicyPage";
import { legalCopy } from "@/lib/i18n/legal-copy";

export const metadata: Metadata = {
  title: "Conditions d’utilisation | KULHA!",
  description: "Conditions d’utilisation de KULHA!, version de travail préparée pour revue juridique au Maroc.",
};

export default function TermsPage() {
  return <LegalPolicyPage locale="fr" document={legalCopy.fr.terms} />;
}
