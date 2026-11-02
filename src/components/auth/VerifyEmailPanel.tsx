"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button, LinkButton } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { messages } from "@/lib/i18n/messages";
import { ResendVerificationForm } from "./ResendVerificationForm";
import { useEmailTokenFragment } from "@/lib/auth/use-email-token-fragment";
import { useToast } from "@/components/feedback/ToastProvider";

const t = messages.auth.verify;

/**
 * The link in the email only opens this page. The one-time token is used when the person clicks the
 * button, so mail scanners that open links, and React's double rendering in development, cannot use it up.
 */
export function VerifyEmailPanel() {
  const { token, ready } = useEmailTokenFragment();
  const toast = useToast();
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "invalid">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!ready) {
    return <p className="text-sm text-forest-600">{messages.common.loading}</p>;
  }

  if (!token) {
    return (
      <div className="space-y-5">
        <Alert tone="error">{t.missingToken}</Alert>
        <ResendVerificationForm />
      </div>
    );
  }

  async function confirm() {
    setStatus("pending");
    setError(null);
    try {
      await api.post("/auth/verify-email", { token });
      setStatus("done");
      toast.success({ title: t.done });
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        setStatus("invalid");
      } else {
        setError(describeError(e));
        toast.error({ title: messages.errors.generic, description: describeError(e) });
        setStatus("idle");
      }
    }
  }

  if (status === "done") {
    return (
      <div className="space-y-5">
        <Alert tone="success">{t.done}</Alert>
        <LinkButton href="/login" className="w-full">
          {messages.auth.login.submit}
        </LinkButton>
        <LinkButton href="/login?next=%2Fmerchant%2Fdashboard" variant="ghost" className="w-full">
          {t.merchantNext}
        </LinkButton>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="space-y-5">
        <Alert tone="error">{t.invalid}</Alert>
        <ResendVerificationForm />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="button" variant="accent" loading={status === "pending"} onClick={() => void confirm()} className="w-full">
        {status === "pending" ? t.submitting : t.submit}
      </Button>
    </div>
  );
}
