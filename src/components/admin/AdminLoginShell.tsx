import type { ReactNode } from "react";
import Link from "next/link";
import {
    FileText,
    Lock,
    ShieldCheck,
    Store,
    Tag,
} from "lucide-react";
import styles from "./AdminLoginShell.module.css";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { localePath } from "@/lib/navigation";

type AdminLoginShellProps = {
    locale?: SiteLocale;
    title: string;
    lead: string;
    children: ReactNode;
};

const sectionIcons = [Tag, Store, ShieldCheck, FileText] as const;

const copy = {
    fr: {
        headline: "Gardez chaque offre et chaque commerce en règle.",
        intro: "Modérez les offres, approuvez les commerces et accompagnez les clients depuis un seul espace.",
        inside: "Dans l’espace d’administration",
        sections: [
            ["Offres", "Masquer, demander une correction ou rétablir une offre."],
            ["Commerces", "Seuls les commerces approuvés peuvent publier des offres."],
            ["Support", "Réclamations clients et commerces, avec priorité à la sécurité alimentaire."],
            ["Journal d’audit", "Qui a fait quoi, sur quel dossier et pour quelle raison."],
        ],
        restricted: "Zone réservée aux administrateurs autorisés.",
        audit: "Chaque action est inscrite au journal d’audit.",
        customer: "Vous cherchez l’accès client ou commerçant ?",
        go: "Se connecter",
    },
    en: {
        headline: "Keep every offer and shop in good standing.",
        intro: "Review offers, approve merchants and help customers from one workspace.",
        inside: "Inside the admin workspace",
        sections: [
            ["Offers", "Hide, request a correction or restore an offer."],
            ["Merchants", "Only approved shops can publish offers or take reservations."],
            ["Support", "Customer and shop reports, with food safety first."],
            ["Audit log", "Who did what, on which record, and why."],
        ],
        restricted: "Restricted area. Authorized administrators only.",
        audit: "Every action is kept in the audit log.",
        customer: "Looking for the customer or shop sign in?",
        go: "Go to sign in",
    },
    ar: {
        headline: "حافظ على سلامة كل عرض ومتجر.",
        intro: "راجع العروض، واعتمد المتاجر، وساعد العملاء من مساحة عمل واحدة.",
        inside: "داخل مساحة الإدارة",
        sections: [
            ["مراقبة العروض", "إخفاء العرض أو طلب تعديله أو إعادته للنشر."],
            ["مراجعة المتاجر", "المتاجر المعتمدة فقط يمكنها نشر العروض واستقبال الحجوزات."],
            ["حالات الدعم", "بلاغات العملاء والمتاجر مع أولوية سلامة الغذاء."],
            ["سجل التدقيق", "من قام بماذا وعلى أي سجل ولماذا."],
        ],
        restricted: "منطقة مقيّدة. للمسؤولين المصرح لهم فقط.",
        audit: "يتم تسجيل كل إجراء في سجل التدقيق.",
        customer: "هل تبحث عن دخول العملاء أو المتاجر؟",
        go: "الانتقال إلى تسجيل الدخول",
    },
} as const;

export function AdminLoginShell({
                                    locale = "fr",
                                    title,
                                    lead,
                                    children,
                                }: AdminLoginShellProps) {
    const t = copy[locale];

    return (
        <main
            className={`admin-login-shell ${styles.layout}`}
            dir={locale === "ar" ? "rtl" : "ltr"}
            lang={locale === "ar" ? "ar-MA" : locale}
        >
            <aside className={styles.rail}>
                <Link
                    href={localePath(locale, "/admin/login")}
                    className={styles.brand}
                    aria-label="Kulha! Admin"
                >
                    <span className={styles.word} dir="ltr">
                        KULHA<span>!</span>
                    </span>
                    <small>ADMIN</small>
                </Link>

                <div className={styles.railBody}>
                    <p className={styles.headline}>{t.headline}</p>
                    <p className={styles.intro}>{t.intro}</p>

                    <ul className={styles.console} aria-label={t.inside}>
                        {t.sections.map(([name, description], index) => {
                            const Icon = sectionIcons[index];

                            return (
                                <li key={name}>
                                    <span className={styles.tile} aria-hidden="true">
                                        <Icon size={18} strokeWidth={1.9} />
                                    </span>
                                    <span className={styles.sectionText}>
                                        <strong>{name}</strong>
                                        <small>{description}</small>
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <p className={styles.restricted}>
                    <Lock size={14} aria-hidden="true" />
                    {t.restricted}
                </p>
            </aside>

            <section className={styles.formSide}>
                <div className={styles.formWrap}>
                    <span className={styles.lockTile} aria-hidden="true">
                        <ShieldCheck size={22} strokeWidth={1.9} />
                    </span>

                    <h1>{title}</h1>
                    <p className={styles.lead}>{lead}</p>

                    <div className={styles.form}>
                        {children}
                    </div>

                    <p className={styles.note}>
                        <ShieldCheck size={15} aria-hidden="true" />
                        {t.audit}
                    </p>
                </div>

                <p className={styles.customer}>
                    {t.customer}{" "}
                    <Link href={localePath(locale, "/login")}>
                        {t.go}
                    </Link>
                </p>
            </section>
        </main>
    );
}