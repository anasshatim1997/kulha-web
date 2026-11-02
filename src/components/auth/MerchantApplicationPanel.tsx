"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useSession } from "@/components/session/SessionProvider";
import { useToast } from "@/components/feedback/ToastProvider";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField, inputClass } from "@/components/ui/TextField";
import { ApiError, api } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { merchantCopy } from "@/lib/i18n/merchant-copy";
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
type MerchantFormValues = Omit<MerchantRecord, "id" | "status" | "decisionReason" | "createdAt">;

const emptyValues: MerchantFormValues = {
  name: "", businessType: "BAKERY", address: "", city: "", phone: "", openingHours: "",
};
const businessTypes: BusinessType[] = ["BAKERY", "CAFE", "RESTAURANT", "SUPERMARKET", "OTHER"];

export function MerchantApplicationPanel() {
  const pathname = usePathname();
  const locale = localeFromPath(pathname) as SiteLocale;
  const t = merchantCopy[locale];
  const { state } = useSession();
  const toast = useToast();
  const user = state.status === "authenticated" ? state.user : null;
  const [merchant, setMerchant] = useState<MerchantRecord | null>(null);
  const [values, setValues] = useState<MerchantFormValues>(emptyValues);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
        setValues({
          name: record.name,
          businessType: record.businessType,
          address: record.address,
          city: record.city,
          phone: record.phone,
          openingHours: record.openingHours,
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 404) {
          setMerchant(null);
          setValues(emptyValues);
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    const errors: string[] = [];
    if (!values.name.trim() || values.name.length > 120 || !values.address.trim() || values.address.length > 255
      || !values.city.trim() || values.city.length > 80 || !values.phone.trim() || values.phone.length > 30
      || !values.openingHours.trim() || values.openingHours.length > 500) errors.push(t.required);
    if (!/^[+0-9 ()-]{6,30}$/.test(values.phone.trim())) errors.push(t.phoneError);
    if (errors.length) {
      setFieldError(errors.join(" "));
      toast.error({ title: t.formTitle, description: errors.join(" ") });
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
        openingHours: values.openingHours.trim(),
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
    return <Card className="space-y-3"><div className="h-6 w-2/3 animate-pulse rounded bg-forest-100" /><div className="h-4 w-full animate-pulse rounded bg-forest-100" /><div className="h-12 w-full animate-pulse rounded-xl bg-forest-100" /></Card>;
  }

  if (!user) {
    const merchantPath = localePath(locale, "/merchant/dashboard");
    const next = encodeURIComponent(merchantPath);
    return (
      <Card className="space-y-5">
        <p className="text-forest-700">{t.signInRequired}</p>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={`${localePath(locale, "/login")}?next=${next}`}>{t.signIn}</LinkButton>
          <LinkButton href={localePath(locale, "/register?accountType=merchant")} variant="accent">{t.createAccount}</LinkButton>
        </div>
      </Card>
    );
  }

  if (!user.emailVerified) {
    return (
      <Card className="space-y-4">
        <Alert tone="info" title={t.verifyTitle}>{t.verifyBody}</Alert>
        <p className="text-sm text-forest-700">{user.email}</p>
        <Button variant="accent" loading={resending} onClick={() => void resendVerification()}>{resending ? t.resending : t.resend}</Button>
      </Card>
    );
  }

  if (loadError) {
    return <Card className="space-y-4"><Alert tone="error">{loadError || t.loadError}</Alert><Button variant="ghost" onClick={() => setReloadKey((value) => value + 1)}>{locale === "en" ? "Try again" : locale === "ar" ? "إعادة المحاولة" : "Réessayer"}</Button></Card>;
  }

  if (merchant && merchant.status !== "REJECTED") {
    const approved = merchant.status === "APPROVED";
    const suspended = merchant.status === "SUSPENDED";
    if (approved) {
      return (
        <div className="space-y-5" dir={locale === "ar" ? "rtl" : "ltr"}>
          <Card className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-black tracking-[0.18em] text-forest-500">{t.workspaceEyebrow}</p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-forest-800">{t.workspaceTitle}</h2>
                <Badge tone="green">{t.statuses.APPROVED}</Badge>
              </div>
              <p className="text-sm leading-6 text-forest-600">{t.workspaceLead}</p>
            </div>
            <Alert tone="success" title={t.workspaceAccess}>{t.approvedBody}</Alert>
            <section className="rounded-2xl border border-forest-100 bg-forest-50 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-forest-500">{t.workspaceProfile}</p>
              <h3 className="mt-2 text-xl font-black text-forest-800">{merchant.name}</h3>
              <dl className="mt-4 grid gap-3 text-sm text-forest-700 sm:grid-cols-2">
                <div><dt className="font-extrabold">{t.type}</dt><dd>{t.types[merchant.businessType]}</dd></div>
                <div><dt className="font-extrabold">{t.city}</dt><dd>{merchant.city}</dd></div>
                <div className="sm:col-span-2"><dt className="font-extrabold">{t.address}</dt><dd>{merchant.address}</dd></div>
                <div><dt className="font-extrabold">{t.phone}</dt><dd>{merchant.phone}</dd></div>
                <div><dt className="font-extrabold">{t.openingHours}</dt><dd>{merchant.openingHours}</dd></div>
              </dl>
            </section>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black text-forest-800">{t.workspaceOffers}</h3>
                <Badge tone="yellow">{t.workspaceComingSoon}</Badge>
              </div>
              <p className="text-sm leading-6 text-forest-600">{t.workspaceOffersBody}</p>
            </Card>
            <Card className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black text-forest-800">{t.workspaceReservations}</h3>
                <Badge tone="yellow">{t.workspaceComingSoon}</Badge>
              </div>
              <p className="text-sm leading-6 text-forest-600">{t.workspaceReservationsBody}</p>
            </Card>
          </div>
          <div className="flex justify-end">
            <LinkButton href={localePath(locale, "/account")} variant="ghost">{t.workspaceBack}</LinkButton>
          </div>
        </div>
      );
    }
    return (
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-forest-800">{merchant.name}</h2>
          <Badge tone={suspended ? "red" : "yellow"}>{t.statuses[merchant.status]}</Badge>
        </div>
        <Alert tone={suspended ? "error" : "info"} title={suspended ? t.suspendedTitle : t.pendingTitle}>
          {suspended ? t.suspendedBody : t.pendingBody}
        </Alert>
        {merchant.decisionReason && <p className="text-sm text-forest-700"><strong>{t.reason}:</strong> {merchant.decisionReason}</p>}
        <dl className="grid gap-3 text-sm text-forest-700 sm:grid-cols-2">
          <div><dt className="font-extrabold">{t.type}</dt><dd>{t.types[merchant.businessType]}</dd></div>
          <div><dt className="font-extrabold">{t.city}</dt><dd>{merchant.city}</dd></div>
          <div className="sm:col-span-2"><dt className="font-extrabold">{t.address}</dt><dd>{merchant.address}</dd></div>
          <div><dt className="font-extrabold">{t.phone}</dt><dd>{merchant.phone}</dd></div>
          <div><dt className="font-extrabold">{t.openingHours}</dt><dd>{merchant.openingHours}</dd></div>
        </dl>
        <Link href={localePath(locale, "/account")} className="text-sm font-extrabold text-forest-700 underline underline-offset-4">
          {t.workspaceBack}
        </Link>
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-forest-800">{t.formTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-forest-600">{t.hint}</p>
      </div>
      {merchant?.status === "REJECTED" && (
        <Alert tone="error" title={t.rejectedTitle}>
          {t.rejectedBody}{merchant.decisionReason ? ` ${t.reason}: ${merchant.decisionReason}` : ""}
        </Alert>
      )}
      {fieldError && <Alert tone="error">{fieldError}</Alert>}
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <TextField id="merchant-name" name="name" label={t.name} autoComplete="organization" maxLength={120} value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} required />
        <div className="grid gap-1.5">
          <label htmlFor="merchant-type" className="block text-base font-bold text-forest-800">{t.type}</label>
          <select id="merchant-type" name="businessType" className={`${inputClass} border-forest-200`} value={values.businessType} onChange={(event) => setValues((current) => ({ ...current, businessType: event.target.value as BusinessType }))}>
            {businessTypes.map((type) => <option key={type} value={type}>{t.types[type]}</option>)}
          </select>
        </div>
        <TextField id="merchant-address" name="address" label={t.address} autoComplete="street-address" maxLength={255} value={values.address} onChange={(event) => setValues((current) => ({ ...current, address: event.target.value }))} required />
        <TextField id="merchant-city" name="city" label={t.city} autoComplete="address-level2" maxLength={80} value={values.city} onChange={(event) => setValues((current) => ({ ...current, city: event.target.value }))} required />
        <TextField id="merchant-phone" name="phone" label={t.phone} type="tel" autoComplete="tel" inputMode="tel" maxLength={30} placeholder="+212 6 12 34 56 78" value={values.phone} onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))} required />
        <div className="grid gap-1.5">
          <label htmlFor="merchant-hours" className="block text-base font-bold text-forest-800">{t.openingHours}</label>
          <textarea id="merchant-hours" name="openingHours" className={`${inputClass} min-h-24 border-forest-200`} maxLength={500} value={values.openingHours} onChange={(event) => setValues((current) => ({ ...current, openingHours: event.target.value }))} required />
        </div>
        <Button type="submit" variant="accent" loading={submitting} className="w-full">{submitting ? t.submitting : merchant ? t.update : t.submit}</Button>
      </form>
    </Card>
  );
}
