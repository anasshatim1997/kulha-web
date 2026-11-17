"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OfferListSkeleton } from "./OfferSkeletons";
import { offerCopy } from "@/lib/i18n/offer-copy";
import { offerCategoryLabel, offerStatusLabel } from "@/lib/offers/public-copy";
import { PriceSticker } from "@/components/ui/PriceSticker";
import { localePath } from "@/lib/navigation";

type OfferItem = {
  id: string;
  title: string;
  category: string;
  priceMinor: number;
  originalPriceMinor?: number | null;
  quantityTotal: number;
  quantityReserved: number;
  availableUnits: number;
  status: string;
  version: number;
};
type Page = { items: OfferItem[]; page: number; size: number; total: number };

const PAGE_SIZE = 20;
const statuses = ["DRAFT", "PUBLISHED", "UNPUBLISHED", "SUSPENDED", "EXPIRED", "CANCELLED"];

export function OfferList({ locale }: { locale: string }) {
  const t = offerCopy(locale);
  const [data, setData] = useState<Page | null>(null);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  // Loading is derived from which request has settled (see OfferForm for the same pattern).
  const requestKey = `${status}|${page}|${reload}`;
  const [settled, setSettled] = useState<{ key: string; failed: boolean } | null>(null);
  const loading = settled?.key !== requestKey;
  const error = settled?.key === requestKey && settled.failed;

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
    if (status) query.set("status", status);
    fetch(`/api/bff/merchant/offers?${query.toString()}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        return await response.json() as Page;
      })
      .then(value => {
        setData(value);
        setSettled({ key: requestKey, failed: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setSettled({ key: requestKey, failed: true });
      });
    return () => controller.abort();
  }, [status, page, requestKey]);

  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
  return <div className="mw-stack" aria-busy={loading}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <select aria-label={t.status} value={status} onChange={event => { setStatus(event.target.value); setPage(0); }} className="mw-input">
        <option value="">{t.status}: —</option>{statuses.map(value => <option key={value} value={value}>{offerStatusLabel(locale as "fr" | "en" | "ar", value)}</option>)}
      </select>
      <Link href={localePath(locale as "fr" | "en" | "ar", "/merchant/offers/new")} className="mw-primary-action">{t.newOffer}</Link>
    </div>
    {loading ? <OfferListSkeleton label={t.loading}/> : error ? <div role="alert" className="mw-card">{t.error} <button className="ms-3 underline" onClick={() => setReload(value => value + 1)}>{t.retry}</button></div> : !data?.items.length ? <p className="mw-card">{t.empty}</p> : <>
      <div className="grid gap-4">{data.items.map(item => <Link key={item.id} href={localePath(locale as "fr" | "en" | "ar", `/merchant/offers/${item.id}`)} className="mw-card">
        <div className="flex flex-wrap justify-between gap-3"><strong className="text-lg">{item.title}</strong><span className="mw-pill">{offerStatusLabel(locale as "fr" | "en" | "ar", item.status)}</span></div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-forest-700"><span>{offerCategoryLabel(locale as "fr" | "en" | "ar", item.category)}</span><PriceSticker priceMinor={item.priceMinor} originalPriceMinor={item.originalPriceMinor} locale={locale as "fr" | "en" | "ar"} size="sm" /><span>{t.available}: {item.availableUnits}</span></div>
      </Link>)}</div>
      {pageCount > 1 && <nav aria-label={t.pagination} className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" disabled={page <= 0 || loading} onClick={() => setPage(value => Math.max(0, value - 1))} className="rounded-xl border px-4 py-2 disabled:opacity-50">{t.previous}</button>
        <span aria-live="polite" className="text-sm">{t.pageOf.replace("{page}", String(page + 1)).replace("{pages}", String(pageCount))}</span>
        <button type="button" disabled={page + 1 >= pageCount || loading} onClick={() => setPage(value => Math.min(pageCount - 1, value + 1))} className="rounded-xl border px-4 py-2 disabled:opacity-50">{t.next}</button>
      </nav>}
    </>}
  </div>;
}
