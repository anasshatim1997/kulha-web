"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { api } from "@/lib/api/client";
import { useSession } from "@/components/session/SessionProvider";
import type { Reservation } from "@/lib/reservations/types";
import styles from "./PickupScanner.module.css";

type DetectedBarcode = { rawValue: string };
type QrDetector = { detect(source: HTMLVideoElement): Promise<DetectedBarcode[]> };
type QrDetectorConstructor = new (options: { formats: string[] }) => QrDetector;

const copy = {
  fr: {
    title: "Scanner un retrait",
    subtitle: "Scannez le QR du client ou saisissez son code de retrait.",
    camera: "Ouvrir la caméra",
    stopCamera: "Fermer la caméra",
    cameraUnsupported: "La lecture QR par caméra n’est pas prise en charge par ce navigateur. Utilisez le code manuel.",
    cameraDenied: "L’accès à la caméra est impossible. Vérifiez l’autorisation du navigateur ou utilisez le code manuel.",
    manualTitle: "Saisie manuelle",
    reference: "Référence de réservation",
    code: "Code de retrait",
    submit: "Valider le retrait",
    submitting: "Validation…",
    success: "Retrait confirmé",
    successBody: "Cette réservation est maintenant marquée comme récupérée.",
    error: "Impossible de valider ce retrait. Vérifiez le QR ou le code et réessayez.",
    next: "Scanner un autre retrait",
    basket: "Panier",
    done: "Récupéré",
  },
  en: {
    title: "Scan a pickup",
    subtitle: "Scan the customer's QR code or enter their pickup code.",
    camera: "Open camera",
    stopCamera: "Close camera",
    cameraUnsupported: "QR camera scanning is not supported by this browser. Use the manual code instead.",
    cameraDenied: "Camera access failed. Check your browser permission or use the manual code.",
    manualTitle: "Manual entry",
    reference: "Reservation reference",
    code: "Pickup code",
    submit: "Confirm collection",
    submitting: "Confirming…",
    success: "Pickup confirmed",
    successBody: "This reservation is now marked as collected.",
    error: "Could not confirm this pickup. Check the QR or code and try again.",
    next: "Scan another pickup",
    basket: "Basket",
    done: "Collected",
  },
  ar: {
    title: "مسح رمز الاستلام",
    subtitle: "امسح رمز QR الخاص بالزبون أو أدخل رمز الاستلام يدوياً.",
    camera: "فتح الكاميرا",
    stopCamera: "إغلاق الكاميرا",
    cameraUnsupported: "مسح QR بالكاميرا غير مدعوم في هذا المتصفح. استخدم الإدخال اليدوي.",
    cameraDenied: "تعذر الوصول إلى الكاميرا. تحقق من أذونات المتصفح أو استخدم الإدخال اليدوي.",
    manualTitle: "إدخال يدوي",
    reference: "مرجع الحجز",
    code: "رمز الاستلام",
    submit: "تأكيد الاستلام",
    submitting: "جارٍ التأكيد…",
    success: "تم تأكيد الاستلام",
    successBody: "تم الآن تسجيل هذا الحجز كمستلم.",
    error: "تعذر تأكيد الاستلام. تحقق من الرمز وحاول مجدداً.",
    next: "مسح حجز آخر",
    basket: "السلة",
    done: "تم الاستلام",
  },
} as const;

