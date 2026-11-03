"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { useSession } from "@/components/session/SessionProvider";
import { Alert } from "@/components/ui/Alert";
import { SubmitProgress } from "@/components/auth/SubmitProgress";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/TextField";
import { authApi } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { authCopy } from "@/lib/i18n/auth-copy";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { localePath, safeNext } from "@/lib/navigation";
import { fieldErrors, loginSchema } from "@/lib/validation/schemas";
import { useToast } from "@/components/feedback/ToastProvider";

export function LoginForm({ locale = "fr" }: { locale?: SiteLocale }) {
  const t = authCopy[locale];
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitNext = searchParams.get("next");
  const next = safeNext(explicitNext, localePath(locale, "/account"));
  const { reload } = useSession();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const oauthReason = searchParams.get("oauth");
  const [formError, setFormError] = useState<string | null>(
    !oauthReason || oauthReason === "cancelled" // pressing "Cancel" on Google's page is not an error
      ? null
      : oauthReason === "not_configured" || oauthReason === "service_unavailable"
        ? t.googleUnavailable
        : t.googleError,
  );
  const [pending, setPending] = useState(false);
  const submittingRef = useRef(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    setFormError(null);
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    submittingRef.current = true;
    setPending(true);
    let navigationStarted = false;
    try {
      await authApi.login(parsed.data.email, parsed.data.password);
      const user = await reload();
      toast.success({ title: t.loginSubmit, description: t.loginLead });
      navigationStarted = true;
      window.dispatchEvent(new Event("kulha:navigation-start"));
      const destination = explicitNext
        ? next
        : user?.roles.includes("MERCHANT")
          ? localePath(locale, "/merchant/dashboard")
          : localePath(locale, "/account");
      router.replace(destination);
    } catch (error) {
      const message = describeError(error, { 401: t.invalidLogin });
      setFormError(message);
      toast.error({ title: t.loginTitle, description: message });
    } finally {
      submittingRef.current = false;
      // Keep the blocking progress feedback visible until Next.js leaves this page.
      // On failure, release the form immediately so the user can correct/retry.
      if (!navigationStarted) setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} noValidate aria-busy={pending} className="auth-form-fields">
        {formError && <Alert tone="error">{formError}</Alert>}
        <TextField id="email" name="email" label={t.email} type="email" autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="nom@exemple.com" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} error={errors.email} />
        <PasswordField id="password" name="password" label={t.password} showLabel={t.show} hideLabel={t.hide} autoComplete="current-password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} error={errors.password} />
        <div className="auth-forgot-row"><Link href="/forgot-password">{t.forgot}</Link></div>
        {pending && <SubmitProgress title={t.loginPending} detail={t.submitProgressDetail} />}
        <Button type="submit" loading={pending} className="w-full">{pending ? t.loginPending : t.loginSubmit}</Button>
      </form>
      <div className="mt-5">
        <GoogleOAuthButton label={t.googleContinue} next={next} />
      </div>
    </>
  );
}
