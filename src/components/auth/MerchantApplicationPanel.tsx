"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useSession } from "@/components/session/SessionProvider";
import { useToast } from "@/components/feedback/ToastProvider";
import { Alert } from "@/components/ui/Alert";
import { Button, LinkButton } from "@/components/ui/Button";
import { ApiError, api } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { CustomerPreview, formatPreviewHours } from "@/components/merchant/shop-setup/CustomerPreview";
import { MerchantConsole } from "@/components/merchant/MerchantConsole";
import { SetupStepper } from "@/components/merchant/shop-setup/SetupStepper";
import { WeekHoursEditor } from "@/components/merchant/shop-setup/WeekHoursEditor";
import styles from "@/components/merchant/shop-setup/ShopSetup.module.css";
import { merchantCopy } from "@/lib/i18n/merchant-copy";
import { shopSetupCopy } from "@/lib/i18n/shop-setup-copy";
import { defaultWeek, describeStoredHours, parseWeek, serializeWeek, validateWeek, type DayKey, type WeekSchedule } from "@/lib/merchant/opening-hours";
import { localeFromPath, localePath } from "@/lib/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";

type BusinessType = "BAKERY" | "CAFE" | "RESTAURANT" | "SUPERMARKET" | "OTHER";
type MerchantStatus = "PENDING" | "APPROVED" | "REJECTED" | "INFO_REQUIRED" | "SUSPENDED";
type MerchantRecord = {
    id: string;
    name: string;
    businessType: BusinessType;
    address: string;
    city: string;
    district: string | null;
    latitude: number | null;
    longitude: number | null;
    phone: string;
    openingHours: string;
    pickupInstructions: string | null;
    status: MerchantStatus;
    decisionReason: string | null;
    createdAt: string;
};
type MerchantFormValues = Omit<MerchantRecord, "id" | "status" | "decisionReason" | "createdAt" | "openingHours" | "district" | "pickupInstructions"> & { district: string; hours: WeekSchedule };
type TextFieldKey = "name" | "address" | "city" | "district" | "phone";
type FieldKey = TextFieldKey | "openingHours";
type FormErrors = Partial<Record<FieldKey, string>>;
type Copy = (typeof merchantCopy)[SiteLocale];

const emptyValues = (): MerchantFormValues => ({ name: "", businessType: "BAKERY", address: "", city: "", district: "", latitude: null, longitude: null, phone: "", hours: defaultWeek() });
const businessTypes: BusinessType[] = ["BAKERY", "CAFE", "RESTAURANT", "SUPERMARKET", "OTHER"];
const fieldIds: Record<FieldKey, string> = {
    name: "merchant-name", address: "merchant-address", city: "merchant-city", district: "merchant-district", phone: "merchant-phone", openingHours: "merchant-hours",
};
const STEP_FIELDS: FieldKey[][] = [["name"], ["address", "city", "phone"], ["openingHours"]];
const LAST_STEP = STEP_FIELDS.length - 1;

