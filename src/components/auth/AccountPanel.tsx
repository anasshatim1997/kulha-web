"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, type Me } from "@/components/session/SessionProvider";
import { api } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { customerDashboardCopy } from "@/lib/i18n/customer-dashboard-copy";
import { localeFromPath, localePath } from "@/lib/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { useToast } from "@/components/feedback/ToastProvider";
import "@/components/auth/account.css";

// Strings that only this screen needs. Everything else comes from customerDashboardCopy.
const extra = {
    fr: {
        hello: "Bonjour",
        subtitle: "Vos paniers et vos informations, au même endroit.",
        verifyTitle: "Confirmez votre e-mail pour activer toutes les fonctions du compte",
        verifySent: "Nous avons envoyé un lien à",
        explore: "Explorer les paniers",
        sections: "Navigation du compte",
    },
    en: {
        hello: "Hello",
        subtitle: "Your baskets and your details, in one place.",
        verifyTitle: "Verify your email to activate all account features",
        verifySent: "We sent a link to",
        explore: "Explore baskets",
        sections: "Account navigation",
    },
    ar: {
        hello: "مرحباً",
        subtitle: "سلالك ومعلوماتك في مكان واحد.",
        verifyTitle: "أكّد بريدك الإلكتروني لتفعيل جميع ميزات الحساب",
        verifySent: "أرسلنا رابطاً إلى",
        explore: "استكشف السلال",
        sections: "التنقل في الحساب",
    },
} as const satisfies Record<SiteLocale, object>;

type IconName = "calendar" | "user" | "logout" | "mail" | "bag" | "lock";

