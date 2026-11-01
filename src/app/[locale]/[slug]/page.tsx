import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AuthCard } from "@/components/layout/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { LocalizedInfoPage } from "@/components/landing/LocalizedInfoPage";
import { BasketDiscovery } from "@/components/landing/BasketDiscovery";
import { pageCopy, infoSlugs } from "@/lib/i18n/page-copy";
import { authCopy } from "@/lib/i18n/auth-copy";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["fr", "ar", "en"];
const extraSlugs = ["login", "register"] as const;
type AuthSlug = (typeof extraSlugs)[number];

export function generateStaticParams() {
  return locales.flatMap((locale) => [...infoSlugs, ...extraSlugs].map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!locales.includes(locale as SiteLocale)) return { title: "Kulha!" };
  if (slug === "login") return { title: authCopy[locale as SiteLocale].loginTitle };
  if (slug === "register") return { title: authCopy[locale as SiteLocale].registerTitle };
  if (!infoSlugs.includes(slug as (typeof infoSlugs)[number])) return { title: "Kulha!" };
  return { title: pageCopy[locale as SiteLocale][slug as (typeof infoSlugs)[number]].title };
}

export default async function LocaleSubPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  const selectedLocale = locale as SiteLocale;

  if (extraSlugs.includes(slug as AuthSlug)) {
    const copy = authCopy[selectedLocale];
    if (slug === "login") {
      return <AuthCard locale={selectedLocale} mode="login" title={copy.loginTitle} lead={copy.loginLead}><Suspense><LoginForm locale={selectedLocale} /></Suspense></AuthCard>;
    }
    return <AuthCard locale={selectedLocale} mode="register" title={copy.registerTitle} lead={copy.registerLead}><RegisterForm locale={selectedLocale} /></AuthCard>;
  }
  if (!infoSlugs.includes(slug as (typeof infoSlugs)[number])) notFound();
  if (slug === "categories") return <><LocalizedInfoPage locale={selectedLocale} page={pageCopy[selectedLocale].categories} /><BasketDiscovery locale={selectedLocale} /></>;
  return <LocalizedInfoPage locale={selectedLocale} slug={slug} page={pageCopy[selectedLocale][slug as (typeof infoSlugs)[number]]} />;
}
