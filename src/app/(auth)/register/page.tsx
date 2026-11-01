import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthCard } from "@/components/layout/AuthCard";
import { messages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: messages.auth.register.title };

export default function RegisterPage() {
  return (
    <AuthCard mode="register" title={messages.auth.register.title} lead={messages.auth.register.lead}>
      <RegisterForm />
    </AuthCard>
  );
}
