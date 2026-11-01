"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { localePath } from "@/lib/navigation";

type Category = "all" | "bakery" | "produce" | "cafe" | "restaurant" | "grocery";
type Offer = {
  id: string;
  category: Exclude<Category, "all">;
  title: Record<SiteLocale, string>;
  shop: Record<SiteLocale, string>;
  detail: Record<SiteLocale, string>;
  area: string;
  window: Record<SiteLocale, string>;
  usual: number;
  price: number;
  remaining: number;
  emoji: string;
  visual: string;
  photo: string;
};

// Clearly labelled sample content until approved merchants publish real offers through the API.
// Replace this fixture with the approved public-offers endpoint and DTO from the backend OpenAPI contract.
const SAMPLE_OFFERS: Offer[] = [
  {
    id: "bakery-morning",
    category: "bakery",
    title: { fr: "Le panier du Four Bab El Khair", en: "Four Bab El Khair basket", ar: "سلة المخبوزات الطازجة" },
    shop: { fr: "Four Bab El Khair · Maarif (exemple)", en: "Four Bab El Khair · Maarif (example)", ar: "فرن باب الخير · المعاريف (مثال)" },
    detail: { fr: "Pain, viennoiseries et douceurs du jour, selon les disponibilités.", en: "Bread, pastries and daily treats, depending on availability.", ar: "خبز ومعجنات وحلويات اليوم حسب المتوفر." },
    area: "Casablanca",
    window: { fr: "Aujourd’hui · 18 h–19 h 30", en: "Today · 6–7:30 pm", ar: "اليوم · 18:00–19:30" },
    usual: 55, price: 29, remaining: 3, emoji: "🥐", visual: "bakery", photo: "https://images.unsplash.com/photo-1548091960-fa93ce7f544d?auto=format&fit=crop&w=900&q=78",
  },
  {
    id: "restaurant-dar-zayna",
    category: "restaurant",
    title: { fr: "Le panier gourmand de Dar Zayna", en: "Dar Zayna restaurant basket", ar: "سلة دار زينة" },
    shop: { fr: "Restaurant Dar Zayna · Agdal (exemple)", en: "Restaurant Dar Zayna · Agdal (example)", ar: "مطعم دار زينة · أكدال (مثال)" },
    detail: { fr: "Une sélection du jour : plats marocains, accompagnements et pain maison, selon les disponibilités.", en: "A daily selection of Moroccan dishes, sides and house bread, depending on availability.", ar: "تشكيلة اليوم من الأطباق المغربية والمقبلات والخبز المنزلي حسب المتوفر." },
    area: "Rabat",
    window: { fr: "Aujourd’hui · 17 h–19 h", en: "Today · 5–7 pm", ar: "اليوم · 17:00–19:00" },
    usual: 75, price: 39, remaining: 5, emoji: "🍲", visual: "restaurant", photo: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=78",
  },
  {
    id: "cafe-treats",
    category: "cafe",
    title: { fr: "La pause de Café Bahia", en: "Café Bahia treat basket", ar: "سلة استراحة لذيذة" },
    shop: { fr: "Café Bahia · Gueliz (exemple)", en: "Café Bahia · Gueliz (example)", ar: "مقهى باهية · كليز (مثال)" },
    detail: { fr: "Une sélection sucrée ou salée préparée par le commerce.", en: "A sweet or savoury selection prepared by the shop.", ar: "تشكيلة حلوة أو مالحة يعدّها المتجر." },
    area: "Marrakech",
    window: { fr: "Demain · 16 h–18 h", en: "Tomorrow · 4–6 pm", ar: "غداً · 16:00–18:00" },
    usual: 65, price: 34, remaining: 2, emoji: "☕", visual: "cafe", photo: "https://images.unsplash.com/photo-1736173985657-a08ba56d5a28?auto=format&fit=crop&w=900&q=78",
  },
  {
    id: "grocery-essentials",
    category: "grocery",
    title: { fr: "Le panier de l’Épicerie Al Baraka", en: "Épicerie Al Baraka essentials", ar: "سلة مواد البقالة" },
    shop: { fr: "Épicerie Al Baraka · Bourgogne (exemple)", en: "Épicerie Al Baraka · Bourgogne (example)", ar: "بقالة البركة · بورغون (مثال)" },
    detail: { fr: "Une sélection de produits d’épicerie disponibles en fin de journée.", en: "A selection of grocery items available towards the end of the day.", ar: "مجموعة من منتجات البقالة المتاحة في نهاية اليوم." },
    area: "Casablanca",
    window: { fr: "Aujourd’hui · 19 h–20 h", en: "Today · 7–8 pm", ar: "اليوم · 19:00–20:00" },
    usual: 90, price: 49, remaining: 4, emoji: "🛒", visual: "grocery", photo: "https://images.unsplash.com/photo-1768751947135-a841b07a820f?auto=format&fit=crop&w=900&q=78",
  },
  {
    id: "bakery-family",
    category: "bakery",
    title: { fr: "Les douceurs de Pâtisserie Warda", en: "Pâtisserie Warda sharing box", ar: "سلة حلويات للمشاركة" },
    shop: { fr: "Pâtisserie Warda · Hassan (exemple)", en: "Pâtisserie Warda · Hassan (example)", ar: "حلويات وردة · حسان (مثال)" },
    detail: { fr: "Un assortiment de pains spéciaux et de pâtisseries du jour.", en: "A mix of special breads and pastries from the day.", ar: "تشكيلة من الخبز الخاص وحلويات اليوم." },
    area: "Rabat",
    window: { fr: "Aujourd’hui · 18 h–20 h", en: "Today · 6–8 pm", ar: "اليوم · 18:00–20:00" },
    usual: 80, price: 42, remaining: 1, emoji: "🍞", visual: "bakery-alt", photo: "https://images.unsplash.com/photo-1548091960-fa93ce7f544d?auto=format&fit=crop&w=900&q=78",
  },
  {
    id: "produce-fruit",
    category: "produce",
    title: { fr: "Le panier vitaminé de Marché Atlas", en: "Marché Atlas fruit basket", ar: "سلة الفواكه الطازجة" },
    shop: { fr: "Marché Atlas · Guéliz (exemple)", en: "Marché Atlas · Gueliz (example)", ar: "سوق أطلس · كليز (مثال)" },
    detail: { fr: "Des fruits de saison à savourer rapidement, selon l’arrivage.", en: "Seasonal fruit to enjoy soon, depending on the day’s delivery.", ar: "فواكه موسمية للاستمتاع بها طازجة حسب الوارد اليومي." },
    area: "Marrakech",
    window: { fr: "Demain · 10 h–12 h", en: "Tomorrow · 10 am–noon", ar: "غداً · 10:00–12:00" },
    usual: 60, price: 32, remaining: 6, emoji: "🍊", visual: "fruit", photo: "https://images.unsplash.com/photo-1711349172701-51e7f22cef1a?auto=format&fit=crop&w=900&q=78",
  },
];

