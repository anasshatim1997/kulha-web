import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CustomerRegisterForm } from "@/components/auth/CustomerRegisterForm";
import { RegisterShell } from "@/components/auth/RegisterShell";
import { authCopy } from "@/lib/i18n/auth-copy";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["en", "ar"];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) return { title: "Kulha!" };
  return { title: authCopy[locale as SiteLocale].registerTitle };
}

export default async function LocalizedRegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!locales.includes(locale as SiteLocale)) notFound();
  const accountType = Array.isArray(query.accountType) ? query.accountType[0] : query.accountType;
  if (accountType?.toLowerCase() === "merchant") redirect(`/${locale}/register/merchant`);
  const selected = locale as SiteLocale;
  const copy = authCopy[selected];
  return (
    <RegisterShell audience="CUSTOMER" locale={selected} title={copy.registerTitle} lead={copy.registerLead}>
      <CustomerRegisterForm locale={selected} />
    </RegisterShell>
  );
}