function validate(values: MerchantFormValues, t: Copy): { errors: FormErrors; hoursDay?: DayKey } {
    const errors: FormErrors = {};
    let hoursDay: DayKey | undefined;
    if (!values.name.trim() || values.name.length > 120) errors.name = t.required;
    if (!values.address.trim() || values.address.length > 255) errors.address = t.required;
    if (!values.city.trim() || values.city.length > 80) errors.city = t.required;
    if (values.district.length > 80) errors.district = t.required;
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
    return { address, city, district: (area ?? "").slice(0, 80) };
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

function describedBy(id: string, hint?: string, error?: string) {
    return [error ? `${id}-error` : hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
}

function Details({ merchant, t, wide = false }: { merchant: MerchantRecord; t: Copy; wide?: boolean }) {
    return (
        <dl className={`mw-details${wide ? " mw-details-row" : ""}`}>
            <div><dt>{t.type}</dt><dd>{t.types[merchant.businessType]}</dd></div>
            <div><dt>{t.city}</dt><dd>{merchant.city}</dd></div>
            {merchant.district && <div><dt>{t.district}</dt><dd>{merchant.district}</dd></div>}
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
    const { state, reload } = useSession();
    const toast = useToast();
    const user = state.status === "authenticated" ? state.user : null;
    const [merchant, setMerchant] = useState<MerchantRecord | null>(null);
    const [values, setValues] = useState<MerchantFormValues>(emptyValues);
    const [step, setStep] = useState(0);
    const stepHeadingRef = useRef<HTMLHeadingElement>(null);
    const previousStepRef = useRef(step);
    const approvalRefreshRef = useRef<string | null>(null);
    const [direction, setDirection] = useState<"forward" | "back">("forward");
    const [hoursTouched, setHoursTouched] = useState(false);
    const [hoursErrorDay, setHoursErrorDay] = useState<DayKey | undefined>(undefined);
    const [previousHours, setPreviousHours] = useState<string | null>(null);
    const [settledKey, setSettledKey] = useState<string | null>(null);
    const [loadFailure, setLoadFailure] = useState<{ key: string; message: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const [fieldError, setFieldError] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});
    const [reloadKey, setReloadKey] = useState(0);
    const [locating, setLocating] = useState(false);
    const [locateStatus, setLocateStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

    // Loading state is derived from "which request has settled" instead of being toggled inside the
    // effect, so a retry (reloadKey) or a different user automatically counts as loading again.
    const userId = user?.id ?? null;
    const emailVerified = Boolean(user?.emailVerified);
    const canLoad = state.status !== "loading" && userId !== null && emailVerified;
    const requestKey = canLoad ? `${userId}:${reloadKey}` : null;
    const loading = requestKey !== null && settledKey !== requestKey;
    const loadError = requestKey !== null && loadFailure?.key === requestKey ? loadFailure.message : null;

    useEffect(() => {
        if (previousStepRef.current === step) return;
        previousStepRef.current = step;
        stepHeadingRef.current?.focus();
    }, [step]);

    useEffect(() => {
        if (!merchant || merchant.status !== "APPROVED" || !user) return;
        if (user.roles.some(role => ["MERCHANT", "MERCHANT_OWNER"].includes(role))) return;
        if (approvalRefreshRef.current === merchant.id) return;
        approvalRefreshRef.current = merchant.id;
        void reload();
    }, [merchant?.id, merchant?.status, user?.id, user?.roles, reload]);

    useEffect(() => {
        if (requestKey === null) return;
        let active = true;
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
                    district: record.district ?? "",
                    latitude: record.latitude ?? null,
                    longitude: record.longitude ?? null,
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
                    setLoadFailure({ key: requestKey, message: describeError(error) });
                }
            })
            .finally(() => { if (active) setSettledKey(requestKey); });
        return () => { active = false; };
    }, [requestKey]);

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
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            setValues((current) => ({ ...current, latitude, longitude }));
            const controller = new AbortController();
            const timer = window.setTimeout(() => controller.abort(), 8000);
            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=${locale}`;
            const response = await fetch(url, { signal: controller.signal }).finally(() => window.clearTimeout(timer));
            if (!response.ok) throw new Error("reverse-geocoding-failed");
            const data = (await response.json()) as { address?: GeoAddress };
            const found = data.address ? addressFromGeo(data.address) : { address: "", city: "", district: "" };
            if (!found.address && !found.city) throw new Error("no-address");
            setValues((current) => ({
                ...current,
                address: found.address || current.address,
                city: found.city || current.city,
                district: found.district || current.district,
                latitude,
                longitude,
            }));
            setErrors((current) => ({ ...current, address: undefined, city: undefined, district: undefined }));
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
                district: values.district.trim() || null,
                phone: values.phone.trim(),
                openingHours: serializeWeek(values.hours),
                pickupInstructions: merchant?.pickupInstructions ?? null,
                latitude: values.latitude,
                longitude: values.longitude,
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
        return <MerchantConsole locale={locale} page="dashboard" shop={{ name: merchant.name, city: merchant.city }} />;
    }

    if (merchant && merchant.status !== "REJECTED" && merchant.status !== "INFO_REQUIRED") {
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
                        <div className="mw-actions-row">
                            <Button variant="ghost" onClick={() => setReloadKey(value => value + 1)}>{t.refreshStatus}</Button>
                            <Link href={localePath(locale, "/account")} className="mw-back-link">{t.workspaceBack}</Link>
                        </div>
                    </section>
                </div>
            </Shell>
        );
    }

    const copy = shopSetupCopy[locale];
    const isLast = step === LAST_STEP;
    const stepHeadings = [
        [copy.shopTitle, copy.shopLead],
        [copy.locationTitle, copy.locationLead],
        [copy.hoursTitle, copy.hoursLead],
    ] as const;
    const previewMeta = [copy.types[values.businessType], values.city.trim()].filter(Boolean).join(" · ");
    const previewHours = hoursTouched || isLast ? formatPreviewHours(values.hours, t.daysShort, t.hoursClosed) : null;

    return (
        <div key="form" className={styles.page} dir={locale === "ar" ? "rtl" : "ltr"} data-testid="merchant-application">
            <header className={styles.head}>
                <h1>{copy.title}</h1>
                <p>{copy.lead}</p>
            </header>

            <SetupStepper label={copy.stepperLabel} steps={copy.steps} current={step} onGoTo={goTo} />

            <div className={styles.layout}>
                <section className={styles.card} aria-labelledby="merchant-form-title">
                    {(merchant?.status === "REJECTED" || merchant?.status === "INFO_REQUIRED") && (
                        <Alert tone="error" title={merchant.status === "INFO_REQUIRED" ? t.infoRequiredTitle : t.rejectedTitle}>
                            {merchant.status === "INFO_REQUIRED" ? t.infoRequiredBody : t.rejectedBody}{merchant.decisionReason ? ` ${t.reason}: ${merchant.decisionReason}` : ""}
                        </Alert>
                    )}
                    {fieldError && <Alert tone="error">{fieldError}</Alert>}

                    <form onSubmit={onSubmit} noValidate className={styles.form} data-testid="merchant-application-form">
                        <div key={step} className={`${styles.pane}${direction === "back" ? ` ${styles.paneBack}` : ""}`}>
                            <div className={styles.cardHead}>
                                <h2 id="merchant-form-title" ref={stepHeadingRef} tabIndex={-1}>{stepHeadings[step][0]}</h2>
                                <p>{stepHeadings[step][1]}</p>
                            </div>

                            {step === 0 && (
                                <>
                                    <div className={styles.field}>
                                        <label htmlFor={fieldIds.name} className={styles.label}>{copy.shopName}</label>
                                        <input id={fieldIds.name} name="name" className={styles.input} autoComplete="organization" maxLength={120} placeholder={t.namePlaceholder} value={values.name} onChange={(event) => setText("name", event.target.value)} aria-invalid={errors.name ? true : undefined} aria-describedby={describedBy(fieldIds.name, undefined, errors.name)} required />
                                        {errors.name && <p id={`${fieldIds.name}-error`} role="alert" className={styles.error}>{errors.name}</p>}
                                    </div>
                                    <div className={styles.field} role="radiogroup" aria-labelledby="merchant-type-label">
                                        <span id="merchant-type-label" className={styles.label}>{copy.businessType}</span>
                                        <div className={styles.chips}>
                                            {businessTypes.map((type) => (
                                                <button
                                                    key={type}
                                                    id={`merchant-type-${type}`}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={values.businessType === type}
                                                    tabIndex={values.businessType === type ? 0 : -1}
                                                    className={styles.chip}
                                                    onClick={() => setValues((current) => ({ ...current, businessType: type }))}
                                                    onKeyDown={(event) => {
                                                        const currentIndex = businessTypes.indexOf(type);
                                                        let nextIndex: number | null = null;
                                                        if (event.key === "Home") nextIndex = 0;
                                                        else if (event.key === "End") nextIndex = businessTypes.length - 1;
                                                        else if (event.key === "ArrowRight") nextIndex = (currentIndex + (locale === "ar" ? -1 : 1) + businessTypes.length) % businessTypes.length;
                                                        else if (event.key === "ArrowLeft") nextIndex = (currentIndex + (locale === "ar" ? 1 : -1) + businessTypes.length) % businessTypes.length;
                                                        if (nextIndex !== null) {
                                                            event.preventDefault();
                                                            const nextType = businessTypes[nextIndex];
                                                            setValues((current) => ({ ...current, businessType: nextType }));
                                                            document.getElementById(`merchant-type-${nextType}`)?.focus();
                                                        }
                                                    }}
                                                >
                                                    {copy.types[type]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 1 && (
                                <>
                                    <div>
                                        <button type="button" className={styles.locate} onClick={() => void detectLocation()} disabled={locating}>
                                            {locating ? (
                                                <span className={styles.spinner} aria-hidden="true" />
                                            ) : (
                                                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" /><circle cx="12" cy="12" r="7.5" /></svg>
                                            )}
                                            {locating ? pick(locale, "Locating you…", "Localisation en cours…", "جارٍ تحديد موقعك…") : pick(locale, "Use my current location", "Utiliser ma position actuelle", "استخدم موقعي الحالي")}
                                        </button>
                                        {locateStatus && <p role="status" className={`${styles.locateStatus} ${locateStatus.kind === "ok" ? styles.locateOk : styles.locateError}`}>{locateStatus.text}</p>}
                                    </div>
                                    <div className={styles.field}>
                                        <label htmlFor={fieldIds.address} className={styles.label}>{copy.street}</label>
                                        <input id={fieldIds.address} name="address" className={styles.input} autoComplete="street-address" maxLength={255} value={values.address} onChange={(event) => setText("address", event.target.value)} aria-invalid={errors.address ? true : undefined} aria-describedby={describedBy(fieldIds.address, copy.streetHint, errors.address)} required />
                                        {errors.address ? <p id={`${fieldIds.address}-error`} role="alert" className={styles.error}>{errors.address}</p> : <p id={`${fieldIds.address}-hint`} className={styles.hint}>{copy.streetHint}</p>}
                                    </div>
                                    <div className={styles.twoCol}>
                                        <div className={styles.field}>
                                            <label htmlFor={fieldIds.city} className={styles.label}>{copy.city}</label>
                                            <input id={fieldIds.city} name="city" className={styles.input} autoComplete="address-level2" maxLength={80} placeholder={t.cityPlaceholder} value={values.city} onChange={(event) => setText("city", event.target.value)} aria-invalid={errors.city ? true : undefined} aria-describedby={describedBy(fieldIds.city, undefined, errors.city)} required />
                                            {errors.city && <p id={`${fieldIds.city}-error`} role="alert" className={styles.error}>{errors.city}</p>}
                                        </div>
                                        <div className={styles.field}>
                                            <label htmlFor={fieldIds.phone} className={styles.label}>{copy.phone}</label>
                                            <input id={fieldIds.phone} name="phone" type="tel" className={styles.input} autoComplete="tel" inputMode="tel" maxLength={30} placeholder="+212 6 12 34 56 78" value={values.phone} onChange={(event) => setText("phone", event.target.value)} aria-invalid={errors.phone ? true : undefined} aria-describedby={describedBy(fieldIds.phone, copy.phoneHint, errors.phone)} required />
                                            {errors.phone ? <p id={`${fieldIds.phone}-error`} role="alert" className={styles.error}>{errors.phone}</p> : <p id={`${fieldIds.phone}-hint`} className={styles.hint}>{copy.phoneHint}</p>}
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 2 && (
                                <div className={styles.field}>
                                    <WeekHoursEditor
                                        id={fieldIds.openingHours}
                                        labelId="merchant-form-title"
                                        locale={locale}
                                        value={values.hours}
                                        onChange={setHours}
                                        copy={copy}
                                        daysShort={t.daysShort}
                                        daysLong={t.days}
                                        closedLabel={t.hoursClosed}
                                        errorDay={hoursErrorDay}
                                        describedBy={errors.openingHours ? `${fieldIds.openingHours}-error` : undefined}
                                    />
                                    {errors.openingHours && <p id={`${fieldIds.openingHours}-error`} role="alert" className={styles.error}>{errors.openingHours}</p>}
                                    {!errors.openingHours && previousHours && <p className={styles.hint}>{t.hoursPrevious.replace("{text}", previousHours)}</p>}
                                </div>
                            )}
                        </div>

                        <div className={styles.actions}>
                            {step > 0 && (
                                <button type="button" className={styles.back} onClick={() => goTo(step - 1)}>
                                    <svg className={styles.backIcon} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
                                    {copy.back}
                                </button>
                            )}
                            <button type="submit" className={styles.primary} disabled={isLast && submitting} aria-busy={isLast && submitting ? true : undefined}>
                                {isLast ? (submitting ? t.submitting : merchant ? t.update : t.submit) : copy.next}
                            </button>
                        </div>
                    </form>
                </section>

                <CustomerPreview copy={copy} name={values.name} namePlaceholder={t.namePlaceholder} meta={previewMeta} hours={previewHours} />
            </div>
        </div>
    );
}
