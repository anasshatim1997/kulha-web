"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/session/SessionProvider";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { customerDashboardCopy } from "@/lib/i18n/customer-dashboard-copy";
import { localeFromPath, localePath } from "@/lib/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { useToast } from "@/components/feedback/ToastProvider";

export function AccountPanel() {
  const pathname = usePathname();
  const locale = localeFromPath(pathname) as SiteLocale;
  const t = customerDashboardCopy[locale];
  const { state, signOut } = useSession();
  const toast = useToast();
  const [resend, setResend] = useState<"idle" | "pending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  if (state.status === "loading") {
    return <div className="h-64 animate-pulse rounded-3xl bg-forest-100" aria-label={t.title} />;
  }

  if (state.status === "anonymous") {
    return (
      <Card className="space-y-4">
        <h1 className="text-2xl font-black text-forest-800">{t.title}</h1>
        <p className="text-forest-700">{t.signedOut}</p>
        <LinkButton href={localePath(locale, "/login")} className="w-full sm:w-auto">{t.signIn}</LinkButton>
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
      toast.success({ title: t.resent });
    } catch (e) {
      const detail = describeError(e);
      setError(detail || t.error);
      toast.error({ title: t.title, description: detail || t.error });
      setResend("idle");
    }
  }

  const merchantPath = localePath(locale, "/merchant/dashboard");
  const firstName = user.fullName.trim().split(/\s+/)[0] || user.fullName;

  return (
    <div className="space-y-5" dir={locale === "ar" ? "rtl" : "ltr"}>
      <Card className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-black tracking-[0.18em] text-forest-500">{t.eyebrow}</p>
            <h1 className="text-3xl font-black tracking-tight text-forest-800">{t.welcome}, {firstName}.</h1>
            <p className="max-w-2xl text-sm leading-6 text-forest-600">{t.lead}</p>
          </div>
          <Badge tone={user.emailVerified ? "green" : "yellow"}>{user.emailVerified ? t.accountReady : t.notVerified}</Badge>
        </div>

        {!user.emailVerified && (
          <div className="space-y-3 rounded-2xl border border-sun-200 bg-sun-50 p-4">
            <Alert tone="info" title={t.notVerified}>{t.verifyHelp}</Alert>
            <p className="break-all text-sm font-bold text-forest-800">{user.email}</p>
            {error && <Alert tone="error">{error}</Alert>}
            {resend === "done" ? (
              <Alert tone="success">{t.resent}</Alert>
            ) : (
              <Button variant="accent" loading={resend === "pending"} onClick={() => void resendVerification()}>
                {resend === "pending" ? t.resending : t.resend}
              </Button>
            )}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <section className="rounded-2xl border border-forest-100 bg-forest-50 p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-forest-500">{t.account}</p>
            <p className="mt-2 break-all text-base font-black text-forest-800">{user.fullName}</p>
            <p className="mt-1 break-all text-sm text-forest-600">{user.email}</p>
          </section>
          <section className="rounded-2xl border border-forest-100 bg-forest-50 p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-forest-500">{t.role}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {user.roles.map((role) => <Badge key={role}>{t.roles[role as keyof typeof t.roles] ?? role}</Badge>)}
            </div>
            <p className="mt-3 text-sm text-forest-600">{user.emailVerified ? t.verified : t.notVerified}</p>
          </section>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-forest-800">{t.reservations}</h2>
            <Badge tone="yellow">{t.pilot}</Badge>
          </div>
          <h3 className="text-base font-extrabold text-forest-800">{t.reservationsTitle}</h3>
          <p className="text-sm leading-6 text-forest-600">{t.reservationsBody}</p>
          <LinkButton href={localePath(locale, "/categories")} variant="accent" className="w-full">{t.discover}</LinkButton>
          <LinkButton href={localePath(locale, "/how-it-works")} variant="ghost" className="w-full">{t.how}</LinkButton>
        </Card>

        <Card className="space-y-3">
          <p className="text-xs font-black tracking-[0.16em] text-forest-500">{t.pilot}</p>
          <h2 className="text-xl font-black text-forest-800">{t.pilot}</h2>
          <p className="text-sm leading-6 text-forest-600">{t.pilotBody}</p>
        </Card>
      </div>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-forest-800">{t.shopTitle}</h2>
          <p className="max-w-xl text-sm leading-6 text-forest-600">{t.shopBody}</p>
        </div>
        <LinkButton href={merchantPath} variant="accent" className="shrink-0">{t.shopCta}</LinkButton>
      </Card>

      <div className="flex justify-end">
        <Button variant="ghost" onClick={() => void signOut()}>{t.signOut}</Button>
      </div>
    </div>
  );
}
