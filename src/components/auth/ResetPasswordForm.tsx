"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button, LinkButton } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { api, ApiError } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { messages } from "@/lib/i18n/messages";
import { authCopy } from "@/lib/i18n/auth-copy";
import { fieldErrors, resetPasswordSchema } from "@/lib/validation/schemas";
import { useEmailTokenFragment } from "@/lib/auth/use-email-token-fragment";
import { useToast } from "@/components/feedback/ToastProvider";

const t = messages.auth.reset;
const passwordStrengthCopy = authCopy.fr.passwordStrength;

export function ResetPasswordForm() {
  const { token, ready } = useEmailTokenFragment();
  const toast = useToast();
  const [values, setValues] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"form" | "done" | "invalid">("form");

  if (!ready) return <p className="text-sm text-forest-600">{messages.common.loading}</p>;

  if (!token) {
    return (
      <div className="space-y-5">
        <Alert tone="error">{t.missingToken}</Alert>
        <LinkButton href="/forgot-password" variant="ghost" className="w-full">
          {t.requestNew}
        </LinkButton>
      </div>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = resetPasswordSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: parsed.data.password });
      setStatus("done");
      toast.success({ title: t.done });
    } catch (e) {
      if (e instanceof ApiError && e.status === 400 && e.title === "Invalid token") {
        setStatus("invalid");
        toast.error({ title: t.invalid });
      } else {
        setFormError(describeError(e));
        toast.error({ title: messages.errors.generic, description: describeError(e) });
      }
    } finally {
      setPending(false);
    }
  }

  if (status === "done") {
    return (
      <div className="space-y-5">
        <Alert tone="success">{t.done}</Alert>
        <LinkButton href="/login" className="w-full">
          {messages.auth.login.submit}
        </LinkButton>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="space-y-5">
        <Alert tone="error">{t.invalid}</Alert>
        <LinkButton href="/forgot-password" variant="ghost" className="w-full">
          {t.requestNew}
        </LinkButton>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <Alert tone="error">{formError}</Alert>}
      <PasswordField
        id="password"
        name="password"
        label={messages.fields.newPassword}
        hint={messages.fields.passwordHint}
        strengthCopy={passwordStrengthCopy}
        autoComplete="new-password"
        value={values.password}
        onChange={(e) => setValues({ ...values, password: e.target.value })}
        error={errors.password}
      />
      <PasswordField
        id="confirm"
        name="confirm"
        label={messages.fields.confirmPassword}
        autoComplete="new-password"
        value={values.confirm}
        onChange={(e) => setValues({ ...values, confirm: e.target.value })}
        error={errors.confirm}
      />
      <Button type="submit" loading={pending} className="w-full">
        {pending ? t.submitting : t.submit}
      </Button>
      <Link href="/login" className="block text-center text-base font-bold text-forest-700 underline underline-offset-4">
        {messages.common.backToLogin}
      </Link>
    </form>
  );
}
