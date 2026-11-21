import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthCard } from "@/components/layout/AuthCard";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["en", "ar"];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) return { title: "KULHA Administration" };
  return { title: locale === "ar" ? "دخول الإدارة | KULHA" : "Admin sign in | KULHA" };
}

export default async function LocalizedAdminLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  const selected = locale as SiteLocale;
  const title = selected === "ar" ? "دخول الإدارة" : "Administrator sign in";
  const lead = selected === "ar"
    ? "سجّل الدخول باستخدام حساب إدارة KULHA."
    : "Sign in with your KULHA administrator account.";
  return (
    <AuthCard locale={selected} title={title} lead={lead}>
      <Suspense><LoginForm locale={selected} adminOnly /></Suspense>
    </AuthCard>
  );
}
