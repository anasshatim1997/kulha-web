import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Nunito, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SessionProvider } from "@/components/session/SessionProvider";
import { RouteProgress } from "@/components/navigation/RouteProgress";

const nunito = Nunito({ subsets: ["latin", "latin-ext"], variable: "--font-nunito", display: "swap" });
const notoArabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-noto-arabic", display: "swap" });

export const metadata: Metadata = {
  title: { default: "KULHA! — Paniers anti-gaspi près de chez vous", template: "%s | Kulha!" },
  description: "KULHA! est une plateforme marocaine anti-gaspillage. Réservez des paniers d’invendus alimentaires à prix réduit et récupérez-les chez les commerces participants.",
  applicationName: "Kulha!",
  appleWebApp: { capable: true, title: "Kulha!", statusBarStyle: "default" },
  openGraph: { title: "KULHA! — Les bons paniers du quartier, à prix doux", description: "Réservez des paniers anti-gaspillage à prix réduit et récupérez-les chez les commerces participants au Maroc.", type: "website", locale: "fr_MA" },
};

export const viewport: Viewport = { themeColor: "#073324", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${nunito.variable} ${notoArabic.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-sun-500 focus:px-4 focus:py-2 focus:font-bold focus:text-forest-900">Aller au contenu</a>
        <SessionProvider>
          <Suspense fallback={null}><RouteProgress /></Suspense>
          <SiteHeader />
          <main id="contenu" className="flex-1">{children}</main>
          <SiteFooter />
        </SessionProvider>
      </body>
    </html>
  );
}
