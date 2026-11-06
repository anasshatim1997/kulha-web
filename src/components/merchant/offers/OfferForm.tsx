"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { offerCopy } from "@/lib/i18n/offer-copy";
import { casablancaLocalToUtc, utcToCasablancaLocal } from "@/lib/time/casablanca";
import { idempotencyEntry, type IdempotencyEntry } from "@/lib/offers/idempotency";
import { allergenPayload, DEFAULT_ALLERGENS_STATUS } from "@/lib/offers/allergens";
import { validateOfferDraft } from "@/lib/offers/form-validation";
import { parseOfferProblem } from "@/lib/offers/problem";
import { SubmitProgress } from "@/components/auth/SubmitProgress";
import { OfferDetailSkeleton, OfferFormSkeleton } from "./OfferSkeletons";

type Offer = {
  id: string;
  title: string;
  description: string;
  category: string;
  priceMinor: number;
  originalPriceMinor: number | null;
  quantityTotal: number;
  quantityReserved: number;
  availableUnits: number;
  pickupStart: string | null;
  pickupEnd: string | null;
  allergensStatus: string;
  allergens: string[];
  foodNotes: string | null;
  status: string;
  version: number;
};

const categories = ["BREAD_PASTRY", "PREPARED_MEALS", "GROCERIES", "FRUIT_VEG", "DRINKS", "SURPRISE_BASKET", "OTHER"];
const allergens = ["GLUTEN", "CRUSTACEANS", "EGGS", "FISH", "PEANUTS", "SOY", "MILK", "NUTS", "CELERY", "MUSTARD", "SESAME", "SULPHITES", "LUPIN", "MOLLUSCS"];

