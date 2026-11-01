"use client";

import { useState } from "react";
import { useSession } from "@/components/session/SessionProvider";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { messages } from "@/lib/i18n/messages";

const t = messages.account;

export function AccountPanel() {
  const { state, signOut } = useSession();
  const [resend, setResend] = useState<"idle" | "pending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  if (state.status === "loading") {
    return <div className="h-48 animate-pulse rounded-3xl bg-forest-100" aria-label={messages.common.loading} />;
  }

  if (state.status === "anonymous") {
    return (
      <Card className="space-y-4">
        <p>{t.notSignedIn}</p>
        <LinkButton href="/login" className="w-full sm:w-auto">
          {messages.nav.login}
        </LinkButton>
      </Card>
    );
  }

  const { user } = state;

  async function resendVerification() {
    setResend("pending");
    setError(null);
    try {
      await api.post("/auth/resend-verification", { email: user.email });
      setResend("done");
    } catch (e) {
      setError(describeError(e));
      setResend("idle");
    }
  }

  return (
    <Card className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-forest-700">{user.fullName}</h1>
        <p className="mt-1 break-all text-forest-700">{user.email}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={user.emailVerified ? "green" : "yellow"}>{user.emailVerified ? t.verified : t.notVerified}</Badge>
        {user.roles.map((role) => (
          <Badge key={role}>{messages.roles[role] ?? role}</Badge>
        ))}
      </div>

      {!user.emailVerified && (
        <div className="space-y-3">
          <Alert tone="info">{t.notVerifiedHelp}</Alert>
          {error && <Alert tone="error">{error}</Alert>}
          {resend === "done" ? (
            <Alert tone="success">{t.resent}</Alert>
          ) : (
            <Button variant="ghost" loading={resend === "pending"} onClick={() => void resendVerification()}>
              {resend === "pending" ? t.resending : t.resend}
            </Button>
          )}
        </div>
      )}

      <Button variant="primary" onClick={() => void signOut()}>
        {messages.nav.logout}
      </Button>
    </Card>
  );
}
