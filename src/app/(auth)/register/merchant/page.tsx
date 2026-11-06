import type { Metadata } from "next";
import { MerchantRegisterForm } from "@/components/auth/MerchantRegisterForm";
import { RegisterShell } from "@/components/auth/RegisterShell";
import { authCopy } from "@/lib/i18n/auth-copy";

export const metadata: Metadata = { title: authCopy.fr.merchantRegisterTitle };

export default function MerchantRegisterPage() {
  const copy = authCopy.fr;
  return (
    <RegisterShell audience="MERCHANT" title={copy.merchantRegisterTitle} lead={copy.merchantRegisterLead}>
      <MerchantRegisterForm />
    </RegisterShell>
  );
}
