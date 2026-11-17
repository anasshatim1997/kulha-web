import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { Nunito } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SessionProvider } from "@/components/session/SessionProvider";
import { RouteProgress } from "@/components/navigation/RouteProgress";
import { ToastProvider } from "@/components/feedback/ToastProvider";
import { siteCopy } from "@/lib/i18n/site-copy";

const nunito = Nunito({ subsets: ["latin", "latin-ext"], variable: "--font-nunito", display: "swap" });
const notoArabic = localFont({
  src: [
    { path: "./fonts/NotoSansArabic-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/NotoSansArabic-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-noto-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "KULHA! — Paniers anti-gaspi près de chez vous", template: "%s | Kulha!" },
  description: "KULHA! est une plateforme marocaine anti-gaspillage. Réservez des paniers d’invendus alimentaires à prix réduit et récupérez-les chez les commerces participants.",
  applicationName: "Kulha!",
  appleWebApp: { capable: true, title: "Kulha!", statusBarStyle: "default" },
  openGraph: { title: "KULHA! — Les bons paniers du quartier, à prix doux", description: "Réservez des paniers anti-gaspillage à prix réduit et récupérez-les chez les commerces participants au Maroc.", type: "website", locale: "fr_MA" },
};

export const viewport: Viewport = { themeColor: "#073324", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const localeHeader = requestHeaders.get("x-kulha-locale");
  const htmlLang = localeHeader === "ar" || localeHeader === "en" ? localeHeader : "fr";
  return (
    <html lang={htmlLang} dir={htmlLang === "ar" ? "rtl" : "ltr"} className={`${nunito.variable} ${notoArabic.variable}`}>
      <body className={`flex min-h-dvh flex-col antialiased${htmlLang === "ar" ? " font-arabic" : ""}`}>
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-sun-500 focus:px-4 focus:py-2 focus:font-bold focus:text-forest-900">{siteCopy[htmlLang].nav.skipToContent}</a>
        <ToastProvider>
          <SessionProvider>
            <Suspense fallback={null}><RouteProgress /></Suspense>
            <SiteHeader />
            <main id="contenu" className="flex-1">{children}</main>
            <SiteFooter />
          </SessionProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
