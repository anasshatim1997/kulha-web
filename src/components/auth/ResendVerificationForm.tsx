"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { api } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { messages } from "@/lib/i18n/messages";
import { emailSchema, fieldErrors } from "@/lib/validation/schemas";
import { z } from "zod";

const t = messages.auth.verify;
const schema = z.object({ email: emailSchema });

export function ResendVerificationForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(fieldErrors(parsed.error).email);
      return;
    }
    setError(undefined);
    setPending(true);
    try {
      await api.post("/auth/resend-verification", { email: parsed.data.email });
      setDone(true);
    } catch (e) {
      setFormError(describeError(e));
    } finally {
      setPending(false);
    }
  }

  if (done) return <Alert tone="success">{t.resent}</Alert>;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <h2 className="text-lg font-extrabold text-forest-800">{t.resendTitle}</h2>
      {formError && <Alert tone="error">{formError}</Alert>}
      <TextField
        id="resend-email"
        name="email"
        label={messages.fields.email}
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
      />
      <Button type="submit" variant="ghost" loading={pending} className="w-full">
        {pending ? t.resending : t.resend}
      </Button>
    </form>
  );
}
