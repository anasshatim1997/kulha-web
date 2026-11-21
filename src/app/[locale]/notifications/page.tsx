import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["fr", "en", "ar"];
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = locale === "ar" ? "الإشعارات | KULHA!" : locale === "en" ? "Notifications | KULHA!" : "Notifications | KULHA!";
  return { title };
}
export function generateStaticParams() { return locales.map(locale => ({ locale })); }
export default async function NotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  return <NotificationPanel />;
}
