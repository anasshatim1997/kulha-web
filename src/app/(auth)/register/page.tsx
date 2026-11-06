import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomerRegisterForm } from "@/components/auth/CustomerRegisterForm";
import { RegisterShell } from "@/components/auth/RegisterShell";
import { messages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: messages.auth.register.title };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Old links used /register?accountType=merchant; shop owners now have their own page.
  const params = await searchParams;
  const accountType = Array.isArray(params.accountType) ? params.accountType[0] : params.accountType;
  if (accountType?.toLowerCase() === "merchant") redirect("/register/merchant");

  return (
    <RegisterShell audience="CUSTOMER" title={messages.auth.register.title} lead={messages.auth.register.lead}>
      <CustomerRegisterForm />
    </RegisterShell>
  );
}
