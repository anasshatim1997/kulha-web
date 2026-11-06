"use client";
import { usePathname } from "next/navigation";
import { OfferListSkeleton } from "@/components/merchant/offers/OfferSkeletons";
import { localeFromPath } from "@/lib/navigation";
import { offerCopy } from "@/lib/i18n/offer-copy";
export default function Loading() { const t = offerCopy(localeFromPath(usePathname())); return <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8" aria-busy="true"><span className="sr-only">{t.loading}</span><div className="h-10 w-48 animate-pulse rounded-xl bg-forest-100"/><OfferListSkeleton label={t.loading}/></div>; }
