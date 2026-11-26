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
        audit: "Les actions sensibles sont consignées dans le journal d’audit.", headline: "La gestion de KULHA, en toute confiance.", intro: "Modérez les offres, vérifiez les commerces et accompagnez les clients.", customer: "Connexion client / commerce",
    },
    en: {
        workspace: "ADMINISTRATION",
        eyebrow: "Secure administrator access",
        restricted: "Authorized administrators only",
        audit: "Sensitive actions are recorded in the audit log.", headline: "KULHA operations, with confidence.", intro: "Moderate offers, review merchants and handle support cases.", customer: "Customer / shop sign in",
    },
    ar: {
        workspace: "مساحة الإدارة",
        eyebrow: "دخول إداري آمن",
        restricted: "للمسؤولين المصرح لهم فقط",
        audit: "يتم تسجيل الإجراءات الحساسة في سجل التدقيق.", headline: "إدارة KULHA بكل ثقة.", intro: "راجع العروض والمتاجر وطلبات دعم العملاء.", customer: "دخول العملاء والمتاجر",
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
            <div className={styles.loginGrid}>
                <section className={styles.identityPanel}>
                    <Link href={localePath(locale, "/admin/login")} className={styles.identityBrand} aria-label="Kulha! Admin">
                        <span className={styles.identityWord} dir="ltr">Kulha<span>!</span></span>
                    </Link>
                    <span className={styles.identityBadge}><LockKeyhole size={13} aria-hidden="true"/> {t.workspace}</span>
                    <h2>{t.headline}</h2>
                    <p>{t.intro}</p>
                    <div className={styles.identityFoot}><ShieldCheck size={16} aria-hidden="true"/>{t.audit}</div>
                </section>
                <section className={styles.stage}>
                    <section className={styles.accessPanel} aria-labelledby="admin-login-title" data-testid="admin-login-access-panel">
                    <div className={styles.accessCard}>
                        <div className={styles.lockTile} aria-hidden="true">
                            <ShieldCheck size={21} strokeWidth={1.9} />
                        </div>
                        <span className={styles.cardEyebrow}>{t.eyebrow}</span>
                        <h1 id="admin-login-title">{title}</h1>
                        <p className={styles.lead}>{lead}</p>
                        <div className={styles.form}>{children}</div>
                        <p className={styles.restricted}>{t.restricted}</p>
                        <p className={styles.note}><ShieldCheck size={15} aria-hidden="true" />{t.restricted}</p>
                        <Link className={styles.customerLink} href={localePath(locale, "/login")}>{t.customer}</Link>
                    </div>
                    </section>
                </section>
            </div>
        </main>
    );
}
