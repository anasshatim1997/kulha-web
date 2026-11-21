import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthCard } from "@/components/layout/AuthCard";

export const metadata: Metadata = { title: "Administration | KULHA" };

export default function AdminLoginPage() {
  return (
    <AuthCard title="Accès administration" lead="Connectez-vous avec votre compte administrateur KULHA.">
      <Suspense><LoginForm adminOnly /></Suspense>
    </AuthCard>
  );
}
