import {notFound} from "next/navigation";
import {MerchantReviewDetail} from "@/components/admin/MerchantReviewDetail";
import {requireAdminPage} from "@/lib/auth/server-admin";
import type {SiteLocale} from "@/lib/i18n/site-copy";
const locales:SiteLocale[]=["fr","en","ar"];
const statuses=["PENDING","INFO_REQUIRED","APPROVED","REJECTED"] as const;
export const dynamic="force-dynamic";
export const metadata={title:"KULHA! — Merchant verification",robots:{index:false}};
export default async function AdminMerchantReviewDetailPage({params,searchParams}:{params:Promise<{locale:string;id:string}>;searchParams:Promise<{status?:string;page?:string;q?:string}>}) {
 const [{locale,id},query]=await Promise.all([params,searchParams]);
 if(!locales.includes(locale as SiteLocale)||!id)notFound();
 await requireAdminPage(locale);
 const backStatus=statuses.includes(query.status as (typeof statuses)[number])?query.status as (typeof statuses)[number]:"PENDING";
 const backPage=Math.max(0,Number.isFinite(Number(query.page))?Math.floor(Number(query.page)):0);
 return <MerchantReviewDetail id={id} locale={locale as SiteLocale} backStatus={backStatus} backPage={backPage} backQuery={query.q??""}/>;
}
