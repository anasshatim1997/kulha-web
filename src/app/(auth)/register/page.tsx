import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthCard } from "@/components/layout/AuthCard";
import { messages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: messages.auth.register.title };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const accountType = Array.isArray(params.accountType) ? params.accountType[0] : params.accountType;
  const initialAccountType = accountType?.toLowerCase() === "merchant" ? "MERCHANT" : null;
  return (
    <AuthCard mode="register" title={messages.auth.register.title} lead={messages.auth.register.lead}>
      <RegisterForm initialAccountType={initialAccountType} />
    </AuthCard>
  );
}
