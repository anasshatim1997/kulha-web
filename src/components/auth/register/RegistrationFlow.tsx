"use client";

import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Button, LinkButton } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/TextField";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { PolicyAcknowledgementModal } from "@/components/auth/PolicyAcknowledgementModal";
import { SubmitProgress } from "@/components/auth/SubmitProgress";
import { localePath } from "@/lib/navigation";
import emailHintStyles from "@/components/auth/RegistrationEmailHint.module.css";
import policyReviewStyles from "@/components/auth/PolicyReviewPrompt.module.css";
import s from "@/components/auth/Register.module.css";
import type { Registration } from "./useRegistration";

const check = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);

/** The shared two-step sign-up view. The customer and shop-owner forms each render it with their own wording. */
export function RegistrationFlow({ reg, nameLabel }: { reg: Registration; nameLabel: string }) {
  const { t, locale, merchant, values, errors, step, pending } = reg;
  const orLabel = locale === "ar" ? "أو" : locale === "en" ? "or" : "ou";

  if (reg.done) {
    return (
      <div className={s.done}>
        <Alert tone="success" title={merchant ? t.merchantDoneTitle : t.doneTitle}>{merchant ? t.merchantDone : t.done}</Alert>
        <LinkButton href={reg.loginAfterRegister} variant="accent" className={s.cta}>{merchant ? t.merchantContinue : t.loginSubmit}</LinkButton>
        <p className={s.doneLink}>
          <Link href={`${localePath(locale, "/forgot-password")}?email=${encodeURIComponent(reg.normalizedEmail)}`}>{t.forgot}</Link>
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

      <form onSubmit={reg.onSubmit} noValidate aria-busy={pending} className={s.form}>
        {reg.formError && <Alert tone="error">{reg.formError}</Alert>}
        {step === 1 ? (
          <>
            <TextField id="fullName" name="fullName" label={nameLabel} autoComplete="name" autoCapitalize="words" placeholder={t.fullNamePlaceholder} value={values.fullName} onChange={(e) => reg.setField("fullName", e.target.value)} error={errors.fullName} required />
            <TextField id="email" name="email" label={t.email} type="email" autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="nom@exemple.com" value={values.email} onChange={(e) => reg.setField("email", e.target.value)} error={errors.email} required />
            {reg.validEmail && reg.emailStatus !== "idle" && (
              <div className={emailHintStyles.panel} role="status" aria-live="polite">
                {reg.emailStatus === "checking" && <p className={emailHintStyles.message}>{t.emailChecking}</p>}
                {reg.emailStatus === "available" && <p className={emailHintStyles.message}>{t.emailAvailable}</p>}
                {(reg.emailStatus === "registered-verified" || reg.emailStatus === "registered-unverified") && (
                  <>
                    <p className={emailHintStyles.message}>{reg.emailStatus === "registered-verified" ? t.emailRegisteredVerified : t.emailRegisteredUnverified}</p>
                    <div className={emailHintStyles.actions}>
                      <Link href={`${localePath(locale, "/login")}?email=${encodeURIComponent(reg.normalizedEmail)}`}>{t.loginSubmit}</Link>
                      <Link href={`${localePath(locale, "/forgot-password")}?email=${encodeURIComponent(reg.normalizedEmail)}`}>{t.forgot}</Link>
                    </div>
                  </>
                )}
                {reg.emailStatus === "error" && <p className={emailHintStyles.message}>{t.emailCheckError}</p>}
              </div>
            )}
            <TextField id="phone" name="phone" label={t.phone} type="tel" autoComplete="tel" inputMode="tel" placeholder="+212 6 12 34 56 78" value={values.phone} onChange={(e) => reg.setField("phone", e.target.value)} error={errors.phone} />
            <Button type="submit" variant="accent" className={s.cta}>{t.continueToPassword}</Button>
          </>
        ) : (
          <>
            <PasswordField id="password" name="password" label={t.password} strengthCopy={t.passwordStrength} showLabel={t.show} hideLabel={t.hide} autoComplete="new-password" autoFocus value={values.password} onChange={(e) => reg.onPasswordChange(e.target.value)} error={errors.password} required />
            <PasswordField id="confirmPassword" name="confirmPassword" label={t.confirmPassword} showLabel={t.show} hideLabel={t.hide} autoComplete="new-password" value={reg.confirmPassword} onChange={(e) => reg.onConfirmChange(e.target.value)} error={errors.confirmPassword} required />
            {reg.confirmPassword && reg.confirmPassword === values.password && <p className={s.match} role="status">✓ {t.passwordMatch}</p>}
            <div className={policyReviewStyles.panel} role="group" aria-label={t.reviewPoliciesLabel}>
              <p className={policyReviewStyles.message}>{reg.policiesAcknowledged ? t.policiesAcknowledgedLabel : t.consentDialogBody}</p>
              <button type="button" className={policyReviewStyles.action} onClick={reg.openPolicyDialog}>{t.reviewPoliciesLabel}</button>
            </div>
            <div className={s.actions}>
              <Button type="button" variant="ghost" className={s.back} onClick={reg.backToDetails}>{t.back}</Button>
              <Button type="submit" variant="accent" loading={pending} className={s.cta}>{pending ? t.registerPending : t.registerSubmit}</Button>
            </div>
          </>
        )}
      </form>

      {step === 1 && (
        <div className={s.social}>
          <p className={s.divider}>{orLabel}</p>
          <GoogleOAuthButton label={t.googleContinue} next={reg.destination} onClick={reg.requirePoliciesBeforeGoogle} />
        </div>
      )}

      {reg.showPolicyDialog && (
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
          onAccept={reg.acceptPolicies}
          onClose={reg.closePolicyDialog}
        />
      )}
    </>
  );
}
