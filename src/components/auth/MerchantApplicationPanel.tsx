"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useSession } from "@/components/session/SessionProvider";
import { useToast } from "@/components/feedback/ToastProvider";
import { Alert } from "@/components/ui/Alert";
import { Button, LinkButton } from "@/components/ui/Button";
import { ApiError, api } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { OpeningHoursPicker } from "@/components/merchant/OpeningHoursPicker";
import { merchantCopy } from "@/lib/i18n/merchant-copy";
import { defaultWeek, describeStoredHours, parseWeek, serializeWeek, validateWeek, type DayKey, type WeekSchedule } from "@/lib/merchant/opening-hours";
import { localeFromPath, localePath } from "@/lib/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";

type BusinessType = "BAKERY" | "CAFE" | "RESTAURANT" | "SUPERMARKET" | "OTHER";
type MerchantStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
type MerchantRecord = {
    id: string;
    name: string;
    businessType: BusinessType;
    address: string;
    city: string;
    phone: string;
    openingHours: string;
    status: MerchantStatus;
    decisionReason: string | null;
    createdAt: string;
};
type MerchantFormValues = Omit<MerchantRecord, "id" | "status" | "decisionReason" | "createdAt" | "openingHours"> & { hours: WeekSchedule };
type TextFieldKey = "name" | "address" | "city" | "phone";
type FieldKey = TextFieldKey | "openingHours";
type FormErrors = Partial<Record<FieldKey, string>>;
type Copy = (typeof merchantCopy)[SiteLocale];

const emptyValues = (): MerchantFormValues => ({ name: "", businessType: "BAKERY", address: "", city: "", phone: "", hours: defaultWeek() });
const businessTypes: BusinessType[] = ["BAKERY", "CAFE", "RESTAURANT", "SUPERMARKET", "OTHER"];
const textFields: TextFieldKey[] = ["name", "address", "city", "phone"];
const fieldIds: Record<FieldKey, string> = {
    name: "merchant-name", address: "merchant-address", city: "merchant-city", phone: "merchant-phone", openingHours: "merchant-hours",
};
const STEP_FIELDS: FieldKey[][] = [["name"], ["address", "city", "phone"], ["openingHours"]];
const LAST_STEP = STEP_FIELDS.length - 1;

function validate(values: MerchantFormValues, t: Copy): { errors: FormErrors; hoursDay?: DayKey } {
    const errors: FormErrors = {};
    let hoursDay: DayKey | undefined;
    if (!values.name.trim() || values.name.length > 120) errors.name = t.required;
    if (!values.address.trim() || values.address.length > 255) errors.address = t.required;
    if (!values.city.trim() || values.city.length > 80) errors.city = t.required;
    if (!values.phone.trim() || values.phone.length > 30) errors.phone = t.required;
    else if (!/^[+0-9 ()-]{6,30}$/.test(values.phone.trim())) errors.phone = t.phoneError;
    const problem = validateWeek(values.hours);
    if (problem) {
        if (problem.code === "none") errors.openingHours = t.hoursNone;
        else {
            hoursDay = problem.day;
            errors.openingHours = (problem.code === "order" ? t.hoursOrder : t.hoursTime).replace("{day}", t.days[problem.day]);
        }
    }
    return { errors, hoursDay };
}

function pick(locale: SiteLocale, en: string, fr: string, ar: string) {
    return locale === "en" ? en : locale === "ar" ? ar : fr;
}

type GeoAddress = {
    house_number?: string;
    road?: string;
    pedestrian?: string;
    neighbourhood?: string;
    suburb?: string;
    quarter?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
};

function addressFromGeo(geo: GeoAddress) {
    const street = [geo.house_number, geo.road ?? geo.pedestrian].filter(Boolean).join(" ");
    const area = geo.neighbourhood ?? geo.suburb ?? geo.quarter;
    const address = [street, area].filter(Boolean).join(", ").slice(0, 255);
    const city = (geo.city ?? geo.town ?? geo.village ?? geo.municipality ?? geo.county ?? "").slice(0, 80);
    return { address, city };
}

