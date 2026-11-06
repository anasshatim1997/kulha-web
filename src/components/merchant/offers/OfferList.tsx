"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OfferListSkeleton } from "./OfferSkeletons";
import { offerCopy } from "@/lib/i18n/offer-copy";

type OfferItem = {
  id: string;
  title: string;
  category: string;
  priceMinor: number;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
    if (status) query.set("status", status);
    setLoading(true);
    setError(false);
    fetch(`/api/bff/merchant/offers?${query.toString()}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        return await response.json() as Page;
      })
      .then(setData)
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [status, page, reload]);

  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
  return <div className="grid gap-5" aria-busy={loading}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <select aria-label={t.status} value={status} onChange={event => { setStatus(event.target.value); setPage(0); }} className="rounded-xl border border-forest-200 bg-white px-4 py-3">
        <option value="">{t.status}: —</option>{statuses.map(value => <option key={value} value={value}>{value}</option>)}
      </select>
      <Link href={`/${locale}/merchant/offers/new`} className="rounded-xl bg-forest-700 px-5 py-3 font-extrabold text-cream">{t.newOffer}</Link>
    </div>
    {loading ? <OfferListSkeleton label={t.loading}/> : error ? <div role="alert" className="rounded-2xl bg-white p-6">{t.error} <button className="ms-3 underline" onClick={() => setReload(value => value + 1)}>{t.retry}</button></div> : !data?.items.length ? <p className="rounded-2xl bg-white p-8">{t.empty}</p> : <>
      <div className="grid gap-4">{data.items.map(item => <Link key={item.id} href={`/${locale}/merchant/offers/${item.id}`} className="rounded-3xl border border-forest-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5">
        <div className="flex flex-wrap justify-between gap-3"><strong className="text-lg">{item.title}</strong><span className="rounded-full bg-forest-50 px-3 py-1 text-xs font-black">{item.status}</span></div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-forest-700"><span>{item.category}</span><span>{(item.priceMinor / 100).toFixed(2)} MAD</span><span>{t.available}: {item.availableUnits}</span></div>
      </Link>)}</div>
      {pageCount > 1 && <nav aria-label={t.pagination} className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" disabled={page <= 0 || loading} onClick={() => setPage(value => Math.max(0, value - 1))} className="rounded-xl border px-4 py-2 disabled:opacity-50">{t.previous}</button>
        <span aria-live="polite" className="text-sm">{t.pageOf.replace("{page}", String(page + 1)).replace("{pages}", String(pageCount))}</span>
        <button type="button" disabled={page + 1 >= pageCount || loading} onClick={() => setPage(value => Math.min(pageCount - 1, value + 1))} className="rounded-xl border px-4 py-2 disabled:opacity-50">{t.next}</button>
      </nav>}
    </>}
  </div>;
}
