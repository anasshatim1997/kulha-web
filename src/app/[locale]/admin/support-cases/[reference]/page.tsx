import { notFound } from "next/navigation";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { requireSupportCasesPage } from "@/lib/auth/server-admin";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["fr", "en", "ar"];
const statuses = ["OPEN", "ESCALATED", "WAITING_REPLY", "RESOLVED"] as const;
export const dynamic = "force-dynamic";
export const metadata = { title: "KULHA! — Support case", robots: { index: false } };

export default async function AdminSupportRecordPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string; reference: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const [{ locale, reference }, query] = await Promise.all([params, searchParams]);
  if (!locales.includes(locale as SiteLocale) || !reference) notFound();
  await requireSupportCasesPage(locale);
  const initialPage = Math.max(0, Number.isFinite(Number(query.page)) ? Math.min(10000, Math.floor(Number(query.page))) : 0);
  const initialFilter = statuses.includes(query.status as (typeof statuses)[number]) ? query.status! : "OPEN";
  return <AdminConsole locale={locale as SiteLocale} page="support-cases" recordId={reference} initialPage={initialPage} initialFilter={initialFilter} />;
}