function Shell({ locale, children }: { locale: SiteLocale; children: ReactNode }) {
    return <div className="mw-shell" dir={locale === "ar" ? "rtl" : "ltr"}>{children}</div>;
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
    );
}

function Tracker({ t, current, alert = false, detail }: { t: Copy; current: 1 | 2 | 3; alert?: boolean; detail?: ReactNode }) {
    const steps = [
        [t.trackSend, t.trackSendBody],
        [t.trackReview, t.trackReviewBody],
        [t.trackPublish, t.trackPublishBody],
    ] as const;
    return (
        <ol className="mw-tracker" aria-label={t.trackerLabel}>
            {steps.map(([title, body], index) => {
                const number = index + 1;
                const done = number < current;
                const active = number === current;
                const stateClass = done ? "mw-step-done" : active ? (alert ? "mw-step-alert" : "mw-step-current") : "";
                return (
                    <li key={title} className={`mw-step ${stateClass}`} aria-current={active ? "step" : undefined}>
                        <span className="mw-step-mark" aria-hidden="true">{done ? <CheckIcon /> : active && alert ? "!" : number}</span>
                        <div className="mw-step-text"><strong>{title}</strong>{active && detail ? detail : <span>{body}</span>}</div>
                    </li>
                );
            })}
        </ol>
    );
}

function Aside({ title, body, children }: { title: string; body?: string; children: ReactNode }) {
    return (
        <aside className="mw-aside">
            <div className="mw-aside-top">
                <h2 className="mw-aside-title">{title}</h2>
            </div>
            {body && <p className="mw-aside-body">{body}</p>}
            {children}
        </aside>
    );
}

