import { notFound } from "next/navigation";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { requireAdminPage } from "@/lib/auth/server-admin";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["fr", "en", "ar"];
const results = ["", "SUCCESS", "DENIED", "FAILED"] as const;
const date = (value?: string) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
const action = (value?: string) => value && /^[A-Z0-9_]{1,64}$/.test(value) ? value : "";
export const dynamic = "force-dynamic";
export const metadata = { title: "KULHA! — Audit event", robots: { index: false } };

export default async function AdminAuditRecordPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ page?: string; size?: string; from?: string; to?: string; action?: string; result?: string }>;
}) {
  const [{ locale, id }, query] = await Promise.all([params, searchParams]);
  if (!locales.includes(locale as SiteLocale) || !id) notFound();
  await requireAdminPage(locale);
  const initialPage = Math.max(0, Number.isFinite(Number(query.page)) ? Math.min(10000, Math.floor(Number(query.page))) : 0);
  const parsedSize = Number(query.size);
  const initialAuditPageSize = ([10, 20, 50] as const).includes(parsedSize as 10 | 20 | 50) ? parsedSize as 10 | 20 | 50 : 10;
  const initialAuditResult: "" | "SUCCESS" | "DENIED" | "FAILED" =
    results.includes(query.result as (typeof results)[number]) ? query.result as "SUCCESS" | "DENIED" | "FAILED" : "";
  return (
    <AdminConsole
      locale={locale as SiteLocale}
      page="audit-log"
      recordId={id}
      initialPage={initialPage}
      initialAuditPageSize={initialAuditPageSize}
      initialAuditFrom={date(query.from)}
      initialAuditTo={date(query.to)}
      initialAuditAction={action(query.action)}
      initialAuditResult={initialAuditResult}
    />
  );
}
