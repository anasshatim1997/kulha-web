import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthCard } from "@/components/layout/AuthCard";
import { authCopy } from "@/lib/i18n/auth-copy";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["en", "ar"];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) return { title: "Kulha!" };
  return { title: authCopy[locale as SiteLocale].loginTitle };
}

export default async function LocalizedLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  const selected = locale as SiteLocale;
  const copy = authCopy[selected];
  return (
    <AuthCard locale={selected} mode="login" title={copy.loginTitle} lead={copy.loginLead}>
      <Suspense>
        <LoginForm locale={selected} />
      </Suspense>
    </AuthCard>
  );
}
