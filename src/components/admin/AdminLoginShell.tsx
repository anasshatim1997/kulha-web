import type { ReactNode } from "react";
import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import styles from "./AdminLoginShell.module.css";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { localePath } from "@/lib/navigation";

type AdminLoginShellProps = {
    locale?: SiteLocale;
    title: string;
    lead: string;
    children: ReactNode;
};

const copy = {
    fr: {
        workspace: "ESPACE D’ADMINISTRATION",
        eyebrow: "Accès sécurisé",
        restricted: "Accès réservé aux administrateurs autorisés",
        audit: "Les actions sensibles sont consignées dans le journal d’audit.",
    },
    en: {
        workspace: "ADMINISTRATION",
        eyebrow: "Secure administrator access",
        restricted: "Authorized administrators only",
        audit: "Sensitive actions are recorded in the audit log.",
    },
    ar: {
        workspace: "مساحة الإدارة",
        eyebrow: "دخول إداري آمن",
        restricted: "للمسؤولين المصرح لهم فقط",
        audit: "يتم تسجيل الإجراءات الحساسة في سجل التدقيق.",
    },
} as const;

export function AdminLoginShell({ locale = "fr", title, lead, children }: AdminLoginShellProps) {
    const t = copy[locale];

    return (
        <main
            className={`admin-login-shell ${styles.layout}`}
            dir={locale === "ar" ? "rtl" : "ltr"}
            lang={locale === "ar" ? "ar-MA" : locale}
        >
            <header className={styles.topbar}>
                <Link href={localePath(locale, "/admin/login")} className={styles.brand} aria-label="Kulha! Admin">
                    <span className={styles.word} dir="ltr">KULHA<span>!</span></span>
                    <span className={styles.brandDivider} />
                    <small>ADMIN</small>
                </Link>
                <span className={styles.accessLabel}>
                    <LockKeyhole size={14} aria-hidden="true" />
                    {t.workspace}
                </span>
            </header>

            <div className={styles.stage}>
                <section
                    className={styles.accessPanel}
                    aria-labelledby="admin-login-title"
                    data-testid="admin-login-access-panel"
                >
                    <div className={styles.accessCard}>
                        <div className={styles.lockTile} aria-hidden="true">
                            <ShieldCheck size={21} strokeWidth={1.9} />
                        </div>
                        <span className={styles.cardEyebrow}>{t.eyebrow}</span>
                        <h1 id="admin-login-title">{title}</h1>
                        <p className={styles.lead}>{lead}</p>
                        <div className={styles.form}>{children}</div>
                        <p className={styles.restricted}>{t.restricted}</p>
                        <p className={styles.note}>
                            <ShieldCheck size={15} aria-hidden="true" />
                            {t.audit}
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
