"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { useToast } from "@/components/feedback/ToastProvider";
import { api } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { authCopy } from "@/lib/i18n/auth-copy";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { localePath } from "@/lib/navigation";
import { fieldErrors, registerSchema } from "@/lib/validation/schemas";

export type Audience = "CUSTOMER" | "MERCHANT";
export type EmailStatus = "idle" | "checking" | "available" | "registered-unverified" | "registered-verified" | "error";

/**
 * Everything the two sign-up forms share: the two steps, e-mail availability check, policy acknowledgement,
 * the Google shortcut and the account request. Customers and shop owners differ only in where they go next
 * and in the words they read, which the forms pass in.
 */
export function useRegistration({ locale, audience }: { locale: SiteLocale; audience: Audience }) {
  const t = authCopy[locale];
  const toast = useToast();
  const merchant = audience === "MERCHANT";
  const [values, setValues] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submittingRef = useRef(false);
  const [done, setDone] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [policiesAcknowledged, setPoliciesAcknowledged] = useState(false);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");

  const normalizedEmail = values.email.trim().toLowerCase();
  const validEmail = registerSchema.pick({ email: true }).safeParse({ email: normalizedEmail }).success;
  const destination = localePath(locale, merchant ? "/merchant/dashboard" : "/account");
  const loginAfterRegister = `${localePath(locale, "/login")}?email=${encodeURIComponent(normalizedEmail)}&next=${encodeURIComponent(destination)}`;

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
    const target = pendingGoogleHref.current;
    pendingGoogleHref.current = null;
    if (target) {
      // They asked for Google before the dialog: carry on instead of making them click the button a second time.
      window.dispatchEvent(new Event("kulha:navigation-start"));
      window.location.assign(target);
    }
  }, []);

  function requirePoliciesBeforeGoogle(event: MouseEvent<HTMLAnchorElement>) {
    if (policiesAcknowledged) return;
    event.preventDefault();
    pendingGoogleHref.current = event.currentTarget.href;
    setShowPolicyDialog(true);
  }

  function setField(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function onPasswordChange(value: string) {
    setValues((current) => ({ ...current, password: value }));
    setErrors((current) => ({ ...current, password: "", confirmPassword: confirmPassword && confirmPassword !== value ? t.passwordMismatch : "" }));
  }

  function onConfirmChange(value: string) {
    setConfirmPassword(value);
    setErrors((current) => ({ ...current, confirmPassword: value && value !== values.password ? t.passwordMismatch : "" }));
  }

  function backToDetails() {
    setFormError(null);
    setErrors((current) => {
      const next = { ...current };
      delete next.confirmPassword;
      return next;
    });
    setStep(1);
  }

  function openPolicyDialog() {
    setShowPolicyDialog(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || pending) return;
    setFormError(null);

    if (step === 1) {
      const details = registerSchema.pick({ fullName: true, email: true, phone: true }).safeParse(values);
      if (!details.success) {
        setErrors(fieldErrors(details.error));
        return;
      }
      setErrors({});
      setStep(2);
      return;
    }

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
      toast.success({ title: merchant ? t.merchantDoneTitle : t.doneTitle, description: merchant ? t.merchantDone : t.done });
    } catch (error) {
      const message = describeError(error);
      setFormError(message);
      toast.error({ title: t.registerTitle, description: message });
    } finally {
      submittingRef.current = false;
      setPending(false);
    }
  }

  return {
    locale, t, audience, merchant,
    values, setField, confirmPassword, onPasswordChange, onConfirmChange,
    errors, formError, pending, done, step, backToDetails, onSubmit,
    normalizedEmail, validEmail, emailStatus,
    policiesAcknowledged, showPolicyDialog, openPolicyDialog, closePolicyDialog, acceptPolicies, requirePoliciesBeforeGoogle,
    destination, loginAfterRegister,
  };
}

export type Registration = ReturnType<typeof useRegistration>;