/** The dossier being sent, shown inside step 1 of the tracker. Fills in live as the merchant types. */
function DossierCard({ t, values, showHours }: { t: Copy; values: MerchantFormValues; showHours: boolean }) {
    const hours = useMemo(() => {
        if (!showHours) return null;
        try {
            return describeStoredHours(serializeWeek(values.hours), t.daysShort, t.hoursClosed);
        } catch {
            return null;
        }
    }, [showHours, values.hours, t.daysShort, t.hoursClosed]);
    const name = values.name.trim();
    const address = [values.address.trim(), values.city.trim()].filter(Boolean).join(", ");
    const phone = values.phone.trim();
    const place = [t.types[values.businessType], values.city.trim()].filter(Boolean).join(" · ");
    const icon = { viewBox: "0 0 24 24", width: 15, height: 15, fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
    return (
        <div className="mw-dossier">
            <div className="mw-dossier-who">
                <i className="mw-dossier-avatar" aria-hidden="true">{name ? Array.from(name)[0]?.toUpperCase() : "K"}</i>
                <div className="mw-dossier-id">
                    <b className={`mw-dossier-name${name ? "" : " is-empty"}`}>{name || t.namePlaceholder}</b>
                    <p className="mw-dossier-meta">{place}</p>
                </div>
            </div>
            <div className="mw-dossier-rows">
                <div className={`mw-dossier-row${address ? "" : " is-empty"}`}>
                    <svg {...icon}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></svg>
                    <p>{address || t.address}</p>
                </div>
                <div className={`mw-dossier-row${phone ? "" : " is-empty"}`}>
                    <svg {...icon}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
                    <p>{phone || t.phone}</p>
                </div>
                <div className={`mw-dossier-row${hours ? "" : " is-empty"}`}>
                    <svg {...icon}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
                    <p>{hours || t.openingHours}</p>
                </div>
            </div>
        </div>
    );
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
    return (
        <div className="mw-field">
            <label htmlFor={id} className="mw-label">{label}</label>
            {children}
            {hint && !error && <p id={`${id}-hint`} className="mw-hint">{hint}</p>}
            {error && <p id={`${id}-error`} role="alert" className="mw-error">{error}</p>}
        </div>
    );
}

function describedBy(id: string, hint?: string, error?: string) {
    return [error ? `${id}-error` : hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
}

function Details({ merchant, t, wide = false }: { merchant: MerchantRecord; t: Copy; wide?: boolean }) {
    return (
        <dl className={`mw-details${wide ? " mw-details-row" : ""}`}>
            <div><dt>{t.type}</dt><dd>{t.types[merchant.businessType]}</dd></div>
            <div><dt>{t.city}</dt><dd>{merchant.city}</dd></div>
            <div className="mw-details-wide"><dt>{t.address}</dt><dd>{merchant.address}</dd></div>
            <div><dt>{t.phone}</dt><dd>{merchant.phone}</dd></div>
            <div className="mw-details-hours"><dt>{t.openingHours}</dt><dd>{describeStoredHours(merchant.openingHours, t.daysShort, t.hoursClosed)}</dd></div>
        </dl>
    );
}

export function MerchantApplicationPanel() {
    const pathname = usePathname();
    const locale = localeFromPath(pathname) as SiteLocale;
    const t: Copy = merchantCopy[locale];
    const { state } = useSession();
    const toast = useToast();
    const user = state.status === "authenticated" ? state.user : null;
    const [merchant, setMerchant] = useState<MerchantRecord | null>(null);
    const [values, setValues] = useState<MerchantFormValues>(emptyValues);
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState<"forward" | "back">("forward");
    const [hoursTouched, setHoursTouched] = useState(false);
    const [hoursErrorDay, setHoursErrorDay] = useState<DayKey | undefined>(undefined);
    const [previousHours, setPreviousHours] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const [fieldError, setFieldError] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});
    const [reloadKey, setReloadKey] = useState(0);
    const [locating, setLocating] = useState(false);
    const [locateStatus, setLocateStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (state.status === "loading") return;
        if (!user || !user.emailVerified) {
            setLoading(false);
            return;
        }
        let active = true;
        setLoading(true);
        setLoadError(null);
        api.get<MerchantRecord>("/merchants/me")
            .then((record) => {
                if (!active) return;
                setMerchant(record);
                const week = parseWeek(record.openingHours);
                setValues({
                    name: record.name,
                    businessType: record.businessType,
                    address: record.address,
                    city: record.city,
                    phone: record.phone,
                    hours: week ?? defaultWeek(),
                });
                setHoursTouched(true);
                setPreviousHours(week ? null : record.openingHours);
            })
            .catch((error: unknown) => {
                if (!active) return;
                if (error instanceof ApiError && error.status === 404) {
                    setMerchant(null);
                    setValues(emptyValues());
                } else {
                    setLoadError(describeError(error));
                }
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [state.status, user?.id, user?.emailVerified, reloadKey]);

    async function resendVerification() {
        if (!user) return;
        setResending(true);
        try {
            await api.post("/auth/resend-verification", { email: user.email });
            toast.success({ title: t.resent });
        } catch (error) {
            toast.error({ title: t.verifyTitle, description: describeError(error) });
        } finally {
            setResending(false);
        }
    }

    function setText(key: TextFieldKey, value: string) {
        setValues((current) => ({ ...current, [key]: value }));
        setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
    }

    function setHours(hours: WeekSchedule) {
        setValues((current) => ({ ...current, hours }));
        setHoursTouched(true);
        setHoursErrorDay(undefined);
        setErrors((current) => (current.openingHours ? { ...current, openingHours: undefined } : current));
    }

    async function detectLocation() {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            setLocateStatus({ kind: "error", text: pick(locale, "Your browser can't share your location. Please type the address.", "Votre navigateur ne peut pas partager votre position. Saisissez l’adresse.", "متصفحك لا يدعم تحديد الموقع. يرجى كتابة العنوان.") });
            return;
        }
        setLocating(true);
        setLocateStatus(null);
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
            });
            const controller = new AbortController();
            const timer = window.setTimeout(() => controller.abort(), 8000);
            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=${locale}`;
            const response = await fetch(url, { signal: controller.signal }).finally(() => window.clearTimeout(timer));
            if (!response.ok) throw new Error("reverse-geocoding-failed");
            const data = (await response.json()) as { address?: GeoAddress };
            const found = data.address ? addressFromGeo(data.address) : { address: "", city: "" };
            if (!found.address && !found.city) throw new Error("no-address");
            setValues((current) => ({
                ...current,
                address: found.address || current.address,
                city: found.city || current.city,
            }));
            setErrors((current) => ({ ...current, address: undefined, city: undefined }));
            setLocateStatus({ kind: "ok", text: pick(locale, "Address filled in. Please check it and fix anything that's off.", "Adresse remplie. Vérifiez-la et corrigez si besoin.", "تم ملء العنوان. تحقق منه وصحح ما يلزم.") });
        } catch (error) {
            const denied = typeof error === "object" && error !== null && "code" in error && (error as { code: number }).code === 1;
            setLocateStatus({
                kind: "error",
                text: denied
                    ? pick(locale, "Location access was blocked. Allow it in your browser, or type the address.", "L’accès à la position est bloqué. Autorisez-le dans votre navigateur ou saisissez l’adresse.", "تم حظر الوصول إلى الموقع. اسمح به في المتصفح أو اكتب العنوان.")
                    : pick(locale, "We couldn't find your address. Please type it.", "Impossible de trouver votre adresse. Saisissez-la.", "تعذر العثور على عنوانك. يرجى كتابته."),
            });
        } finally {
            setLocating(false);
        }
    }

    function goTo(next: number) {
        setDirection(next >= step ? "forward" : "back");
        setStep(next);
        setFieldError(null);
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function checkStep(index: number): boolean {
        const { errors: found, hoursDay } = validate(values, t);
        const stepErrors: FormErrors = {};
        for (const key of STEP_FIELDS[index]) if (found[key]) stepErrors[key] = found[key];
        setErrors(stepErrors);
        setHoursErrorDay(index === LAST_STEP ? hoursDay : undefined);
        const firstInvalid = STEP_FIELDS[index].find((key) => stepErrors[key]);
        if (firstInvalid) {
            document.getElementById(fieldIds[firstInvalid])?.focus();
            return false;
        }
        return true;
    }

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFieldError(null);
        if (!checkStep(step)) return;
        if (step < LAST_STEP) {
            goTo(step + 1);
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: values.name.trim(),
                businessType: values.businessType,
                address: values.address.trim(),
                city: values.city.trim(),
                phone: values.phone.trim(),
                openingHours: serializeWeek(values.hours),
            };
            const saved = merchant
                ? await api.put<MerchantRecord>("/merchants/me", payload)
                : await api.post<MerchantRecord>("/merchants/apply", payload);
            setMerchant(saved);
            setFieldError(null);
            toast.success({ title: t.sentTitle, description: t.sentBody });
        } catch (error) {
            const detail = describeError(error, { 403: t.verifyBody, 409: t.loadError });
            setFieldError(detail);
            toast.error({ title: t.formTitle, description: detail });
        } finally {
            setSubmitting(false);
        }
    }

    if (state.status === "loading" || (user?.emailVerified && loading)) {
        return <Shell key="loading" locale={locale}><div className={`mw-card mw-card-centered`} aria-busy="true"><div className="mw-skeleton"><span /><span /><span /></div></div></Shell>;
    }

    if (!user) {
        const next = encodeURIComponent(localePath(locale, "/merchant/dashboard"));
        return (
            <Shell key="signed-out" locale={locale}>
                <div className={`mw-card mw-card-centered mw-stack`}>
                    <h1 className="mw-card-title">{t.title}</h1>
                    <p className="mw-card-lead">{t.signInRequired}</p>
                    <div className="mw-actions-row">
                        <LinkButton href={`${localePath(locale, "/login")}?next=${next}`}>{t.signIn}</LinkButton>
                        <LinkButton href={localePath(locale, "/register/merchant")} variant="accent">{t.createAccount}</LinkButton>
                    </div>
                </div>
            </Shell>
        );
    }

    if (!user.emailVerified) {
        return (
            <Shell key="verify" locale={locale}>
                <div className={`mw-card mw-card-centered mw-stack`}>
                    <h1 className="mw-card-title">{t.verifyTitle}</h1>
                    <p className="mw-card-lead">{t.verifyBody}</p>
                    <Alert tone="info">{user.email}</Alert>
                    <div className="mw-actions-row">
                        <Button variant="accent" loading={resending} onClick={() => void resendVerification()}>{resending ? t.resending : t.resend}</Button>
                    </div>
                </div>
            </Shell>
        );
    }

    if (loadError) {
        return (
            <Shell key="error" locale={locale}>
                <div className={`mw-card mw-card-centered mw-stack`}>
                    <Alert tone="error">{loadError || t.loadError}</Alert>
                    <div className="mw-actions-row">
                        <Button variant="ghost" onClick={() => setReloadKey((value) => value + 1)}>{pick(locale, "Try again", "Réessayer", "إعادة المحاولة")}</Button>
                    </div>
                </div>
            </Shell>
        );
    }

    if (merchant && merchant.status === "APPROVED") {
        return (
            <Shell key="approved" locale={locale}>
                <section className={`mw-hero mw-rise`}>
                    <div className="mw-hero-text">
                        <span className="mw-pill">{t.statuses.APPROVED}</span>
                        <h1 className="mw-hero-title">{t.welcomeShop.replace("{name}", merchant.name)}</h1>
                        <p className="mw-hero-lead">{t.workspaceLead}</p>
                    </div>
                    <Image src="/brand/kulha-bag.png" alt="" width={300} height={275} priority className="mw-hero-bag" />
                </section>

                <Link href={`/${locale}/merchant/offers/new`} className={`mw-primary-action mw-rise`} style={{ animationDelay: "90ms" }}>
          <span className="mw-primary-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          </span>
                    <span className="mw-primary-text">
            <h2 className="mw-primary-title">{t.newOfferTitle}</h2>
            <p className="mw-primary-body">{t.newOfferBody}</p>
          </span>
                    <span className="mw-primary-cta">{t.newOfferCta}</span>
                </Link>

                <div className={`mw-secondary mw-rise`} style={{ animationDelay: "180ms" }}>
                    <Link href={`/${locale}/merchant/offers`} className="mw-action">
            <span className="mw-action-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8.5h16l-1.4 11H5.4L4 8.5Z" /><path d="M8 9V6.8a4 4 0 0 1 8 0V9" /></svg>
            </span>
                        <div>
                            <h2 className="mw-action-title">{t.offersTitle}</h2>
                            <p className="mw-action-body">{t.offersBody}</p>
                            <span className="mw-action-cta">{t.offersCta}</span>
                        </div>
                    </Link>
                    <div className={`mw-action mw-action-soon`}>
            <span className="mw-action-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
            </span>
                        <div>
                            <h2 className="mw-action-title">{t.workspaceReservations}</h2>
                            <p className="mw-action-body">{t.workspaceReservationsBody}</p>
                            <span className="mw-soon-badge">{t.workspaceComingSoon}</span>
                        </div>
                    </div>
                </div>

                <section className={`mw-card mw-profile mw-rise`} style={{ animationDelay: "270ms" }} aria-labelledby="merchant-profile-title">
                    <div className="mw-card-head-row">
                        <h2 id="merchant-profile-title" className="mw-card-title">{t.workspaceProfile}</h2>
                        <Link href={localePath(locale, "/account")} className="mw-back-link">{t.workspaceBack}</Link>
                    </div>
                    <Details merchant={merchant} t={t} wide />
                </section>
            </Shell>
        );
    }

    if (merchant && merchant.status !== "REJECTED") {
        const suspended = merchant.status === "SUSPENDED";
        return (
            <Shell key="pending" locale={locale}>
                <header className={`mw-head mw-rise`}>
                    <h1 className="mw-title">{suspended ? t.suspendedTitle : t.pendingTitle}</h1>
                    <p className="mw-lead">{suspended ? t.suspendedBody : t.pendingBody}</p>
                </header>
                <div className="mw-grid">
                    <div className={`mw-aside-slot mw-slide-in`}>
                        <Aside title={t.trackerLabel}>
                            <Tracker t={t} current={2} alert={suspended} />
                        </Aside>
                    </div>
                    <section className={`mw-card mw-rise`} style={{ animationDelay: "120ms" }}>
                        <div className="mw-card-head-row">
                            <h2 className="mw-card-title">{merchant.name}</h2>
                            <span className="mw-pill">{t.statuses[merchant.status]}</span>
                        </div>
                        {merchant.decisionReason && <p className="mw-reason"><strong>{t.reason}:</strong> {merchant.decisionReason}</p>}
                        <Details merchant={merchant} t={t} />
                        <Link href={localePath(locale, "/account")} className="mw-back-link">{t.workspaceBack}</Link>
                    </section>
                </div>
            </Shell>
        );
    }

    const stepTitles = [t.sectionShop, t.sectionPlace, t.sectionHours];
    const isLast = step === LAST_STEP;
    const filled = textFields.filter((key) => values[key].trim().length > 0).length + (hoursTouched ? 1 : 0);
    const total = textFields.length + 1;
    const progress = t.progressLabel.replace("{done}", String(filled)).replace("{total}", String(total));

    return (
        <Shell key="form" locale={locale}>
            <header className={`mw-head mw-rise`}>
                <h1 className="mw-title">{t.setupTitle}</h1>
                <p className="mw-lead">{t.setupLead}</p>
            </header>

            <div className="mw-grid">
                <div className={`mw-aside-slot mw-slide-in`}>
                    <Aside title={t.whyTitle} body={t.whyBody}>
                        <Tracker t={t} current={1} detail={<DossierCard t={t} values={values} showHours={hoursTouched || step === LAST_STEP} />} />
                        <div className="mw-progress">
                            <div className="mw-progress-text"><span>{progress}</span></div>
                            <div className="mw-progress-track" role="progressbar" aria-label={progress} aria-valuemin={0} aria-valuemax={total} aria-valuenow={filled}>
                                <span style={{ width: `${(filled / total) * 100}%` }} />
                            </div>
                        </div>
                    </Aside>
                </div>

                <section className={`mw-card mw-form-card mw-rise`} style={{ animationDelay: "120ms" }} aria-labelledby="merchant-form-title">
                    <ol className="mw-stepper" aria-label={t.formTitle}>
                        {stepTitles.map((title, index) => {
                            const done = index < step;
                            const active = index === step;
                            return (
                                <li key={title} className={`mw-stepper-item ${done ? "mw-stepper-done" : ""} ${active ? "mw-stepper-active" : ""}`} aria-current={active ? "step" : undefined}>
                                    <button type="button" className="mw-stepper-button" disabled={index > step} onClick={() => goTo(index)}>
                                        <span className="mw-stepper-dot" aria-hidden="true">{done ? <CheckIcon /> : index + 1}</span>
                                        <span className="mw-stepper-label">{title}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ol>

                    {merchant?.status === "REJECTED" && (
                        <Alert tone="error" title={t.rejectedTitle}>
                            {t.rejectedBody}{merchant.decisionReason ? ` ${t.reason}: ${merchant.decisionReason}` : ""}
                        </Alert>
                    )}
                    {fieldError && <Alert tone="error">{fieldError}</Alert>}

                    <form onSubmit={onSubmit} noValidate className="mw-form">
                        <div key={step} className={`mw-pane ${direction === "back" ? "mw-pane-back" : "mw-pane-forward"}`}>
                            <h2 id="merchant-form-title" className="mw-step-title">{stepTitles[step]}</h2>

                            {step === 0 && (
                                <>
                                    <Field id={fieldIds.name} label={t.name} error={errors.name}>
                                        <input id={fieldIds.name} name="name" className="mw-input" autoComplete="organization" maxLength={120} placeholder={t.namePlaceholder} value={values.name} onChange={(event) => setText("name", event.target.value)} aria-invalid={errors.name ? true : undefined} aria-describedby={describedBy(fieldIds.name, undefined, errors.name)} required />
                                    </Field>
                                    <div className="mw-field" role="radiogroup" aria-labelledby="merchant-type-label">
                                        <span id="merchant-type-label" className="mw-label">{t.type}</span>
                                        <div className="mw-chips">
                                            {businessTypes.map((type) => (
                                                <button key={type} type="button" role="radio" aria-checked={values.businessType === type} className="mw-chip" onClick={() => setValues((current) => ({ ...current, businessType: type }))}>
                                                    {t.types[type]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 1 && (
                                <>
                                    <div className="mw-locate">
                                        <button type="button" className="mw-locate-button" onClick={() => void detectLocation()} disabled={locating}>
                                            {locating ? (
                                                <span className="mw-spinner" aria-hidden="true" />
                                            ) : (
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" /><circle cx="12" cy="12" r="7.5" /></svg>
                                            )}
                                            {locating ? pick(locale, "Locating you…", "Localisation en cours…", "جارٍ تحديد موقعك…") : pick(locale, "Use my current location", "Utiliser ma position actuelle", "استخدم موقعي الحالي")}
                                        </button>
                                        {locateStatus && <p role="status" className={locateStatus.kind === "ok" ? "mw-locate-ok" : "mw-locate-error"}>{locateStatus.text}</p>}
                                    </div>
                                    <Field id={fieldIds.address} label={t.address} hint={t.addressHint} error={errors.address}>
                                        <input id={fieldIds.address} name="address" className="mw-input" autoComplete="street-address" maxLength={255} value={values.address} onChange={(event) => setText("address", event.target.value)} aria-invalid={errors.address ? true : undefined} aria-describedby={describedBy(fieldIds.address, t.addressHint, errors.address)} required />
                                    </Field>
                                    <div className="mw-row">
                                        <Field id={fieldIds.city} label={t.city} error={errors.city}>
                                            <input id={fieldIds.city} name="city" className="mw-input" autoComplete="address-level2" maxLength={80} placeholder={t.cityPlaceholder} value={values.city} onChange={(event) => setText("city", event.target.value)} aria-invalid={errors.city ? true : undefined} aria-describedby={describedBy(fieldIds.city, undefined, errors.city)} required />
                                        </Field>
                                        <Field id={fieldIds.phone} label={t.phone} hint={t.phoneHint} error={errors.phone}>
                                            <input id={fieldIds.phone} name="phone" type="tel" className="mw-input" autoComplete="tel" inputMode="tel" maxLength={30} placeholder="+212 6 12 34 56 78" value={values.phone} onChange={(event) => setText("phone", event.target.value)} aria-invalid={errors.phone ? true : undefined} aria-describedby={describedBy(fieldIds.phone, t.phoneHint, errors.phone)} required />
                                        </Field>
                                    </div>
                                </>
                            )}

                            {step === 2 && (
                                <div className="mw-field">
                                    <span id="merchant-hours-label" className="mw-label">{t.openingHours}</span>
                                    <OpeningHoursPicker
                                        id={fieldIds.openingHours}
                                        labelId="merchant-hours-label"
                                        value={values.hours}
                                        onChange={setHours}
                                        copy={t}
                                        errorDay={hoursErrorDay}
                                        describedBy={errors.openingHours ? `${fieldIds.openingHours}-error` : undefined}
                                    />
                                    {errors.openingHours && <p id={`${fieldIds.openingHours}-error`} role="alert" className="mw-error">{errors.openingHours}</p>}
                                    {!errors.openingHours && previousHours && <p className="mw-hint">{t.hoursPrevious.replace("{text}", previousHours)}</p>}
                                </div>
                            )}
                        </div>

                        <div className="mw-nav">
                            {step > 0 && (
                                <button type="button" className="mw-back" onClick={() => goTo(step - 1)}>
                                    <svg className="mw-back-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
                                    {pick(locale, "Back", "Retour", "رجوع")}
                                </button>
                            )}
                            <Button type="submit" variant="accent" loading={isLast && submitting} className="mw-submit">
                                {isLast ? (submitting ? t.submitting : merchant ? t.update : t.submit) : pick(locale, "Continue", "Continuer", "متابعة")}
                            </Button>
                        </div>
                    </form>
                </section>
            </div>
        </Shell>
    );
}