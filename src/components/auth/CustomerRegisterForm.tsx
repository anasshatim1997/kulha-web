"use client";

import { RegistrationFlow } from "./register/RegistrationFlow";
import { useRegistration } from "./register/useRegistration";
import type { SiteLocale } from "@/lib/i18n/site-copy";

/** Customer sign-up: reserve baskets near home. After sign-up the person lands in their account. */
export function CustomerRegisterForm({ locale = "fr" }: { locale?: SiteLocale }) {
  const reg = useRegistration({ locale, audience: "CUSTOMER" });
  return <RegistrationFlow reg={reg} nameLabel={reg.t.fullName} />;
}
