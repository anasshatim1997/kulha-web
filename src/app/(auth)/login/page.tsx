import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthCard } from "@/components/layout/AuthCard";
import { messages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: messages.auth.login.title };

export default function LoginPage() {
  return (
    <AuthCard mode="login" title={messages.auth.login.title} lead={messages.auth.login.lead}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
