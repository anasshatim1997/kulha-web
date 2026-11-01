import type { Metadata } from "next";
import { AccountPanel } from "@/components/auth/AccountPanel";
import { messages } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: messages.account.title };

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <AccountPanel />
    </div>
  );
}
