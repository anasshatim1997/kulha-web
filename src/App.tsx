import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin, Search, TriangleAlert } from "lucide-react";
import { OFFERS, type Category, type Offer } from "./data";
import { T, type Lang } from "./i18n";
import { PriceSticker } from "./components/ui/PriceSticker";

const CATS: Category[] = ["bakery", "restaurant", "grocery", "cafe"];
const save = (o: Offer) => (o.refPrice ? Math.round((1 - o.price / o.refPrice) * 100) : 0);

export default function App() {
  const [lang, setLang] = useState<Lang>("fr");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");
  const [district, setDistrict] = useState("all");
  const [max, setMax] = useState(60);
  const [hideSold, setHideSold] = useState(false);
  const [sort, setSort] = useState<"soon" | "price" | "save">("soon");
  const [loading, setLoading] = useState(true);
  const t = T[lang];

  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; }, [lang]);
  useEffect(() => { const id = setTimeout(() => setLoading(false), 500); return () => clearTimeout(id); }, []);

  const money = useMemo(() => new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }), [lang]);
  const districts = useMemo(() => [...new Set(OFFERS.map((o) => o.district))].sort(), []);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return OFFERS.filter((o) =>
      (cat === "all" || o.category === cat) && (district === "all" || o.district === district) && o.price <= max &&
      (!hideSold || o.remaining > 0) && (!needle || (o.title + o.merchant).toLowerCase().includes(needle)))
      .sort((a, b) => sort === "price" ? a.price - b.price : sort === "save" ? save(b) - save(a) : a.from.localeCompare(b.from));
  }, [q, cat, district, max, hideSold, sort]);

  const reset = () => { setQ(""); setCat("all"); setDistrict("all"); setMax(60); setHideSold(false); };
  const groups = (["today", "tomorrow"] as const).map((d) => ({ d, items: list.filter((o) => o.day === d) })).filter((g) => g.items.length);
  const field = "h-11 w-full rounded-lg border border-[#c9d6cd] bg-white px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5c3f]";

  return (
    <div className="min-h-screen bg-[#f3f6f2] text-[#14231c]" style={{ fontFamily: lang === "ar" ? "'Segoe UI', Tahoma, system-ui, sans-serif" : "'Trebuchet MS', 'Segoe UI', system-ui, sans-serif" }}>
      <header className="bg-[#0e3b2c] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span dir="ltr" className="text-2xl font-black tracking-tight">KULHA<span className="text-[#f2a900]">!</span></span>
          <div role="group" aria-label="Langue" className="flex overflow-hidden rounded-lg border border-white/30 text-sm">
            {(["fr", "ar"] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
                className={`px-3.5 py-2 ${lang === l ? "bg-[#f2a900] font-bold text-[#14231c]" : "hover:bg-white/10"}`}>{l === "fr" ? "Français" : "العربية"}</button>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-4">
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">{t.headline}</h1>
          <label className="relative mt-5 block max-w-xl">
            <span className="sr-only">{t.search}</span>
            <Search className="pointer-events-none absolute start-3.5 top-3.5 h-5 w-5 text-[#5b7266]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search}
              className="h-12 w-full rounded-xl bg-white ps-11 pe-4 text-base text-[#14231c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2a900]" />
          </label>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[250px_1fr]">
        <aside aria-label={t.filters}>
          <details open className="rounded-xl bg-white p-4 shadow-sm lg:[&>summary]:hidden">
            <summary className="cursor-pointer font-bold">{t.filters}</summary>
            <div className="mt-4 space-y-5 lg:mt-0">
              <fieldset>
                <legend className="mb-2 text-sm font-bold">{t.category}</legend>
                <div className="flex flex-wrap gap-2">
                  {(["all", ...CATS] as const).map((c) => (
                    <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
                      className={`rounded-full border px-3 py-1.5 text-sm ${cat === c ? "border-[#0e5c3f] bg-[#0e5c3f] text-white" : "border-[#c9d6cd] bg-white hover:border-[#0e5c3f]"}`}>
                      {c === "all" ? t.all : t.cat[c]}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="block text-sm font-bold">{t.district}
                <select value={district} onChange={(e) => setDistrict(e.target.value)} className={`${field} mt-2 font-normal`}>
                  <option value="all">{t.allDistricts}</option>
                  {districts.map((d) => <option key={d}>{d}</option>)}
                </select>
              </label>
              <label className="block text-sm font-bold">
                <span className="flex justify-between">{t.maxPrice}<span className="font-black text-[#0e5c3f]">{money.format(max)}</span></span>
                <input type="range" min={10} max={60} step={5} value={max} onChange={(e) => setMax(+e.target.value)} className="mt-3 w-full accent-[#0e5c3f]" />
              </label>
              <label className="flex items-center gap-2.5 text-sm">
                <input type="checkbox" checked={hideSold} onChange={(e) => setHideSold(e.target.checked)} className="h-5 w-5 accent-[#0e5c3f]" />{t.onlyAvail}
              </label>
              <button onClick={reset} className="text-sm font-semibold text-[#0e5c3f] underline underline-offset-4">{t.reset}</button>
            </div>
          </details>
        </aside>

        <section aria-live="polite">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="font-bold">{loading ? "…" : t.results(list.filter((o) => o.remaining > 0).length)}</p>
            <label className="flex items-center gap-2 text-sm">{t.sort}
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={`${field} !h-10 !w-auto`}>
                <option value="soon">{t.sortSoon}</option><option value="price">{t.sortPrice}</option><option value="save">{t.sortSave}</option>
              </select>
            </label>
          </div>

          {loading && [0, 1, 2].map((i) => <div key={i} className="mb-3 h-32 animate-pulse rounded-xl bg-[#e1e9e2]" />)}

          {!loading && !list.length && (
            <div className="rounded-xl border-2 border-dashed border-[#c9d6cd] p-10 text-center">
              <TriangleAlert className="mx-auto mb-3 h-8 w-8 text-[#b87a00]" />
              <h2 className="text-lg font-bold">{t.emptyTitle}</h2>
              <p className="mx-auto mt-1 max-w-sm text-[#4a5f54]">{t.emptyBody}</p>
              <button onClick={reset} className="mt-5 rounded-lg bg-[#0e5c3f] px-5 py-2.5 font-bold text-white">{t.reset}</button>
            </div>
          )}

          {!loading && groups.map(({ d, items }) => (
            <div key={d} className="mb-8">
              <h2 className="mb-3 text-xl font-extrabold">{t[d]}</h2>
              <ul className="space-y-3">
                {items.map((o) => {
                  const out = o.remaining === 0;
                  return (
                    <li key={o.id} className={`ticket flex flex-col overflow-hidden rounded-xl bg-white shadow-sm sm:flex-row ${out ? "opacity-60" : ""}`}>
                      <div className="flex-1 p-4 sm:p-5">
                        <p className="text-sm font-semibold text-[#0e5c3f]">{t.cat[o.category]}</p>
                        <h3 className="mt-0.5 text-lg font-extrabold">{o.title}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-[15px] text-[#3d5247]"><MapPin className="h-4 w-4 shrink-0" />{o.merchant}, {o.district}</p>
                        <p className="mt-2 inline-flex items-center gap-2 rounded-md bg-[#fff3d1] px-2.5 py-1 text-[15px] font-bold" dir="ltr"><Clock className="h-4 w-4" />{o.from}–{o.to}</p>
                        <p className="mt-3 text-sm text-[#3d5247]">{o.food}</p>
                        <p className={`mt-1 text-sm ${o.allergens ? "text-[#3d5247]" : "italic text-[#6b7f73]"}`}>{o.allergens ? `${t.allergens} : ${o.allergens}` : t.unknown}</p>
                      </div>
                      <div className="stub flex items-center justify-between gap-4 border-t-2 border-dashed border-[#c9d6cd] bg-[#f8faf6] p-4 sm:w-56 sm:flex-col sm:items-stretch sm:justify-center sm:border-s-2 sm:border-t-0 sm:text-center">
                        <div>
                          <PriceSticker priceMinor={o.price * 100} originalPriceMinor={o.refPrice ? o.refPrice * 100 : null} locale={lang} size="lg" />
                          <p className={`mt-2 text-sm font-bold ${o.remaining > 0 && o.remaining <= 2 ? "text-[#c0392b]" : "text-[#4a5f54]"}`}>
                            {out ? t.soldOut : o.remaining <= 2 ? t.last(o.remaining) : t.left(o.remaining)}</p>
                        </div>
                        <button disabled={out} className="rounded-lg bg-[#0e5c3f] px-5 py-3 font-bold text-white hover:bg-[#0e3b2c] disabled:cursor-not-allowed disabled:bg-[#9db0a4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5c3f]">
                          {out ? t.soldOut : t.reserve}</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <p className="text-sm text-[#4a5f54]">{t.note}</p>
        </section>
      </main>
    </div>
  );
}