function Icon({ name }: { name: IconName }) {
    const paths: Record<IconName, React.ReactNode> = {
        calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>,
        user: <><circle cx="12" cy="8" r="3.6" /><path d="M5 20c.6-3.6 3.5-5.6 7-5.6s6.4 2 7 5.6" /></>,
        logout: <><path d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10" /><path d="M15 8l4 4-4 4M19 12H9" /></>,
        mail: <><rect x="3" y="5.5" width="18" height="13" rx="3" /><path d="m4 8 8 5.5L20 8" /></>,
        bag: <><path d="M6 8h12l1 12H5L6 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
        lock: <><rect x="5" y="10.5" width="14" height="9.5" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>,
    };
    return <svg className="ac-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export function AccountPanel() {
    const pathname = usePathname();
    const locale = localeFromPath(pathname) as SiteLocale;
    const t = customerDashboardCopy[locale];
    const x = extra[locale] ?? extra.en;
    const { state, signOut, reload } = useSession();
    const toast = useToast();
    const [resend, setResend] = useState<"idle" | "pending" | "done">("idle");
    const [error, setError] = useState<string | null>(null);
    const [fullName, setFullName] = useState(state.status === "authenticated" ? state.user.fullName : "");
    const [phone, setPhone] = useState(state.status === "authenticated" ? state.user.phone ?? "" : "");
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [active, setActive] = useState<"reservations" | "details">("reservations");

    // Re-seed the form whenever the session state changes. Done during render (not in an effect) so we
    // don't paint stale values first; React re-renders immediately with the updated state.
    const [syncedState, setSyncedState] = useState(state);
    if (syncedState !== state) {
        setSyncedState(state);
        if (state.status === "authenticated") {
            setFullName(state.user.fullName);
            setPhone(state.user.phone ?? "");
        }
    }

    // The sidebar entries work as tabs: one panel at a time, so the screen never needs to scroll.
    // The hash keeps deep links (/account#ac-details) and the back button working.
    useEffect(() => {
        const syncFromHash = () => {
            if (window.location.hash === "#ac-details") setActive("details");
            else if (window.location.hash === "#ac-reservations") setActive("reservations");
        };
        syncFromHash();
        window.addEventListener("hashchange", syncFromHash);
        return () => window.removeEventListener("hashchange", syncFromHash);
    }, []);

    if (state.status === "loading") return <div className="ac ac-skeleton" aria-label={t.account} />;
    if (state.status === "anonymous") {
        return <section className="ac ac-anonymous"><h1>{t.account}</h1><p>{t.signedOut}</p></section>;
    }

    const { user } = state;
    const firstName = user.fullName.trim().split(/\s+/)[0] || user.fullName;
    const changed = fullName.trim() !== user.fullName || phone.trim() !== (user.phone ?? "");

    async function saveProfile(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const cleanName = fullName.trim();
        if (!cleanName) {
            setProfileError(t.nameRequired);
            return;
        }
        setSavingProfile(true);
        setProfileError(null);
        try {
            await api.put<Me>("/me", { fullName: cleanName, phone: phone.trim() || null });
            await reload();
            toast.success({ title: t.profileSaved });
        } catch (cause) {
            const detail = describeError(cause);
            setProfileError(detail || t.profileError);
            toast.error({ title: t.account, description: detail || t.profileError });
        } finally {
            setSavingProfile(false);
        }
    }

    async function resendVerification() {
        setResend("pending");
        setError(null);
        try {
            await api.post("/auth/resend-verification", { email: user.email });
            setResend("done");
            toast.success({ title: t.resent });
        } catch (cause) {
            const detail = describeError(cause);
            setError(detail || t.error);
            toast.error({ title: t.account, description: detail || t.error });
            setResend("idle");
        }
    }

    return (
        <div className="ac ac--dash" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
            <aside className="ac-side">
                <section className="ac-profile" aria-label={user.fullName}>
                    <span className="ac-avatar" aria-hidden="true">{user.fullName.trim().charAt(0).toUpperCase()}</span>
                    <h2>{user.fullName}</h2>
                    <p className="ac-profile__email">{user.email}</p>
                    <span className={`ac-badge ${user.emailVerified ? "is-ok" : "is-warn"}`}>{user.emailVerified ? t.verified : t.notVerified}</span>
                </section>

                <nav className="ac-nav" aria-label={x.sections}>
                    <a href="#ac-reservations" className={active === "reservations" ? "is-active" : ""} aria-current={active === "reservations" ? "true" : undefined} onClick={() => setActive("reservations")}>
                        <Icon name="calendar" /><span>{t.reservations}</span>
                    </a>
                    <a href="#ac-details" className={active === "details" ? "is-active" : ""} aria-current={active === "details" ? "true" : undefined} onClick={() => setActive("details")}>
                        <Icon name="user" /><span>{t.personalDetails}</span>
                    </a>
                    <button type="button" onClick={() => void signOut()}>
                        <Icon name="logout" /><span>{t.signOut}</span>
                    </button>
                </nav>

                <section className="ac-shop">
                    <h2>{t.shopTitle}</h2>
                    <p>{t.shopBody}</p>
                    <Link href={localePath(locale, "/merchant/apply")} className="ac-shop__cta">{t.shopCta}</Link>
                </section>
            </aside>

            <div className="ac-main">
                <header className="ac-head">
                    <p className="ac-kicker">{t.eyebrow}</p>
                    <h1>{x.hello}, {firstName}</h1>
                    <p className="ac-head__sub">{x.subtitle}</p>
                </header>

                {!user.emailVerified && (
                    <section className="ac-verify" role="status">
                        <Icon name="mail" />
                        <div className="ac-verify__copy">
                            <strong>{x.verifyTitle}</strong>
                            <span>{resend === "done" ? t.resent : `${x.verifySent} ${user.email}`}</span>
                            {error && <span className="ac-verify__error" role="alert">{error}</span>}
                        </div>
                        {resend !== "done" && (
                            <button type="button" className="ac-verify__btn" disabled={resend === "pending"} onClick={() => void resendVerification()}>
                                {resend === "pending" ? t.resending : t.resend}
                            </button>
                        )}
                    </section>
                )}

                <section className="ac-section" id="ac-reservations" aria-labelledby="ac-reservations-title" hidden={active !== "reservations"}>
                    <h2 className="ac-label" id="ac-reservations-title">{t.reservations}</h2>
                    <div className="ac-card ac-empty">
                        <span className="ac-empty__icon" aria-hidden="true"><Icon name="bag" /></span>
                        <div className="ac-empty__copy">
                            <h3>{t.reservationsTitle}</h3>
                            <p>{t.reservationsBody}</p>
                            <div className="ac-empty__actions">
                                <Link href={localePath(locale, "/offers")} className="ac-btn ac-btn--primary">{x.explore}</Link>
                                <Link href={localePath(locale, "/how-it-works")} className="ac-btn ac-btn--ghost">{t.how}</Link>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="ac-section" id="ac-details" aria-labelledby="ac-details-title" hidden={active !== "details"}>
                    <h2 className="ac-label" id="ac-details-title">{t.personalDetails}</h2>
                    <form className="ac-card ac-form" onSubmit={saveProfile}>
                        <label className="ac-field">
                            <span>{t.name}</span>
                            <input name="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" maxLength={120} required />
                        </label>
                        <label className="ac-field">
                            <span>{t.phone}</span>
                            <input name="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" maxLength={30} placeholder="+212 6 00 00 00 00" />
                        </label>
                        <div className="ac-field ac-field--wide">
                            <label htmlFor="ac-email">{t.email}</label>
                            <div className="ac-readonly">
                                <input id="ac-email" name="email" type="email" value={user.email} readOnly aria-describedby="ac-email-help" />
                                <Icon name="lock" />
                            </div>
                            <small id="ac-email-help">{t.emailReadOnly}</small>
                        </div>
                        {profileError && <p className="ac-form__error" role="alert">{profileError}</p>}
                        <div className="ac-form__actions">
                            <button className="ac-btn ac-btn--primary" type="submit" disabled={savingProfile || !changed || !fullName.trim()}>{savingProfile ? t.saving : t.saveChanges}</button>
                            <button className="ac-btn ac-btn--ghost" type="button" disabled={savingProfile || !changed} onClick={() => { setFullName(user.fullName); setPhone(user.phone ?? ""); setProfileError(null); }}>{t.cancelChanges}</button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
}