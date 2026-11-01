import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { siteCopy } from "@/lib/i18n/site-copy";

export const metadata: Metadata = {
  title: "KULHA! — Paniers anti-gaspi près de chez vous",
  description: "KULHA! connecte les habitants du Maroc aux commerces qui proposent leurs invendus alimentaires en paniers à prix réduit. Réservez en ligne et récupérez votre panier en boutique.",
  openGraph: { title: "KULHA! — Les bons paniers du quartier, à prix doux", description: "Une plateforme marocaine anti-gaspillage : réservation en ligne et retrait chez les commerces participants.", type: "website", locale: "fr_MA" },
};

export default function HomePage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: siteCopy.fr.faq.items.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Kulha!",
    description: "Plateforme marocaine anti-gaspillage connectant les habitants aux commerces proposant des paniers d’invendus à prix réduit, à récupérer en boutique.",
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Kulha!",
    inLanguage: ["fr-MA", "ar-MA", "en"],
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    <LandingPage locale="fr" />
  </>;
}
