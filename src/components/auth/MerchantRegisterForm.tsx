"use client";

import { RegistrationFlow } from "./register/RegistrationFlow";
import { useRegistration } from "./register/useRegistration";
import type { SiteLocale } from "@/lib/i18n/site-copy";

/**
 * Shop owner sign-up. It only creates the login: merchant rights are granted by the KULHA! team after the
 * owner confirms their e-mail and submits the shop application from the dashboard.
 */
export function MerchantRegisterForm({ locale = "fr" }: { locale?: SiteLocale }) {
  const reg = useRegistration({ locale, audience: "MERCHANT" });
  return <RegistrationFlow reg={reg} nameLabel={reg.t.ownerFullName} />;
}