export function OfferForm({ locale, offerId }: { locale: string; offerId?: string }) {
  const t = offerCopy(locale);
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(Boolean(offerId));
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("BREAD_PASTRY");
  const [price, setPrice] = useState("1.00");
  const [originalPrice, setOriginalPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [pickupStart, setPickupStart] = useState("");
  const [pickupEnd, setPickupEnd] = useState("");
  const [allergenCodes, setAllergenCodes] = useState<string[]>([]);
  const [allergensUnknown, setAllergensUnknown] = useState(DEFAULT_ALLERGENS_STATUS === "UNKNOWN");
  const [foodNotes, setFoodNotes] = useState("");
  const createKey = useRef<IdempotencyEntry | null>(null);
  const duplicateKey = useRef<string | null>(null);

  useEffect(() => {
    if (!offerId) return;
    const controller = new AbortController();
    setLoading(true);
    setLoadError(false);
    fetch(`/api/bff/merchant/offers/${offerId}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(String(response.status));
        return await response.json() as Offer;
      })
      .then(value => {
        setOffer(value);
        setTitle(value.title);
        setDescription(value.description);
        setCategory(value.category);
        setPrice((value.priceMinor / 100).toFixed(2));
        setOriginalPrice(value.originalPriceMinor === null ? "" : (value.originalPriceMinor / 100).toFixed(2));
        setQuantity(String(value.quantityTotal));
        setPickupStart(value.pickupStart ? utcToCasablancaLocal(value.pickupStart) : "");
        setPickupEnd(value.pickupEnd ? utcToCasablancaLocal(value.pickupEnd) : "");
        setAllergenCodes(value.allergens);
        setAllergensUnknown(value.allergensStatus === "UNKNOWN");
        setFoodNotes(value.foodNotes ?? "");
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [offerId, loadAttempt]);

  function clearFieldError(field: string) {
    setFieldErrors(current => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function showProblem(problem: unknown) {
    const parsed = parseOfferProblem(problem);
    setFieldErrors(parsed.fieldErrors);
    setError(Object.keys(parsed.fieldErrors).length ? "" : parsed.detail ?? t.error);
  }

  function fieldMessage(field: string): ReactNode {
    const message = fieldErrors[field];
    return message ? <span id={`${field}-error`} className="text-sm font-medium text-tomato-600" role="alert">{message}</span> : null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const validation = validateOfferDraft({ title, description, price, originalPrice, quantity });
    const validationMessages: Record<string, string> = {};
    for (const [field, code] of Object.entries(validation)) {
      validationMessages[field === "price" ? "priceMinor" : field === "originalPrice" ? "originalPriceMinor" : field === "quantity" ? "quantityTotal" : field] = t[code];
    }
    if (Object.keys(validationMessages).length) {
      setFieldErrors(validationMessages);
      return;
    }
    setSaving(true);
    setFieldErrors({});
    const cents = (value: string) => Math.round(Number(value) * 100);
    const body = {
      title,
      description,
      category,
      priceMinor: cents(price),
      originalPriceMinor: originalPrice ? cents(originalPrice) : null,
      quantityTotal: Number(quantity),
      pickupStart: pickupStart ? casablancaLocalToUtc(pickupStart) : null,
      pickupEnd: pickupEnd ? casablancaLocalToUtc(pickupEnd) : null,
      ...allergenPayload(allergensUnknown, allergenCodes),
      foodNotes: foodNotes || null,
      version: offer?.version,
    };
    try {
      const payload = JSON.stringify(body);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (!offerId) {
        createKey.current = idempotencyEntry(payload, createKey.current);
        headers["Idempotency-Key"] = createKey.current.key;
      }
      const response = await fetch(offerId ? `/api/bff/merchant/offers/${offerId}` : "/api/bff/merchant/offers", {
        method: offerId ? "PUT" : "POST",
        headers,
        body: payload,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 409 && offerId) {
          setError(t.conflict);
          return;
        }
        showProblem(result);
        return;
      }
      createKey.current = null;
      const saved = result as { id: string };
      router.push(`/${locale}/merchant/offers/${saved.id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.error);
    } finally {
      setSaving(false);
    }
  }

  async function action(name: "publish" | "unpublish" | "duplicate" | "cancel") {
    if (!offerId) return;
    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      const headers: Record<string, string> = {};
      if (name === "duplicate") {
        duplicateKey.current ??= crypto.randomUUID();
        headers["Idempotency-Key"] = duplicateKey.current;
      }
      const response = name === "cancel"
        ? await fetch(`/api/bff/merchant/offers/${offerId}`, { method: "DELETE" })
        : await fetch(`/api/bff/merchant/offers/${offerId}/${name}`, { method: "POST", headers });
      if (!response.ok) {
        if (response.status === 409 && name === "unpublish") {
          setError(t.conflict);
          return;
        }
        showProblem(await response.json().catch(() => null));
        return;
      }
      if (name === "cancel") {
        router.push(`/${locale}/merchant/offers`);
        return;
      }
      const result = await response.json() as Offer;
      if (name === "duplicate") {
        duplicateKey.current = null;
        router.push(`/${locale}/merchant/offers/${result.id}`);
      } else {
        setOffer(result);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return offerId ? <OfferDetailSkeleton label={t.loading}/> : <OfferFormSkeleton label={t.loading}/>;
  if (loadError) return <section className="grid gap-4 rounded-3xl border border-forest-100 bg-white p-6" role="alert">
    <p>{t.loadDetailError}</p>
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={() => setLoadAttempt(value => value + 1)} className="rounded-xl bg-forest-700 px-5 py-3 font-bold text-white">{t.retry}</button>
      <Link href={`/${locale}/merchant/offers`} className="px-3 py-3 underline">{t.back}</Link>
    </div>
  </section>;

  const input = "w-full rounded-xl border border-forest-200 bg-white px-4 py-3 text-forest-900";
  return <><SubmitProgress title={t.saving} detail={t.pleaseWait} active={saving}/><form onSubmit={submit} className="grid gap-5 rounded-3xl border border-forest-100 bg-white p-6 shadow-sm" aria-busy={saving}>
    {error && <p role="alert" className="rounded-xl bg-tomato-50 p-3 text-tomato-600">{error}</p>}
    <label className="grid gap-2">{t.titleField}<input required maxLength={120} value={title} onChange={event => { setTitle(event.target.value); clearFieldError("title"); }} aria-invalid={Boolean(fieldErrors.title)} aria-describedby={fieldErrors.title ? "title-error" : undefined} className={input}/>{fieldMessage("title")}</label>
    <label className="grid gap-2">{t.description}<textarea required maxLength={1000} value={description} onChange={event => { setDescription(event.target.value); clearFieldError("description"); }} aria-invalid={Boolean(fieldErrors.description)} aria-describedby={fieldErrors.description ? "description-error" : undefined} rows={4} className={input}/>{fieldMessage("description")}</label>
    <label className="grid gap-2">{t.category}<select value={category} onChange={event => { setCategory(event.target.value); clearFieldError("category"); }} aria-invalid={Boolean(fieldErrors.category)} aria-describedby={fieldErrors.category ? "category-error" : undefined} className={input}>{categories.map(value => <option key={value}>{value}</option>)}</select>{fieldMessage("category")}</label>
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="grid gap-2">{t.price}<input type="number" min="1" max="2000" step="0.01" required value={price} onChange={event => { setPrice(event.target.value); clearFieldError("priceMinor"); }} aria-invalid={Boolean(fieldErrors.priceMinor)} aria-describedby={fieldErrors.priceMinor ? "priceMinor-error" : undefined} className={input}/>{fieldMessage("priceMinor")}</label>
      <label className="grid gap-2">{t.originalPrice}<input type="number" min="1" max="2000" step="0.01" value={originalPrice} onChange={event => { setOriginalPrice(event.target.value); clearFieldError("originalPriceMinor"); }} aria-invalid={Boolean(fieldErrors.originalPriceMinor)} aria-describedby={fieldErrors.originalPriceMinor ? "originalPriceMinor-error" : undefined} className={input}/>{fieldMessage("originalPriceMinor")}</label>
      <label className="grid gap-2">{t.quantity}<input type="number" min="1" max="500" required value={quantity} onChange={event => { setQuantity(event.target.value); clearFieldError("quantityTotal"); }} aria-invalid={Boolean(fieldErrors.quantityTotal)} aria-describedby={fieldErrors.quantityTotal ? "quantityTotal-error" : undefined} className={input}/>{fieldMessage("quantityTotal")}</label>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2">{t.pickupStart}<input type="datetime-local" value={pickupStart} onChange={event => { setPickupStart(event.target.value); clearFieldError("pickupStart"); }} aria-invalid={Boolean(fieldErrors.pickupStart)} aria-describedby={fieldErrors.pickupStart ? "pickupStart-error" : undefined} className={input}/>{fieldMessage("pickupStart")}</label>
      <label className="grid gap-2">{t.pickupEnd}<input type="datetime-local" value={pickupEnd} onChange={event => { setPickupEnd(event.target.value); clearFieldError("pickupEnd"); }} aria-invalid={Boolean(fieldErrors.pickupEnd)} aria-describedby={fieldErrors.pickupEnd ? "pickupEnd-error" : undefined} className={input}/>{fieldMessage("pickupEnd")}</label>
    </div>
    <fieldset className="grid gap-3">
      <legend className="font-bold">{t.allergens}</legend>
      <label className="flex items-center gap-2"><input type="checkbox" checked={allergensUnknown} onChange={event => { setAllergensUnknown(event.target.checked); clearFieldError("allergensStatus"); clearFieldError("allergens"); }}/>{t.unknown}</label>
      {!allergensUnknown && <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{allergens.map(value => <label key={value} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={allergenCodes.includes(value)} onChange={event => { setAllergenCodes(current => event.target.checked ? [...current, value] : current.filter(item => item !== value)); clearFieldError("allergens"); }}/>{value}</label>)}</div>}
      {fieldMessage("allergensStatus")}{fieldMessage("allergens")}
    </fieldset>
    <label className="grid gap-2">{t.foodNotes}<textarea maxLength={500} rows={2} value={foodNotes} onChange={event => { setFoodNotes(event.target.value); clearFieldError("foodNotes"); }} aria-invalid={Boolean(fieldErrors.foodNotes)} aria-describedby={fieldErrors.foodNotes ? "foodNotes-error" : undefined} className={input}/>{fieldMessage("foodNotes")}</label>
    <div className="flex flex-wrap items-center gap-3">
      <button disabled={saving} className="rounded-xl bg-forest-700 px-5 py-3 font-extrabold text-white">{offerId ? t.save : t.create}</button>
      <Link href={`/${locale}/merchant/offers`} className="px-3 py-3 underline">{t.back}</Link>
      {offerId && offer?.status === "PUBLISHED" && <button type="button" disabled={saving} onClick={() => void action("unpublish")} className="rounded-xl bg-sun-500 px-4 py-3 font-extrabold">{t.unpublish}</button>}
      {offerId && (offer?.status === "DRAFT" || offer?.status === "UNPUBLISHED") && <button type="button" disabled={saving} onClick={() => void action("publish")} className="rounded-xl bg-sun-500 px-4 py-3 font-extrabold">{t.publish}</button>}
      {offerId && <button type="button" disabled={saving} onClick={() => void action("duplicate")} className="rounded-xl border px-4 py-3">{t.duplicate}</button>}
      {offerId && offer?.status === "DRAFT" && <button type="button" disabled={saving} onClick={() => void action("cancel")} className="rounded-xl border border-tomato-200 px-4 py-3 text-tomato-600">{t.cancel}</button>}
    </div>
  </form></>;
}
