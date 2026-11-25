import type { ReactNode } from "react";
import { AdminWorkspaceProvider } from "@/components/admin/AdminWorkspace";
import type { SiteLocale } from "@/lib/i18n/site-copy";

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <AdminWorkspaceProvider locale={locale as SiteLocale}>{children}</AdminWorkspaceProvider>;
}
