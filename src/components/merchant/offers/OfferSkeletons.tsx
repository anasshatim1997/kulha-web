import { Skeleton } from "@/components/ui/skeleton/Skeleton";

export function OfferCardSkeleton() {
  return <article className="rounded-3xl border border-forest-100 bg-white p-5 shadow-sm"><div className="flex justify-between gap-4"><Skeleton width="44%" height="1.2rem"/><Skeleton width="5rem" height="1.5rem"/></div><Skeleton className="mt-4" width="70%"/><div className="mt-6 flex gap-3"><Skeleton width="5rem" height="2rem"/><Skeleton width="5rem" height="2rem"/></div></article>;
}

export function OfferListSkeleton({ count = 4, label = "Loading…" }: { count?: number; label?: string }) {
  return <section aria-busy="true" aria-label={label} className="grid gap-4">{Array.from({ length: count }, (_, i) => <OfferCardSkeleton key={i}/>) }<span className="sr-only">{label}</span></section>;
}

export function OfferFormSkeleton({ label = "Loading…" }: { label?: string }) {
  return <section aria-busy="true" className="grid gap-5 rounded-3xl border border-forest-100 bg-white p-6"><span className="sr-only">{label}</span>{["90%", "100%", "45%", "45%", "60%", "60%"].map((width, i) => <Skeleton key={i} width={width} height={i === 1 ? "6rem" : "2.7rem"}/>)}</section>;
}

export function OfferDetailSkeleton({ label = "Loading…" }: { label?: string }) {
  return <section aria-busy="true" className="rounded-3xl border border-forest-100 bg-white p-6"><span className="sr-only">{label}</span><Skeleton width="55%" height="2rem"/><Skeleton className="mt-4" width="88%" height="5rem"/><div className="mt-6 grid grid-cols-2 gap-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height="3rem"/>)}</div></section>;
}
