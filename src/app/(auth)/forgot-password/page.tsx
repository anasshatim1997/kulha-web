import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthCard } from "@/components/layout/AuthCard";
import { messages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: messages.auth.forgot.title };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const rawEmail = params.email;
  const initialEmail = typeof rawEmail === "string" ? rawEmail.slice(0, 254) : "";

  return (
    <AuthCard title={messages.auth.forgot.title} lead={messages.auth.forgot.lead}>
      <ForgotPasswordForm initialEmail={initialEmail} />
    </AuthCard>
  );
}
