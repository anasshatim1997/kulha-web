import { notFound } from "next/navigation";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { requireAdminPage } from "@/lib/auth/server-admin";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["fr", "en", "ar"];
export const dynamic = "force-dynamic";
export const metadata = { title: "KULHA! — Administration", robots: { index: false } };

export default async function AdminOverviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  await requireAdminPage(locale);
  return <AdminOverview locale={locale as SiteLocale} />;
}