export function PickupScanner({ locale }: { locale: SiteLocale }) {
  const t = copy[locale] ?? copy.en;
  const { state } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const detectorRef = useRef<QrDetector | null>(null);
  const scanningRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [pickupCode, setPickupCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [collected, setCollected] = useState<Reservation | null>(null);

  function stopCamera() {
    scanningRef.current = false;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    detectorRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  }

  useEffect(() => () => {
    scanningRef.current = false;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function submitQrToken(rawValue: string) {
    setSubmitting(true);
    setError(false);
    try {
      const value = await api.post<Reservation>("/reservations/collect", { token: rawValue });
      setCollected(value);
      stopCamera();
    } catch {
      setError(true);
      stopCamera();
    } finally {
      setSubmitting(false);
    }
  }

  async function scanFrame() {
    if (!scanningRef.current || !videoRef.current || !detectorRef.current) return;
    try {
      const results = await detectorRef.current.detect(videoRef.current);
      const rawValue = results.find((item) => item.rawValue)?.rawValue;
      if (rawValue) {
        scanningRef.current = false;
        await submitQrToken(rawValue);
        return;
      }
    } catch {
      setCameraError(t.cameraDenied);
      stopCamera();
      return;
    }
    if (scanningRef.current) frameRef.current = requestAnimationFrame(() => void scanFrame());
  }

  async function startCamera() {
    setCameraError(null);
    setError(false);
    try {
      const Detector = (window as Window & { BarcodeDetector?: QrDetectorConstructor }).BarcodeDetector;
      if (!Detector) {
        setCameraError(t.cameraUnsupported);
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(t.cameraUnsupported);
        return;
      }
      const detector = new Detector({ formats: ["qr_code"] });
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      detectorRef.current = detector;
      if (!videoRef.current) {
        stopCamera();
        return;
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      scanningRef.current = true;
      setScanning(true);
      frameRef.current = requestAnimationFrame(() => void scanFrame());
    } catch {
      setCameraError(t.cameraDenied);
      stopCamera();
    }
  }

  async function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(false);
    try {
      const value = await api.post<Reservation>("/reservations/collect", {
        reference: reference.trim(),
        pickupCode: pickupCode.trim().toUpperCase(),
      });
      setCollected(value);
      setReference("");
      setPickupCode("");
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setCollected(null);
    setError(false);
    setCameraError(null);
    setReference("");
    setPickupCode("");
  }

  if (state.status === "loading") {
    return <main className={styles.page} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><p aria-live="polite">…</p></main>;
  }
  if (state.status !== "authenticated" || !state.user.roles.includes("MERCHANT")) {
    return <main className={styles.page} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><div className={styles.stateCard} role="alert">{locale === "ar" ? "هذه الصفحة مخصصة للمتاجر." : locale === "fr" ? "Cette page est réservée aux commerçants." : "This page is for shop accounts only."}</div></main>;
  }

  return (
    <main className={styles.page} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>KULHA! · {locale === "ar" ? "مساحة المتجر" : locale === "fr" ? "ESPACE COMMERÇANT" : "SHOP WORKSPACE"}</p>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </header>

      {collected ? (
        <section className={styles.successCard} role="status">
          <span className={styles.successIcon} aria-hidden="true">✓</span>
          <h2>{t.success}</h2>
          <p>{t.successBody}</p>
          <dl>
            <div><dt>{t.reference}</dt><dd>{collected.reference}</dd></div>
            <div><dt>{t.basket}</dt><dd>{collected.offerTitle}</dd></div>
            <div><dt>{t.done}</dt><dd>{collected.statusLabel}</dd></div>
          </dl>
          <button type="button" className={styles.primaryButton} onClick={reset}>{t.next}</button>
        </section>
      ) : (
        <div className={styles.grid}>
          <section className={styles.cameraCard}>
            <div className={styles.cardHeading}>
              <h2>{locale === "ar" ? "كاميرا QR" : locale === "fr" ? "Scanner QR" : "QR scanner"}</h2>
              {!scanning
                ? <button type="button" className={styles.secondaryButton} onClick={() => void startCamera()}>{t.camera}</button>
                : <button type="button" className={styles.secondaryButton} onClick={stopCamera}>{t.stopCamera}</button>}
            </div>
            <div className={styles.videoFrame}>
              <video ref={videoRef} muted playsInline aria-label={t.title} />
              {!scanning && <span className={styles.cameraPlaceholder} aria-hidden="true">▦</span>}
            </div>
            {cameraError && <p className={styles.helperError} role="status">{cameraError}</p>}
            {scanning && <p className={styles.scanningText} role="status">{t.camera}</p>}
          </section>

          <section className={styles.manualCard}>
            <h2>{t.manualTitle}</h2>
            <form onSubmit={(event) => void submitManual(event)}>
              <label>
                <span>{t.reference}</span>
                <input value={reference} onChange={(event) => setReference(event.target.value)} autoComplete="off" required />
              </label>
              <label>
                <span>{t.code}</span>
                <input value={pickupCode} onChange={(event) => setPickupCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} autoComplete="one-time-code" minLength={6} maxLength={6} pattern="[A-Za-z0-9]{6}" required />
              </label>
              {error && <p className={styles.error} role="alert">{t.error}</p>}
              <button type="submit" className={styles.primaryButton} disabled={submitting || reference.trim().length === 0 || pickupCode.length !== 6}>{submitting ? t.submitting : t.submit}</button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
