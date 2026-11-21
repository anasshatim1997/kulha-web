import { notFound } from "next/navigation";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { requireAdminPage } from "@/lib/auth/server-admin";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["fr", "en", "ar"];
export const dynamic = "force-dynamic";
export const metadata = { title: "KULHA! — Merchant review", robots: { index: false } };

export default async function AdminWorkspacePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as SiteLocale)) notFound();
  await requireAdminPage(locale);
  return <AdminConsole locale={locale as SiteLocale} page="merchant-review" />;
}
