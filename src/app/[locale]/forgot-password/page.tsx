import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthCard } from "@/components/layout/AuthCard";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { messages } from "@/lib/i18n/messages";

const locales: SiteLocale[] = ["en", "ar"];
export function generateStaticParams() { return locales.map((locale) => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) return { title: "Kulha!" };
  return { title: messages.auth.forgot.title };
}
export default async function LocalizedForgotPasswordPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!locales.includes(locale as SiteLocale)) notFound();
  const rawEmail = query.email;
  const initialEmail = typeof rawEmail === "string" ? rawEmail.slice(0, 254) : "";
  return (
    <AuthCard locale={locale as SiteLocale} title={messages.auth.forgot.title} lead={messages.auth.forgot.lead}>
      <ForgotPasswordForm initialEmail={initialEmail} />
    </AuthCard>
  );
}
