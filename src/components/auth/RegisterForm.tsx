"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { SubmitProgress } from "@/components/auth/SubmitProgress";
import { PolicyAcknowledgementModal } from "@/components/auth/PolicyAcknowledgementModal";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { Button, LinkButton } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/TextField";
import { api } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { authCopy } from "@/lib/i18n/auth-copy";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { localePath } from "@/lib/navigation";
import { fieldErrors, registerSchema } from "@/lib/validation/schemas";
import { useToast } from "@/components/feedback/ToastProvider";
import emailHintStyles from "./RegistrationEmailHint.module.css";
import policyReviewStyles from "./PolicyReviewPrompt.module.css";
import s from "./Register.module.css";

export function RegisterForm({ locale = "fr", initialAccountType = null }: { locale?: SiteLocale; initialAccountType?: "CUSTOMER" | "MERCHANT" | null }) {
  const t = authCopy[locale];
  const toast = useToast();
  const [accountType, setAccountType] = useState<"CUSTOMER" | "MERCHANT" | null>(initialAccountType);
  const [values, setValues] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submittingRef = useRef(false);
  const [done, setDone] = useState(false);
  const [policiesAcknowledged, setPoliciesAcknowledged] = useState(false);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "registered-unverified" | "registered-verified" | "error">("idle");
  const normalizedEmail = values.email.trim().toLowerCase();
  const validEmail = registerSchema.pick({ email: true }).safeParse({ email: normalizedEmail }).success;

  useEffect(() => {
    if (step !== 1 || !validEmail) {
      setEmailStatus("idle");
      return;
    }
    let active = true;
    setEmailStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const result = await api.post<{ exists: boolean; verified: boolean }>("/auth/email-status", { email: normalizedEmail }, { timeoutMs: 10000 });
        if (!active) return;
        setEmailStatus(!result.exists ? "available" : result.verified ? "registered-verified" : "registered-unverified");
      } catch {
        if (active) setEmailStatus("error");
      }
    }, 450);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [normalizedEmail, step, validEmail]);

  // Where the person was heading when the consent dialog interrupted them (the Google button), if anywhere.
  const pendingGoogleHref = useRef<string | null>(null);
  const closePolicyDialog = useCallback(() => {
    pendingGoogleHref.current = null;
    setShowPolicyDialog(false);
  }, []);
  const acceptPolicies = useCallback(() => {
    setPoliciesAcknowledged(true);
    setShowPolicyDialog(false);
    const destination = pendingGoogleHref.current;
    pendingGoogleHref.current = null;
    if (destination) {
      // They asked for Google before the dialog: carry on instead of making them click the button a second time.
      window.dispatchEvent(new Event("kulha:navigation-start"));
      window.location.assign(destination);
    }
  }, []);

  function requirePoliciesBeforeGoogle(event: MouseEvent<HTMLAnchorElement>) {
    if (!accountType) {
      event.preventDefault();
      setFormError(t.accountTypeChooseHint);
      return;
    }
    if (policiesAcknowledged) return;
    event.preventDefault();
    pendingGoogleHref.current = event.currentTarget.href;
    setShowPolicyDialog(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || pending) return;
    setFormError(null);

    if (step === 1) {
      if (!accountType) return;
      const details = registerSchema.pick({ fullName: true, email: true, phone: true }).safeParse(values);
      if (!details.success) {
        setErrors(fieldErrors(details.error));
        return;
      }
      setErrors({});
      setStep(2);
      return;
    }

    if (!accountType) return;
    if (!policiesAcknowledged) {
      setShowPolicyDialog(true);
      return;
    }
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    if (confirmPassword !== values.password) {
      setErrors((current) => ({ ...current, confirmPassword: t.passwordMismatch }));
      return;
    }

    setErrors({});
    submittingRef.current = true;
    setPending(true);
    try {
      const { fullName, email, phone, password } = parsed.data;
      await api.post("/auth/register", { fullName, email, password, ...(phone ? { phone } : {}) }, { timeoutMs: 30000 });
      setDone(true);
      toast.success({ title: accountType === "MERCHANT" ? t.merchantDoneTitle : t.doneTitle, description: accountType === "MERCHANT" ? t.merchantDone : t.done });
    } catch (error) {
      const message = describeError(error);
      setFormError(message);
      toast.error({ title: t.registerTitle, description: message });
    } finally {
      submittingRef.current = false;
      setPending(false);
    }
  }

  const check = (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
  );
  const orLabel = locale === "ar" ? "أو" : locale === "en" ? "or" : "ou";
  const loginAfterRegister = `${localePath(locale, "/login")}?email=${encodeURIComponent(values.email.trim().toLowerCase())}&next=${encodeURIComponent(accountType === "MERCHANT" ? localePath(locale, "/merchant/dashboard") : localePath(locale, "/account"))}`;

  if (done) {
    return (
      <div className={s.done}>
        <Alert tone="success" title={accountType === "MERCHANT" ? t.merchantDoneTitle : t.doneTitle}>{accountType === "MERCHANT" ? t.merchantDone : t.done}</Alert>
        <LinkButton href={loginAfterRegister} variant="accent" className={s.cta}>{accountType === "MERCHANT" ? t.merchantContinue : t.loginSubmit}</LinkButton>
        <p className={s.doneLink}>
          <Link href={`${localePath(locale, "/forgot-password")}?email=${encodeURIComponent(values.email.trim().toLowerCase())}`}>{t.forgot}</Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <SubmitProgress title={t.registerPending} detail={t.submitProgressDetail} active={pending} />
      <ol className={s.steps} aria-label={t.stepOfTwo.replace("{step}", String(step))}>
        <li className={step === 1 ? s.stepCurrent : s.stepDone} aria-current={step === 1 ? "step" : undefined}><span className={s.dot}>{step === 1 ? "1" : check}</span>{t.stepDetails}</li>
        <li className={step === 2 ? s.stepCurrent : undefined} aria-current={step === 2 ? "step" : undefined}><span className={s.dot}>2</span>{t.stepSecurity}</li>
      </ol>
      <h2 className={s.stepTitle}>{step === 1 ? t.registerStepOne : t.registerStepTwo}</h2>
      <form onSubmit={onSubmit} noValidate aria-busy={pending} className={s.form}>
        {formError && <Alert tone="error">{formError}</Alert>}
        {step === 1 ? (
          <>
            <fieldset className={s.typeGroup}>
              <legend className={s.typeLegend}>{t.accountTypeQuestion}</legend>
              <div className={s.typeOptions} role="radiogroup" aria-label={t.accountTypeQuestion}>
                <button type="button" role="radio" aria-checked={accountType === "CUSTOMER"} className={s.typeOption} onClick={() => { setAccountType("CUSTOMER"); setFormError(null); }}>
                  <span className={s.typeIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 8.5h16l-1.4 11H5.4L4 8.5Z" />
                      <path d="M8 9V6.8a4 4 0 0 1 8 0V9" />
                      <path d="M9 13.2h6" />
                    </svg>
                  </span>
                  <span className={s.typeCopy}><strong className={s.typeTitle}>{t.customerRoleTitle}</strong><span className={s.typeDesc}>{t.customerRoleDescription}</span></span>
                  <span className={s.radio} aria-hidden="true">{accountType === "CUSTOMER" ? check : null}</span>
                </button>
                <button type="button" role="radio" aria-checked={accountType === "MERCHANT"} className={s.typeOption} onClick={() => { setAccountType("MERCHANT"); setFormError(null); }}>
                  <span className={s.typeIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3.5 10.5 5 4.8h14l1.5 5.7" />
                      <path d="M4.5 10.5v9h15v-9" />
                      <path d="M9 19.5v-5.8h6v5.8M3.5 10.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 2.5 0" />
                    </svg>
                  </span>
                  <span className={s.typeCopy}><strong className={s.typeTitle}>{t.merchantRoleTitle}</strong><span className={s.typeDesc}>{t.merchantRoleDescription}</span></span>
                  <span className={s.radio} aria-hidden="true">{accountType === "MERCHANT" ? check : null}</span>
                </button>
              </div>
              {!accountType && <p className={s.typeHint}>{t.accountTypeChooseHint}</p>}
            </fieldset>
            {accountType && (
              <>
                <TextField id="fullName" name="fullName" label={t.fullName} autoComplete="name" autoCapitalize="words" placeholder={locale === "ar" ? "الاسم الكامل" : locale === "en" ? "Your full name" : "Votre nom complet"} value={values.fullName} onChange={(e) => setValues({ ...values, fullName: e.target.value })} error={errors.fullName} required />
                <TextField id="email" name="email" label={t.email} type="email" autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="nom@exemple.com" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} error={errors.email} required />
                {validEmail && emailStatus !== "idle" && (
                  <div className={emailHintStyles.panel} role="status" aria-live="polite">
                    {emailStatus === "checking" && <p className={emailHintStyles.message}>{t.emailChecking}</p>}
                    {emailStatus === "available" && <p className={emailHintStyles.message}>{t.emailAvailable}</p>}
                    {(emailStatus === "registered-verified" || emailStatus === "registered-unverified") && (
                      <>
                        <p className={emailHintStyles.message}>{emailStatus === "registered-verified" ? t.emailRegisteredVerified : t.emailRegisteredUnverified}</p>
                        <div className={emailHintStyles.actions}>
                          <Link href={`${localePath(locale, "/login")}?email=${encodeURIComponent(normalizedEmail)}`}>{t.loginSubmit}</Link>
                          <Link href={`${localePath(locale, "/forgot-password")}?email=${encodeURIComponent(normalizedEmail)}`}>{t.forgot}</Link>
                        </div>
                      </>
                    )}
                    {emailStatus === "error" && <p className={emailHintStyles.message}>{t.emailCheckError}</p>}
                  </div>
                )}
                <TextField id="phone" name="phone" label={t.phone} type="tel" autoComplete="tel" inputMode="tel" placeholder="+212 6 12 34 56 78" value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} error={errors.phone} />
                {accountType === "MERCHANT" && (
                  <div className={s.note} role="note">
                    <span className={s.noteIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.8v.1" /></svg>
                    </span>
                    <div>
                      <strong>{t.merchantNextTitle}</strong>
                      <p>{t.merchantNextBody}</p>
                    </div>
                  </div>
                )}
                <Button type="submit" variant="accent" className={s.cta}>{t.continueToPassword}</Button>
              </>
            )}
          </>
        ) : (
          <>
            <PasswordField id="password" name="password" label={t.password} strengthCopy={t.passwordStrength} showLabel={t.show} hideLabel={t.hide} autoComplete="new-password" autoFocus value={values.password} onChange={(e) => { setValues({ ...values, password: e.target.value }); setErrors((current) => ({ ...current, password: "", confirmPassword: confirmPassword && confirmPassword !== e.target.value ? t.passwordMismatch : "" })); }} error={errors.password} required />
            <PasswordField id="confirmPassword" name="confirmPassword" label={t.confirmPassword} showLabel={t.show} hideLabel={t.hide} autoComplete="new-password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setErrors((current) => ({ ...current, confirmPassword: e.target.value && e.target.value !== values.password ? t.passwordMismatch : "" })); }} error={errors.confirmPassword} required />
            {confirmPassword && confirmPassword === values.password && <p className={s.match} role="status">✓ {t.passwordMatch}</p>}
            <div className={policyReviewStyles.panel} role="group" aria-label={t.reviewPoliciesLabel}>
              <p className={policyReviewStyles.message}>{policiesAcknowledged ? t.policiesAcknowledgedLabel : t.consentDialogBody}</p>
              <button type="button" className={policyReviewStyles.action} onClick={() => setShowPolicyDialog(true)}>
                {t.reviewPoliciesLabel}
              </button>
            </div>
            <div className={s.actions}>
              <Button type="button" variant="ghost" className={s.back} onClick={() => { setFormError(null); setErrors((current) => { const next = { ...current }; delete next.confirmPassword; return next; }); setStep(1); }}>{t.back}</Button>
              <Button type="submit" variant="accent" loading={pending} className={s.cta}>{pending ? t.registerPending : t.registerSubmit}</Button>
            </div>
          </>
        )}
      </form>
      {step === 1 && accountType && (
        <div className={s.social}>
          <p className={s.divider}>{orLabel}</p>
          <GoogleOAuthButton
            label={t.googleContinue}
            next={accountType === "MERCHANT" ? localePath(locale, "/merchant/dashboard") : localePath(locale, "/account")}
            onClick={requirePoliciesBeforeGoogle}
          />
        </div>
      )}
      {showPolicyDialog && (
        <PolicyAcknowledgementModal
          locale={locale}
          title={t.consentDialogTitle}
          body={t.consentDialogBody}
          termsSummaryTitle={t.termsSummaryTitle}
          termsSummary={t.termsSummary}
          privacySummaryTitle={t.privacySummaryTitle}
          privacySummary={t.privacySummary}
          draftNotice={t.draftNotice}
          readMoreLabel={t.readMoreLabel}
          requiredNote={t.consentDialogRequiredNote}
          checkboxLabel={t.consentDialogCheckboxLabel}
          termsLabel={t.terms}
          privacyLabel={t.privacy}
          acceptLabel={t.consentDialogAcknowledge}
          cancelLabel={t.consentDialogCancel}
          closeLabel={t.consentDialogClose}
          onAccept={acceptPolicies}
          onClose={closePolicyDialog}
        />
      )}
    </>
  );
}
