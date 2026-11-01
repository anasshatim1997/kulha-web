import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailPanel } from "@/components/auth/VerifyEmailPanel";
import { AuthCard } from "@/components/layout/AuthCard";
import { messages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: messages.auth.verify.title, robots: { index: false } };

export default function VerifyEmailPage() {
  return (
    <AuthCard title={messages.auth.verify.title} lead={messages.auth.verify.lead}>
      <Suspense>
        <VerifyEmailPanel />
      </Suspense>
    </AuthCard>
  );
}
