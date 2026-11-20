import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileSettingsPanel } from "@/components/auth/ProfileSettingsPanel";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["fr", "en", "ar"];
export function generateStaticParams() { return locales.map(locale => ({ locale })); }
export const metadata: Metadata = { title: "Notification preferences | KULHA!" };
export default async function NotificationPreferencesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  return <ProfileSettingsPanel initialSection="notifications" />;
}