const COPY = {
  fr: {
    kicker: "LES BONS PLANS DU QUARTIER", title: "Et si votre prochain bon plan était juste à côté ?", lead: "Découvrez les paniers qui pourraient bientôt vous attendre chez les commerces du quartier : boulangeries, cafés, marchés et épiceries marocaines.",
    sample: "EXEMPLES DE PANIERS", area: "Zone", allAreas: "Toutes les zones (exemples)", casablanca: "Casablanca  · exemple", rabat: "Rabat  · exemple", marrakech: "Marrakech  · exemple", search: "Rechercher un panier ou un commerce", searchPlaceholder: "Ex. boulangerie, fruits…", price: "Prix maximum", anyPrice: "Tous les prix", under30: "Jusqu’à 30 DH", under40: "Jusqu’à 40 DH", under50: "Jusqu’à 50 DH", category: "Catégorie", categories: { all: "Tout voir", bakery: "Boulangerie", produce: "Fruits & légumes", cafe: "Café", restaurant: "Restaurants", grocery: "Épicerie" }, sort: "Trier", sortPrice: "Prix croissant", sortSaving: "Meilleure réduction", results: "paniers exemples", usual: "Valeur habituelle estimée", priceLabel: "Prix exemple", remaining: "exemplaires", pickup: "Retrait", view: "Voir le panier", noResults: "Aucun exemple ne correspond à ces filtres.", reset: "Effacer les filtres", noteTitle: "Important : ce ne sont pas des offres en ligne.", note: "Les commerces, prix, quantités et créneaux sont fictifs pour illustrer l’expérience. Les vraies offres apparaîtront ici après validation des commerces et lancement de la zone pilote.", modalContents: "À quoi pourrait ressembler ce panier", modalInfo: "Avant toute réservation, KULHA! affichera le contenu déclaré, le prix final, la quantité restante, l’adresse du commerce et son créneau de retrait.", signup: "Créer un compte pour suivre le lancement", close: "Fermer", discount: "de réduction (exemple)", areaHint: "Choisissez une zone pour filtrer les exemples, pas une zone déjà couverte.",
  },
  en: {
    kicker: "GOOD FINDS AROUND THE CORNER", title: "What if your next great find was just around the corner?", lead: "Discover the kinds of baskets you could soon find at neighbourhood bakeries, cafés, markets and Moroccan grocery shops.",
    sample: "BASKET EXAMPLES", area: "Area", allAreas: "All areas (examples)", casablanca: "Casablanca  · example", rabat: "Rabat  · example", marrakech: "Marrakech  · example", search: "Search baskets or shops", searchPlaceholder: "e.g. bakery, fruit…", price: "Maximum price", anyPrice: "Any price", under30: "Up to 30 MAD", under40: "Up to 40 MAD", under50: "Up to 50 MAD", category: "Category", categories: { all: "All baskets", bakery: "Bakery", produce: "Fruit & veg", cafe: "Cafés", restaurant: "Restaurants", grocery: "Grocery" }, sort: "Sort by", sortPrice: "Lowest price", sortSaving: "Best reduction", results: "sample baskets", usual: "Estimated usual value", priceLabel: "Sample price", remaining: "left", pickup: "Collection", view: "View basket", noResults: "No sample baskets match these filters.", reset: "Clear filters", noteTitle: "Important: these are not live offers.", note: "Shops, prices, quantities and collection windows are illustrative. Real offers will appear here once shops are approved and the pilot area launches.", modalContents: "What this basket could look like", modalInfo: "Before any reservation, KULHA! will show declared contents, final price, remaining quantity, shop address and collection window.", signup: "Create an account to follow the launch", close: "Close", discount: "off (example)", areaHint: "Choose an area to filter examples, not an area currently confirmed as covered.",
  },
  ar: {
    kicker: "اكتشف خيرات الحي", title: "ماذا لو كان عرضك القادم على بُعد خطوات منك؟", lead: "اكتشف أنواع السلال التي قد تجدها قريباً لدى مخابز ومقاهٍ وأسواق وبقالات الأحياء المغربية.",
    sample: "أمثلة على السلال", area: "المنطقة", allAreas: "كل المناطق (أمثلة)", casablanca: "الدار البيضاء  · مثال", rabat: "الرباط  · مثال", marrakech: "مراكش  · مثال", search: "ابحث عن سلة أو متجر", searchPlaceholder: "مثلاً: مخبزة، فواكه…", price: "الحد الأقصى للسعر", anyPrice: "كل الأسعار", under30: "حتى 30 درهماً", under40: "حتى 40 درهماً", under50: "حتى 50 درهماً", category: "الفئة", categories: { all: "كل السلال", bakery: "مخبوزات", produce: "فواكه وخضروات", cafe: "مقاهٍ", restaurant: "مطاعم", grocery: "بقالة" }, sort: "ترتيب حسب", sortPrice: "السعر الأقل", sortSaving: "أكبر تخفيض", results: "سلال توضيحية", usual: "القيمة المعتادة المقدرة", priceLabel: "السعر التوضيحي", remaining: "متبقية", pickup: "الاستلام", view: "شاهد السلة", noResults: "لا توجد أمثلة تطابق خيارات البحث.", reset: "مسح عوامل التصفية", noteTitle: "مهم: هذه ليست عروضاً منشورة.", note: "المتاجر والأسعار والكميات ومواعيد الاستلام افتراضية لتوضيح التجربة. ستظهر العروض الحقيقية بعد اعتماد المتاجر وإطلاق المنطقة التجريبية.", modalContents: "كيف يمكن أن تبدو هذه السلة", modalInfo: "قبل الحجز، ستعرض KULHA! المحتويات المعلنة والسعر النهائي والكمية المتبقية وعنوان المتجر وموعد الاستلام.", signup: "أنشئ حساباً لمتابعة الإطلاق", close: "إغلاق", discount: "تخفيض (مثال)", areaHint: "اختر منطقة لتصفية الأمثلة، وليس منطقة مؤكدة التغطية حالياً.",
  },
} as const;

