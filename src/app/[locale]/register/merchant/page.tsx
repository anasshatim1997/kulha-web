import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MerchantRegisterForm } from "@/components/auth/MerchantRegisterForm";
import { RegisterShell } from "@/components/auth/RegisterShell";
import { authCopy } from "@/lib/i18n/auth-copy";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["fr", "ar", "en"];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: locales.includes(locale as SiteLocale) ? authCopy[locale as SiteLocale].merchantRegisterTitle : "Kulha!" };
}

export default async function LocalizedMerchantRegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  const selected = locale as SiteLocale;
  const copy = authCopy[selected];
  return (
    <RegisterShell audience="MERCHANT" locale={selected} title={copy.merchantRegisterTitle} lead={copy.merchantRegisterLead}>
      <MerchantRegisterForm locale={selected} />
    </RegisterShell>
  );
}
