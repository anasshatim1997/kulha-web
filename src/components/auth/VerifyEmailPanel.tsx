"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/components/session/SessionProvider";
import { Alert } from "@/components/ui/Alert";
import { Button, LinkButton } from "@/components/ui/Button";
import { ApiError, authApi } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { messages } from "@/lib/i18n/messages";
import { ResendVerificationForm } from "./ResendVerificationForm";
import { useEmailTokenFragment } from "@/lib/auth/use-email-token-fragment";
import { useToast } from "@/components/feedback/ToastProvider";

const t = messages.auth.verify;

/**
 * The link in the email only opens this page. The one-time token is used when the person clicks the
 * button, so mail scanners that open links, and React's double rendering in development, cannot use it up.
 * Once the address is confirmed the API signs the person in, so they continue straight to their account.
 */
export function VerifyEmailPanel() {
  const { token, ready } = useEmailTokenFragment();
  const toast = useToast();
  const router = useRouter();
  const { reload } = useSession();
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "signedIn" | "invalid">("idle");
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
      const result = await authApi.verifyEmail(token as string);
      if (result.signedIn) {
        const user = await reload();
        setStatus("signedIn");
        toast.success({ title: t.doneSignedIn });
        window.dispatchEvent(new Event("kulha:navigation-start"));
        router.replace(user?.roles.includes("MERCHANT") ? "/merchant/dashboard" : "/account");
        return;
      }
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

  if (status === "signedIn") {
    return (
      <div className="space-y-5">
        <Alert tone="success">{t.doneSignedIn}</Alert>
        <LinkButton href="/account" className="w-full">
          {t.continueToAccount}
        </LinkButton>
      </div>
    );
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
