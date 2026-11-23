import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, FileText, LockKeyhole, ShieldCheck, Store, Tag } from "lucide-react";
import styles from "./AdminLoginShell.module.css";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { localePath } from "@/lib/navigation";

type AdminLoginShellProps = {
    locale?: SiteLocale;
    title: string;
    lead: string;
    children: ReactNode;
};

const sectionIcons = [Tag, Store, Activity, FileText] as const;

const copy = {
    fr: {
        workspace: "ESPACE D’ADMINISTRATION",
        eyebrow: "Accès sécurisé",
        headline: "Pilotez KULHA avec clarté.",
        intro: "Un espace dédié aux équipes qui veillent sur les offres, les commerces et les clients.",
        sections: [["Offres", "Contrôle et modération"], ["Commerces", "Validation des partenaires"], ["Support", "Suivi des dossiers"], ["Audit", "Traçabilité des décisions"]],
        restricted: "Accès réservé aux administrateurs autorisés",
        audit: "Les actions sensibles sont consignées dans le journal d’audit.",
        customer: "Vous cherchez l’espace client ou commerçant ?",
        go: "Accéder à la connexion",
    },
    en: {
        workspace: "ADMINISTRATION WORKSPACE",
        eyebrow: "Secure access",
        headline: "A clearer view of KULHA.",
        intro: "A dedicated workspace for the teams looking after offers, merchants and customers.",
        sections: [["Offers", "Review and moderation"], ["Merchants", "Partner verification"], ["Support", "Case management"], ["Audit", "Decision traceability"]],
        restricted: "Authorized administrators only",
        audit: "Sensitive actions are recorded in the audit log.",
        customer: "Looking for the customer or merchant workspace?",
        go: "Go to sign in",
    },
    ar: {
        workspace: "مساحة الإدارة",
        eyebrow: "دخول آمن",
        headline: "إدارة أوضح لمنصة KULHA.",
        intro: "مساحة مخصصة للفريق المسؤول عن العروض والمتاجر والعملاء.",
        sections: [["العروض", "المراجعة والإشراف"], ["المتاجر", "التحقق من الشركاء"], ["الدعم", "متابعة الحالات"], ["التدقيق", "توثيق القرارات"]],
        restricted: "للمسؤولين المصرح لهم فقط",
        audit: "يتم تسجيل الإجراءات الحساسة في سجل التدقيق.",
        customer: "هل تبحث عن مساحة العملاء أو المتاجر؟",
        go: "الانتقال إلى تسجيل الدخول",
    },
} as const;

export function AdminLoginShell({ locale = "fr", title, lead, children }: AdminLoginShellProps) {
    const t = copy[locale];

    return (
        <main className={`admin-login-shell ${styles.layout}`} dir={locale === "ar" ? "rtl" : "ltr"} lang={locale === "ar" ? "ar-MA" : locale}>
            <header className={styles.topbar}>
                <Link href={localePath(locale, "/admin/login")} className={styles.brand} aria-label="Kulha! Admin">
                    <span className={styles.word} dir="ltr">KULHA<span>!</span></span>
                    <span className={styles.brandDivider} />
                    <small>ADMIN</small>
                </Link>
                <span className={styles.accessLabel}><LockKeyhole size={14} aria-hidden="true" />{t.workspace}</span>
            </header>

            <div className={styles.stage}>
                <section className={styles.brandPanel} aria-label={t.workspace} data-testid="admin-login-brand-panel">
                    <div className={styles.panelEyebrow}><span />{t.eyebrow}</div>
                    <h2>{t.headline}</h2>
                    <p className={styles.intro}>{t.intro}</p>
                    <div className={styles.console}>
                        {t.sections.map(([name, description], index) => {
                            const Icon = sectionIcons[index];
                            return (
                                <div className={styles.consoleItem} key={name}>
                                    <span className={styles.tile} aria-hidden="true"><Icon size={17} strokeWidth={1.9} /></span>
                                    <span><strong>{name}</strong><small>{description}</small></span>
                                </div>
                            );
                        })}
                    </div>
                    <div className={styles.restricted}><ShieldCheck size={16} aria-hidden="true" />{t.restricted}</div>
                </section>

                <section className={styles.accessPanel} aria-labelledby="admin-login-title" data-testid="admin-login-access-panel">
                    <div className={styles.accessCard}>
                        <div className={styles.lockTile} aria-hidden="true"><ShieldCheck size={21} strokeWidth={1.9} /></div>
                        <span className={styles.cardEyebrow}>{t.eyebrow}</span>
                        <h1 id="admin-login-title">{title}</h1>
                        <p className={styles.lead}>{lead}</p>
                        <div className={styles.form}>{children}</div>
                        <p className={styles.note}><ShieldCheck size={15} aria-hidden="true" />{t.audit}</p>
                    </div>
                    <p className={styles.customer}>{t.customer} <Link href={localePath(locale, "/login")}>{t.go}</Link></p>
                </section>
            </div>
        </main>
    );
}
