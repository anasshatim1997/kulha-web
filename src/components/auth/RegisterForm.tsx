"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { SubmitProgress } from "@/components/auth/SubmitProgress";
import { Button, LinkButton } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/TextField";
import { api } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { authCopy } from "@/lib/i18n/auth-copy";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { localePath } from "@/lib/navigation";
import { fieldErrors, registerSchema } from "@/lib/validation/schemas";

export function RegisterForm({ locale = "fr" }: { locale?: SiteLocale }) {
  const t = authCopy[locale];
  const [accountType, setAccountType] = useState<"CUSTOMER" | "MERCHANT" | null>(null);
  const [values, setValues] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submittingRef = useRef(false);
  const [done, setDone] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || pending) return;
    setFormError(null);

    if (step === 1) {
      if (accountType !== "CUSTOMER") return;
      const details = registerSchema.pick({ fullName: true, email: true, phone: true }).safeParse(values);
      if (!details.success) {
        setErrors(fieldErrors(details.error));
        return;
      }
      setErrors({});
      setStep(2);
      return;
    }

    if (accountType !== "CUSTOMER") return;
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    if (confirmPassword !== values.password) {
      setErrors((current) => ({ ...current, confirmPassword: t.passwordMismatch }));
      return;
    }
    if (!acceptedTerms) {
      setFormError(t.termsError);
      return;
    }

    setErrors({});
    submittingRef.current = true;
    setPending(true);
    try {
      const { fullName, email, phone, password } = parsed.data;
      await api.post("/auth/register", { fullName, email, password, ...(phone ? { phone } : {}) }, { timeoutMs: 30000 });
      setDone(true);
    } catch (error) {
      setFormError(describeError(error));
    } finally {
      submittingRef.current = false;
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-5">
        <Alert tone="success" title={t.doneTitle}>{t.done}</Alert>
        <LinkButton href={localePath(locale, "/login")} variant="ghost" className="w-full">{t.loginSubmit}</LinkButton>
      </div>
    );
  }

  return (
    <>
      {pending && <SubmitProgress title={t.registerPending} detail={t.submitProgressDetail} />}
      <div className="auth-stepper" aria-label={t.stepOfTwo.replace("{step}", String(step))}>
        <div className="auth-stepper-top">
          <span>{step === 1 ? t.registerStepOne : t.registerStepTwo}</span>
          <strong>{t.stepOfTwo.replace("{step}", String(step))}</strong>
        </div>
        <div className="auth-stepper-track" aria-hidden="true"><span style={{ width: step === 1 ? "50%" : "100%" }} /></div>
        <div className="auth-stepper-labels"><span className={step === 1 ? "is-current" : "is-done"}>{t.stepDetails}</span><span className={step === 2 ? "is-current" : ""}>{t.stepSecurity}</span></div>
      </div>
      <form onSubmit={onSubmit} noValidate aria-busy={pending} className="auth-form-fields auth-register-fields auth-register-step-form">
        {formError && <Alert tone="error">{formError}</Alert>}
        {step === 1 ? (
          <>
            <fieldset className="auth-account-type-choice" aria-describedby="auth-account-type-help">
              <legend>{t.accountTypeQuestion}</legend>
              <div className="auth-account-type-options">
                <button type="button" className={`auth-account-type-option${accountType === "CUSTOMER" ? " is-selected" : ""}`} aria-pressed={accountType === "CUSTOMER"} onClick={() => { setAccountType("CUSTOMER"); setFormError(null); }}>
                  <span className="auth-account-type-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 8.5h16l-1.4 11H5.4L4 8.5Z" />
                      <path d="M8 9V6.8a4 4 0 0 1 8 0V9" />
                      <path d="M9 13.2h6" />
                    </svg>
                  </span>
                  <span className="auth-account-type-copy"><strong>{t.customerRoleTitle}</strong><small>{t.customerRoleDescription}</small></span>
                  <span className="auth-account-type-check" aria-hidden="true">{accountType === "CUSTOMER" ? "✓" : ""}</span>
                </button>
                <button type="button" className={`auth-account-type-option${accountType === "MERCHANT" ? " is-selected" : ""}`} aria-pressed={accountType === "MERCHANT"} onClick={() => { setAccountType("MERCHANT"); setFormError(null); }}>
                  <span className="auth-account-type-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3.5 10.5 5 4.8h14l1.5 5.7" />
                      <path d="M4.5 10.5v9h15v-9" />
                      <path d="M9 19.5v-5.8h6v5.8M3.5 10.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 2.5 0" />
                    </svg>
                  </span>
                  <span className="auth-account-type-copy"><strong>{t.merchantRoleTitle}</strong><small>{t.merchantRoleDescription}</small></span>
                  <span className="auth-account-type-check" aria-hidden="true">{accountType === "MERCHANT" ? "✓" : ""}</span>
                </button>
              </div>
              <p id="auth-account-type-help" className="auth-account-type-help">{t.accountTypeHelp}</p>
            </fieldset>
            {accountType === "CUSTOMER" && (
              <>
                <GoogleOAuthButton locale={locale} disabled={pending} />
                <TextField id="fullName" name="fullName" label={t.fullName} autoComplete="name" autoCapitalize="words" placeholder={locale === "ar" ? "الاسم الكامل" : locale === "en" ? "Your full name" : "Votre nom complet"} value={values.fullName} onChange={(e) => setValues({ ...values, fullName: e.target.value })} error={errors.fullName} required />
                <TextField id="email" name="email" label={t.email} type="email" autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="nom@exemple.com" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} error={errors.email} required />
                <TextField id="phone" name="phone" label={t.phone} type="tel" autoComplete="tel" inputMode="tel" placeholder="+212 6 12 34 56 78" value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} error={errors.phone} />
                <Button type="submit" variant="accent" className="w-full">{t.continueToPassword}<span aria-hidden="true"> →</span></Button>
                <p className="auth-step-footnote">{t.stepOneHint}</p>
              </>
            )}
            {accountType === "MERCHANT" && (
              <div className="auth-merchant-route" role="status">
                <div className="auth-merchant-route-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 10.5 5 4.8h14l1.5 5.7" />
                    <path d="M4.5 10.5v9h15v-9" />
                    <path d="M9 19.5v-5.8h6v5.8M3.5 10.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 2.5 0" />
                  </svg>
                </div>
                <div className="auth-merchant-route-copy"><strong>{t.merchantNextTitle}</strong><p>{t.merchantNextBody}</p></div>
                <Link href={localePath(locale, "/for-shops")} className="auth-merchant-route-cta">{t.merchantNextCta}<span aria-hidden="true"> ↗</span></Link>
              </div>
            )}
            {!accountType && <p className="auth-step-footnote">{t.accountTypeChooseHint}</p>}
          </>
        ) : (
          <>
            <PasswordField id="password" name="password" label={t.password} strengthCopy={t.passwordStrength} showLabel={t.show} hideLabel={t.hide} autoComplete="new-password" autoFocus value={values.password} onChange={(e) => { setValues({ ...values, password: e.target.value }); setErrors((current) => ({ ...current, password: "", confirmPassword: confirmPassword && confirmPassword !== e.target.value ? t.passwordMismatch : "" })); }} error={errors.password} required />
            <PasswordField id="confirmPassword" name="confirmPassword" label={t.confirmPassword} showLabel={t.show} hideLabel={t.hide} autoComplete="new-password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setErrors((current) => ({ ...current, confirmPassword: e.target.value && e.target.value !== values.password ? t.passwordMismatch : "" })); }} error={errors.confirmPassword} required />
            {confirmPassword && confirmPassword === values.password && <p className="auth-password-match" role="status">✓ {t.passwordMatch}</p>}
            <div className="auth-consent">
              <input id="accept-terms" type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} required />
              <label htmlFor="accept-terms">{t.consentBefore} <Link href="/terms">{t.terms}</Link> {t.consentAnd} <Link href="/privacy">{t.privacy}</Link>{t.consentAfter}</label>
            </div>
            <div className="auth-step-actions">
              <Button type="button" variant="ghost" className="auth-step-back" onClick={() => { setFormError(null); setErrors((current) => { const next = { ...current }; delete next.confirmPassword; return next; }); setStep(1); }}>{t.back}</Button>
              <Button type="submit" variant="accent" loading={pending} className="auth-step-create">{pending ? t.registerPending : t.registerSubmit}</Button>
            </div>
            <p className="auth-step-footnote">{t.stepTwoHint}</p>
          </>
        )}
      </form>
    </>
  );
}
