"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { offerCopy } from "@/lib/i18n/offer-copy";
import { offerCategories, offerCategoryLabel } from "@/lib/offers/public-copy";
import { localePath } from "@/lib/navigation";
import { casablancaLocalToUtc, utcToCasablancaLocal } from "@/lib/time/casablanca";
import { idempotencyEntry, type IdempotencyEntry } from "@/lib/offers/idempotency";
import { allergenPayload, DEFAULT_ALLERGENS_STATUS } from "@/lib/offers/allergens";
import { validateOfferDraft } from "@/lib/offers/form-validation";
import { parseOfferProblem } from "@/lib/offers/problem";
import { SubmitProgress } from "@/components/auth/SubmitProgress";
import { OfferDetailSkeleton, OfferFormSkeleton } from "./OfferSkeletons";
import { PriceSticker } from "@/components/ui/PriceSticker";

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

const categories = offerCategories;
const allergens = ["GLUTEN", "CRUSTACEANS", "EGGS", "FISH", "PEANUTS", "SOY", "MILK", "NUTS", "CELERY", "MUSTARD", "SESAME", "SULPHITES", "LUPIN", "MOLLUSCS"];

export function OfferForm({ locale, offerId }: { locale: string; offerId?: string }) {
  const t = offerCopy(locale);
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  // Loading is derived from which request has settled, so editing a different offer or retrying
  // counts as loading again without calling setState synchronously inside the effect.
  const requestKey = offerId ? `${offerId}:${loadAttempt}` : null;
  const [settled, setSettled] = useState<{ key: string; failed: boolean } | null>(null);
  const loading = requestKey !== null && settled?.key !== requestKey;
  const loadError = requestKey !== null && settled?.key === requestKey && settled.failed;
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
    if (!offerId || requestKey === null) return;
    const controller = new AbortController();
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
        setSettled({ key: requestKey, failed: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setSettled({ key: requestKey, failed: true });
      });
    return () => controller.abort();
  }, [offerId, requestKey]);

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
      router.push(localePath(locale as "fr" | "en" | "ar", `/merchant/offers/${saved.id}`));
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
        router.push(localePath(locale as "fr" | "en" | "ar", "/merchant/offers"));
        return;
      }
      const result = await response.json() as Offer;
      if (name === "duplicate") {
        duplicateKey.current = null;
        router.push(localePath(locale as "fr" | "en" | "ar", `/merchant/offers/${result.id}`));
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
      <Link href={locale === "fr" ? "/merchant/offers" : `/${locale}/merchant/offers`} className="px-3 py-3 underline">{t.back}</Link>
    </div>
  </section>;

  const input = "mw-input";
  const previewPriceMinor = price.trim() && Number.isFinite(Number(price)) && Number(price) > 0
    ? Math.round(Number(price) * 100)
    : null;
  const previewOriginalPriceMinor = originalPrice.trim() && Number.isFinite(Number(originalPrice)) && Number(originalPrice) > 0
    ? Math.round(Number(originalPrice) * 100)
    : null;
  const pricePreviewLabel = locale === "ar" ? "معاينة السعر" : locale === "en" ? "Price preview" : "Aperçu du prix";
  const previewLabels = {
    eyebrow: locale === "ar" ? "ما سيراه العملاء" : locale === "en" ? "WHAT CUSTOMERS WILL SEE" : "APERÇU CÔTÉ CLIENT",
    shop: locale === "ar" ? "متجرك" : locale === "en" ? "Your shop" : "Votre commerce",
    placeholder: locale === "ar" ? "سلة مفاجآت" : locale === "en" ? "Surprise basket" : "Panier surprise",
    pickup: locale === "ar" ? "موعد الاستلام" : locale === "en" ? "Pickup" : "Retrait",
    left: locale === "ar" ? "متبقية" : locale === "en" ? "left" : "restants",
    food: locale === "ar" ? "معلومات الطعام" : locale === "en" ? "Food information" : "Informations alimentaires",
    discount: locale === "ar" ? "تخفيض" : locale === "en" ? "off" : "de remise",
    pickupMissing: locale === "ar" ? "حدد موعد الاستلام" : locale === "en" ? "Choose a pickup window" : "Choisissez un créneau de retrait",
  };
  const previewQuantity = Math.max(0, (Number(quantity) || 0) - (offer?.quantityReserved ?? 0));
  const previewDiscount = previewPriceMinor !== null && previewOriginalPriceMinor !== null && previewOriginalPriceMinor > previewPriceMinor
    ? Math.round((1 - previewPriceMinor / previewOriginalPriceMinor) * 100)
    : null;
  const previewPickup = pickupStart && pickupEnd
    ? pickupStart.slice(0, 10) + " · " + pickupStart.slice(11, 16) + "–" + pickupEnd.slice(11, 16)
    : previewLabels.pickupMissing;
  return <><SubmitProgress title={t.saving} detail={t.pleaseWait} active={saving}/><div className="mw-offer-editor-layout"><form onSubmit={submit} className="mw-form mw-form-card mw-card" aria-busy={saving}>
    {error && <p role="alert" className="rounded-xl bg-tomato-50 p-3 text-tomato-600">{error}</p>}
    <label className="mw-field">{t.titleField}<input required maxLength={120} value={title} onChange={event => { setTitle(event.target.value); clearFieldError("title"); }} aria-invalid={Boolean(fieldErrors.title)} aria-describedby={fieldErrors.title ? "title-error" : undefined} className={input}/>{fieldMessage("title")}</label>
    <label className="mw-field">{t.description}<textarea required maxLength={1000} value={description} onChange={event => { setDescription(event.target.value); clearFieldError("description"); }} aria-invalid={Boolean(fieldErrors.description)} aria-describedby={fieldErrors.description ? "description-error" : undefined} rows={4} className={input}/>{fieldMessage("description")}</label>
    <label className="mw-field">{t.category}<select value={category} onChange={event => { setCategory(event.target.value); clearFieldError("category"); }} aria-invalid={Boolean(fieldErrors.category)} aria-describedby={fieldErrors.category ? "category-error" : undefined} className={input}>{categories.map(value => <option key={value} value={value}>{offerCategoryLabel(locale as "fr" | "en" | "ar", value)}</option>)}</select>{fieldMessage("category")}</label>
    <div className="mw-grid sm:grid-cols-3">
      <label className="mw-field">{t.price}<input type="number" min="1" max="2000" step="0.01" required value={price} onChange={event => { setPrice(event.target.value); clearFieldError("priceMinor"); }} aria-invalid={Boolean(fieldErrors.priceMinor)} aria-describedby={fieldErrors.priceMinor ? "priceMinor-error" : undefined} className={input}/>{fieldMessage("priceMinor")}</label>
      <label className="mw-field">{t.originalPrice}<input type="number" min="1" max="2000" step="0.01" value={originalPrice} onChange={event => { setOriginalPrice(event.target.value); clearFieldError("originalPriceMinor"); }} aria-invalid={Boolean(fieldErrors.originalPriceMinor)} aria-describedby={fieldErrors.originalPriceMinor ? "originalPriceMinor-error" : undefined} className={input}/>{fieldMessage("originalPriceMinor")}</label>
      <label className="mw-field">{t.quantity}<input type="number" min="1" max="500" required value={quantity} onChange={event => { setQuantity(event.target.value); clearFieldError("quantityTotal"); }} aria-invalid={Boolean(fieldErrors.quantityTotal)} aria-describedby={fieldErrors.quantityTotal ? "quantityTotal-error" : undefined} className={input}/>{fieldMessage("quantityTotal")}</label>
    </div>
    {previewPriceMinor !== null && <div className="mw-price-preview" aria-live="polite">
      <span>{pricePreviewLabel}</span>
      <PriceSticker priceMinor={previewPriceMinor} originalPriceMinor={previewOriginalPriceMinor} locale={locale as "fr" | "en" | "ar"} size="md" />
    </div>}
    <div className="mw-grid sm:grid-cols-2">
      <label className="mw-field">{t.pickupStart}<input type="datetime-local" value={pickupStart} onChange={event => { setPickupStart(event.target.value); clearFieldError("pickupStart"); }} aria-invalid={Boolean(fieldErrors.pickupStart)} aria-describedby={fieldErrors.pickupStart ? "pickupStart-error" : undefined} className={input}/>{fieldMessage("pickupStart")}</label>
      <label className="mw-field">{t.pickupEnd}<input type="datetime-local" value={pickupEnd} onChange={event => { setPickupEnd(event.target.value); clearFieldError("pickupEnd"); }} aria-invalid={Boolean(fieldErrors.pickupEnd)} aria-describedby={fieldErrors.pickupEnd ? "pickupEnd-error" : undefined} className={input}/>{fieldMessage("pickupEnd")}</label>
    </div>
    <fieldset className="mw-stack">
      <legend className="font-bold">{t.allergens}</legend>
      <label className="flex items-center gap-2"><input type="checkbox" checked={allergensUnknown} onChange={event => { setAllergensUnknown(event.target.checked); clearFieldError("allergensStatus"); clearFieldError("allergens"); }}/>{t.unknown}</label>
      {!allergensUnknown && <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{allergens.map(value => <label key={value} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={allergenCodes.includes(value)} onChange={event => { setAllergenCodes(current => event.target.checked ? [...current, value] : current.filter(item => item !== value)); clearFieldError("allergens"); }}/>{value}</label>)}</div>}
      {fieldMessage("allergensStatus")}{fieldMessage("allergens")}
    </fieldset>
    <label className="mw-field">{t.foodNotes}<textarea maxLength={500} rows={2} value={foodNotes} onChange={event => { setFoodNotes(event.target.value); clearFieldError("foodNotes"); }} aria-invalid={Boolean(fieldErrors.foodNotes)} aria-describedby={fieldErrors.foodNotes ? "foodNotes-error" : undefined} className={input}/>{fieldMessage("foodNotes")}</label>
    <div className="mw-actions-row">
      <button disabled={saving} className="mw-primary-action">{offerId ? t.save : t.create}</button>
      <Link href={locale === "fr" ? "/merchant/offers" : `/${locale}/merchant/offers`} className="px-3 py-3 underline">{t.back}</Link>
      {offerId && offer?.status === "PUBLISHED" && <button type="button" disabled={saving} onClick={() => void action("unpublish")} className="mw-action">{t.unpublish}</button>}
      {offerId && (offer?.status === "DRAFT" || offer?.status === "UNPUBLISHED") && <button type="button" disabled={saving} onClick={() => void action("publish")} className="mw-action">{t.publish}</button>}
      {offerId && <button type="button" disabled={saving} onClick={() => void action("duplicate")} className="mw-action">{t.duplicate}</button>}
      {offerId && offer?.status === "DRAFT" && <button type="button" disabled={saving} onClick={() => void action("cancel")} className="mw-action mw-error">{t.cancel}</button>}
    </div>
  </form>
  <aside className="mw-offer-customer-preview">
    <p className="mw-offer-preview-eyebrow">{previewLabels.eyebrow}</p>
    <article className="mw-offer-preview-card">
      <div className="mw-offer-preview-art">
        <span className="mw-offer-preview-bag" aria-hidden="true">▱</span>
        {previewDiscount !== null && <span className="mw-offer-preview-discount">-{previewDiscount}%</span>}
        {previewPriceMinor !== null && <PriceSticker priceMinor={previewPriceMinor} originalPriceMinor={previewOriginalPriceMinor} locale={locale as "fr" | "en" | "ar"} size="md" />}
      </div>
      <div className="mw-offer-preview-copy">
        <small>{previewLabels.shop}</small>
        <h2>{title.trim() || previewLabels.placeholder}</h2>
        {description.trim() && <p>{description}</p>}
        <div className="mw-offer-preview-meta"><span>{previewPickup}</span><strong>{previewQuantity} {previewLabels.left}</strong></div>
        <div className="mw-offer-preview-food"><span>{previewLabels.food}</span><strong>{allergensUnknown ? t.unknown : allergenCodes.length ? allergenCodes.join(" · ") : t.unknown}</strong></div>
      </div>
    </article>
  </aside>
  </div></>;
}
