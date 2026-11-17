import type { Metadata } from "next";
import { AccountPanel } from "@/components/auth/AccountPanel";

export const metadata: Metadata = { title: "Mon profil | KULHA!" };

export default function AccountPage() {
  return (
    <AccountPanel />
  );
}
