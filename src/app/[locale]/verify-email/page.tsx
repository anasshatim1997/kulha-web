import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { VerifyEmailPanel } from "@/components/auth/VerifyEmailPanel";
import { AuthCard } from "@/components/layout/AuthCard";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { messages } from "@/lib/i18n/messages";

const locales: SiteLocale[] = ["en", "ar"];
export function generateStaticParams() { return locales.map((locale) => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) return { title: "Kulha!" };
  return { title: messages.auth.verify.title, robots: { index: false } };
}
export default async function LocalizedVerifyEmailPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  return (
    <AuthCard locale={locale as SiteLocale} title={messages.auth.verify.title} lead={messages.auth.verify.lead}>
      <Suspense><VerifyEmailPanel /></Suspense>
    </AuthCard>
  );
}
