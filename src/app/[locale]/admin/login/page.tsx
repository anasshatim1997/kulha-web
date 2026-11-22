import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AdminLoginShell } from "@/components/admin/AdminLoginShell";
import { LoginForm } from "@/components/auth/LoginForm";
import type { SiteLocale } from "@/lib/i18n/site-copy";

const locales: SiteLocale[] = ["en", "ar"];

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const robots = { index: false, follow: false };
    if (!locales.includes(locale as SiteLocale)) return { title: "KULHA Administration", robots };
    return { title: locale === "ar" ? "دخول الإدارة | KULHA" : "Admin sign in | KULHA", robots };
}

export default async function LocalizedAdminLoginPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    if (!locales.includes(locale as SiteLocale)) notFound();
    const selected = locale as SiteLocale;
    const title = selected === "ar" ? "دخول الإدارة" : "Administrator sign in";
    const lead = selected === "ar"
        ? "سجّل الدخول باستخدام حساب إدارة KULHA."
        : "Sign in with your KULHA administrator account.";
    return (
        <AdminLoginShell locale={selected} title={title} lead={lead}>
            <Suspense><LoginForm locale={selected} adminOnly /></Suspense>
        </AdminLoginShell>
    );
}