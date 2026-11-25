import { notFound } from "next/navigation";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { requireAdminPage } from "@/lib/auth/server-admin";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["fr", "en", "ar"];
const filters = ["", "REPORTED", "ALLERGENS_UNKNOWN", "SUSPENDED"] as const;
export const dynamic = "force-dynamic";
export const metadata = { title: "KULHA! — Offer review", robots: { index: false } };

export default async function AdminOfferRecordPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const [{ locale, id }, query] = await Promise.all([params, searchParams]);
  if (!locales.includes(locale as SiteLocale) || !id) notFound();
  await requireAdminPage(locale);
  const initialPage = Math.max(0, Number.isFinite(Number(query.page)) ? Math.min(10000, Math.floor(Number(query.page))) : 0);
  const initialFilter = filters.includes(query.filter as (typeof filters)[number]) ? query.filter! : "";
  return <AdminConsole locale={locale as SiteLocale} page="offer-moderation" recordId={id} initialPage={initialPage} initialFilter={initialFilter} />;
}
