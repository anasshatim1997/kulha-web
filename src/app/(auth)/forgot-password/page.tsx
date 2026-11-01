import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthCard } from "@/components/layout/AuthCard";
import { messages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: messages.auth.forgot.title };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title={messages.auth.forgot.title} lead={messages.auth.forgot.lead}>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
