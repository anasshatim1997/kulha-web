import {notFound} from "next/navigation";
import {MerchantReviewQueue} from "@/components/admin/MerchantReviewQueue";
import {requireAdminPage} from "@/lib/auth/server-admin";
import type {SiteLocale} from "@/lib/i18n/site-copy";
const locales:SiteLocale[]=["fr","en","ar"];
const statuses=["PENDING","INFO_REQUIRED","APPROVED","REJECTED"] as const;
export const dynamic="force-dynamic";
export const metadata={title:"KULHA! — Merchant review",robots:{index:false}};
export default async function AdminMerchantReviewPage({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<{status?:string;page?:string;q?:string}>}) {
 const [{locale},query]=await Promise.all([params,searchParams]);
 if(!locales.includes(locale as SiteLocale))notFound();
 await requireAdminPage(locale);
 const status=statuses.includes(query.status as (typeof statuses)[number])?query.status as (typeof statuses)[number]:"PENDING";
 const page=Math.max(0,Number.isFinite(Number(query.page))?Math.floor(Number(query.page)):0);
 return <MerchantReviewQueue locale={locale as SiteLocale} initialStatus={status} initialPage={page} initialQuery={query.q??""}/>;
}
