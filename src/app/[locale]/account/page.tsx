import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileSettingsPanel } from "@/components/auth/ProfileSettingsPanel";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["fr", "en", "ar"];
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = locale === "ar" ? "الملف الشخصي والإعدادات | KULHA!" : locale === "en" ? "Profile & settings | KULHA!" : "Profil et paramètres | KULHA!";
  return { title };
}
export function generateStaticParams() { return locales.map(locale => ({ locale })); }
export default async function LocalizedAccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  return <ProfileSettingsPanel />;
}
