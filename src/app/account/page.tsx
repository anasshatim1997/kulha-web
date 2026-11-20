import type { Metadata } from "next";
import { ProfileSettingsPanel } from "@/components/auth/ProfileSettingsPanel";

export const metadata: Metadata = { title: "Profil et paramètres | KULHA!" };
export default function AccountPage() { return <ProfileSettingsPanel />; }