export function BasketDiscovery({ locale }: { locale: SiteLocale }) {
  const t = COPY[locale];
  const rtl = locale === "ar";
  const [category, setCategory] = useState<Category>("all");
  const [area, setArea] = useState("all");
  const [maxPrice, setMaxPrice] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"price" | "saving">("price");
  const [selected, setSelected] = useState<Offer | null>(null);
  const currency = (value: number) => locale === "ar" ? `${value} درهم` : locale === "en" ? `${value} MAD` : `${value} DH`;
  const arabicAreas: Record<string, string> = { Casablanca: "الدار البيضاء", Rabat: "الرباط", Marrakech: "مراكش" };
  const areaName = (value: string) => locale === "ar" ? (arabicAreas[value] ?? value) : value;
  const categories: Category[] = ["all", "bakery", "produce", "cafe", "restaurant", "grocery"];

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return SAMPLE_OFFERS.filter((offer) => {
      const matchCategory = category === "all" || offer.category === category;
      const matchArea = area === "all" || offer.area.toLowerCase() === area;
      const matchPrice = maxPrice === "all" || offer.price <= Number(maxPrice);
      const searchable = [offer.title[locale], offer.shop[locale], offer.detail[locale], offer.area].join(" ").toLocaleLowerCase();
      return matchCategory && matchArea && matchPrice && (!normalizedQuery || searchable.includes(normalizedQuery));
    }).sort((a, b) => sort === "price" ? a.price - b.price : ((b.usual - b.price) / b.usual) - ((a.usual - a.price) / a.usual));
  }, [area, category, locale, maxPrice, query, sort]);

  const reset = () => { setCategory("all"); setArea("all"); setMaxPrice("all"); setQuery(""); setSort("price"); };
  const registerHref = localePath(locale, "/register");

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selected]);

  return (
    <section className="basket-discovery" id="discover-baskets" dir={rtl ? "rtl" : "ltr"} aria-labelledby="basket-discovery-title">
      <div className="basket-discovery-heading">
        <div><p className="section-kicker">{t.kicker}</p><h2 id="basket-discovery-title">{t.title}</h2><p>{t.lead}</p></div>
        <span className="basket-discovery-sample"><i aria-hidden="true" />{t.sample}</span>
      </div>

      <div className="basket-discovery-tools">
        <div className="basket-discovery-search"><label htmlFor="basket-search">⌕ <span className="sr-only">{t.search}</span></label><input id="basket-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPlaceholder} /></div>
        <label className="basket-filter-field"><span>{t.area}</span><select value={area} onChange={(event) => setArea(event.target.value)}><option value="all">{t.allAreas}</option><option value="casablanca">{t.casablanca}</option><option value="rabat">{t.rabat}</option><option value="marrakech">{t.marrakech}</option></select></label>
        <label className="basket-filter-field"><span>{t.price}</span><select value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}><option value="all">{t.anyPrice}</option><option value="30">{t.under30}</option><option value="40">{t.under40}</option><option value="50">{t.under50}</option></select></label>
      </div>
      <p className="basket-area-hint">{t.areaHint}</p>

      <div className="basket-category-row" aria-label={t.category}>
        {categories.map((item) => <button type="button" key={item} className={category === item ? "is-active" : ""} aria-pressed={category === item} onClick={() => setCategory(item)}>{t.categories[item]}</button>)}
      </div>

      <div className="basket-discovery-results-head"><p><strong>{filtered.length}</strong> {t.results}</p><label><span>{t.sort}</span><select value={sort} onChange={(event) => setSort(event.target.value as "price" | "saving")}><option value="price">{t.sortPrice}</option><option value="saving">{t.sortSaving}</option></select></label></div>

      {filtered.length ? <div className="basket-discovery-grid">
        {filtered.map((offer) => {
          const discount = Math.round(((offer.usual - offer.price) / offer.usual) * 100);
          return <article className="basket-listing-card" key={offer.id}>
            <div className={`basket-listing-visual basket-visual-${offer.visual}`} style={{ backgroundImage: `linear-gradient(180deg, rgb(7 51 36 / .05), rgb(7 51 36 / .28)), url("${offer.photo}")` }} aria-hidden="true"><span className="basket-discount-bubble">-{discount}%</span><span className="basket-visual-brand">KULHA!</span></div>
            <div className="basket-listing-content">
              <div className="basket-listing-shop"><span>✳</span>{offer.shop[locale]}</div>
              <h3>{offer.title[locale]}</h3>
              <p className="basket-listing-description">{offer.detail[locale]}</p>
              <div className="basket-listing-prices"><div><small>{t.usual}</small><del>{currency(offer.usual)}</del></div><div><small>{t.priceLabel}</small><strong>{currency(offer.price)}</strong></div></div>
              <div className="basket-listing-meta"><span>⌖ {areaName(offer.area)} · {t.sample.toLowerCase()}</span><span>◷ {offer.window[locale]}</span><span>▣ {offer.remaining} {t.remaining}</span></div>
              <button className="basket-view-button" type="button" onClick={() => setSelected(offer)}>{t.view}<b aria-hidden="true">↗</b></button>
            </div>
          </article>;
        })}
      </div> : <div className="basket-empty-state"><span>⌕</span><h3>{t.noResults}</h3><button type="button" onClick={reset}>{t.reset}</button></div>}

      <aside className="basket-discovery-disclaimer"><span aria-hidden="true">✳</span><div><strong>{t.noteTitle}</strong><p>{t.note}</p></div><Link href={registerHref}>{t.signup}<b aria-hidden="true">↗</b></Link></aside>

      {selected && <div className="basket-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
        <section className="basket-modal" role="dialog" aria-modal="true" aria-labelledby="basket-modal-title" dir={rtl ? "rtl" : "ltr"}>
          <button className="basket-modal-close" type="button" aria-label={t.close} onClick={() => setSelected(null)}>×</button>
          <div className={`basket-modal-visual basket-listing-visual basket-visual-${selected.visual}`} style={{ backgroundImage: `linear-gradient(180deg, rgb(7 51 36 / .05), rgb(7 51 36 / .28)), url("${selected.photo}")` }} aria-hidden="true"><span className="basket-visual-brand">KULHA!</span></div>
          <span className="basket-discovery-sample"><i aria-hidden="true" />{t.sample}</span>
          <h2 id="basket-modal-title">{selected.title[locale]}</h2>
          <p>{selected.detail[locale]}</p>
          <div className="basket-modal-facts"><div><small>{t.priceLabel}</small><strong>{currency(selected.price)}</strong></div><div><small>{t.usual}</small><del>{currency(selected.usual)}</del></div><div><small>{t.pickup}</small><b>{selected.window[locale]}</b></div><div><small>{t.area}</small><b>{areaName(selected.area)}</b></div><div><small>{t.remaining}</small><b>{selected.remaining}</b></div></div>
          <p className="basket-modal-info">{t.modalInfo}</p>
          <Link className="button button-yellow" href={registerHref}>{t.signup}<span aria-hidden="true">↗</span></Link>
        </section>
      </div>}
    </section>
  );
}
