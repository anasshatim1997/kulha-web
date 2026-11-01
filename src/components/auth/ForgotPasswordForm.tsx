"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { api } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { messages } from "@/lib/i18n/messages";
import { fieldErrors, forgotPasswordSchema } from "@/lib/validation/schemas";

const t = messages.auth.forgot;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(fieldErrors(parsed.error).email);
      return;
    }
    setError(undefined);
    setPending(true);
    try {
      await api.post("/auth/forgot-password", { email: parsed.data.email });
      setDone(true);
    } catch (e) {
      setFormError(describeError(e));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-5">
        <Alert tone="success">{t.done}</Alert>
        <Link href="/login" className="block text-center text-base font-bold text-forest-700 underline underline-offset-4">
          {messages.common.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <Alert tone="error">{formError}</Alert>}
      <TextField
        id="email"
        name="email"
        label={messages.fields.email}
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
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
