import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoginShell } from "@/components/admin/AdminLoginShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
    title: "Administration | KULHA",
    robots: {
        index: false,
        follow: false,
    },
};

export default function AdminLoginPage() {
    return (
        <AdminLoginShell
            locale="fr"
            title="Accès administration"
            lead="Connectez-vous avec votre compte administrateur KULHA."
        >
            <Suspense>
                <LoginForm locale="fr" adminOnly />
            </Suspense>
        </AdminLoginShell>
    );
}