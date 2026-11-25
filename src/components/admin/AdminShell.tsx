import type { ReactNode } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { AdminWorkspaceTabs } from "./AdminWorkspace";
import styles from "./AdminShell.module.css";

type AdminPageKey = "merchant-review" | "offer-moderation" | "support-cases" | "audit-log";
type AdminShellProps = { page: AdminPageKey; locale: SiteLocale; topbar: ReactNode; children: ReactNode };

export function AdminShell({ page, locale, topbar, children }: AdminShellProps) {
    return (
        <div className={`${styles.shell} kulhaAdminShell`} data-page={page} dir={locale === "ar" ? "rtl" : "ltr"}>
            {topbar}
            <main className={styles.page}>
                <AdminWorkspaceTabs page={page} locale={locale}>{children}</AdminWorkspaceTabs>
            </main>
        </div>
    );
}
