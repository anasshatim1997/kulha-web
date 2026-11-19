"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api/client";
import { useSession } from "@/components/session/SessionProvider";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import type { Reservation } from "@/lib/reservations/types";
import styles from "./ReservationScanner.module.css";

type Hit = { rawValue: string };
type Detector = { detect(video: HTMLVideoElement): Promise<Hit[]> };
type DetectorCtor = new (options: { formats: string[] }) => Detector;

const copy = {
  fr: { title:"Scanner un retrait", intro:"Scannez le QR du client ou saisissez son code.", start:"Ouvrir la caméra", stop:"Fermer", manual:"Saisie manuelle", ref:"Référence de réservation", code:"Code de retrait", collect:"Valider le retrait", loading:"Validation…", success:"Panier remis au client", another:"Scanner un autre panier", camera:"Caméra indisponible. Vérifiez les permissions ou utilisez la saisie manuelle.", unsupported:"Le scan QR n’est pas pris en charge sur cet appareil.", invalid:"QR ou code invalide, déjà utilisé ou hors du créneau.", forbidden:"Réservé aux comptes commerçants.", loadingPage:"Chargement…" },
  en: { title:"Pickup scanner", intro:"Scan the customer's QR or enter their pickup code.", start:"Open camera", stop:"Close", manual:"Manual entry", ref:"Reservation reference", code:"Pickup code", collect:"Confirm collection", loading:"Validating…", success:"Basket handed to customer", another:"Scan another basket", camera:"Camera unavailable. Check permissions or use manual entry.", unsupported:"QR scanning is not supported on this device.", invalid:"QR or code is invalid, already used, or outside the pickup window.", forbidden:"Available to merchant accounts only.", loadingPage:"Loading…" },
  ar: { title:"ماسح الاستلام", intro:"امسح رمز QR الخاص بالزبون أو أدخل رمز الاستلام.", start:"فتح الكاميرا", stop:"إغلاق", manual:"إدخال يدوي", ref:"مرجع الحجز", code:"رمز الاستلام", collect:"تأكيد الاستلام", loading:"جارٍ التحقق…", success:"تم تسليم السلة للزبون", another:"مسح سلة أخرى", camera:"الكاميرا غير متاحة. تحقق من الأذونات أو استخدم الإدخال اليدوي.", unsupported:"مسح QR غير مدعوم على هذا الجهاز.", invalid:"رمز QR أو الاستلام غير صالح أو سبق استخدامه أو انتهى موعد الاستلام.", forbidden:"متاح لحسابات التجار فقط.", loadingPage:"جارٍ التحميل…" },
} as const;

export function ReservationScanner({ locale }: { locale: SiteLocale }) {
  const t=copy[locale]??copy.en;
  const {state}=useSession();
  const video=useRef<HTMLVideoElement>(null);
  const busy=useRef(false);
  const [stream,setStream]=useState<MediaStream|null>(null);
  const [cameraError,setCameraError]=useState("");
  const [message,setMessage]=useState("");
  const [working,setWorking]=useState(false);
  const [reference,setReference]=useState("");
  const [pickupCode,setPickupCode]=useState("");
  const [result,setResult]=useState<Reservation|null>(null);

  const stop=useCallback(()=>setStream(current=>{current?.getTracks().forEach(track=>track.stop());return null;}),[]);
  const collect=useCallback(async (body:{qrPayload:string}|{reference:string;pickupCode:string})=>{
    if(busy.current)return;
    busy.current=true;setWorking(true);setMessage("");
    try {
      const value=await api.post<Reservation>("/reservations/collect",body);
      setResult(value);setReference("");setPickupCode("");stop();
    } catch {setMessage(t.invalid);stop();}
    finally {busy.current=false;setWorking(false);}
  },[stop,t.invalid]);

  async function start(){
    setCameraError("");
    const Detector=(window as unknown as {BarcodeDetector?:DetectorCtor}).BarcodeDetector;
    if(!Detector){setCameraError(t.unsupported);return;}
    if(!navigator.mediaDevices?.getUserMedia){setCameraError(t.camera);return;}
    try { setStream(await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:"environment"}}})); }
    catch {setCameraError(t.camera);}
  }

  useEffect(()=>{
    if(!stream||!video.current)return;
    const element=video.current;
    const Detector=(window as unknown as {BarcodeDetector?:DetectorCtor}).BarcodeDetector;
    if(!Detector)return;
    const detector=new Detector({formats:["qr_code"]});
    let active=true;let raf=0;
    element.srcObject=stream;
    void element.play().then(()=>{
      const scan=async()=>{
        if(!active)return;
        try {
          if(element.readyState>=2){
            const hit=(await detector.detect(element)).find(item=>item.rawValue.startsWith("KULHA1:"));
            if(hit){active=false;void collect({qrPayload:hit.rawValue});return;}
          }
        } catch {if(active)setCameraError(t.camera);}
        if(active)raf=requestAnimationFrame(()=>void scan());
      };
      raf=requestAnimationFrame(()=>void scan());
    }).catch(()=>{if(active)setCameraError(t.camera);});
    return ()=>{active=false;cancelAnimationFrame(raf);stream.getTracks().forEach(track=>track.stop());if(element.srcObject===stream)element.srcObject=null;};
  },[stream,collect,t.camera]);

  if(state.status==="loading")return <main className={styles.page}>{t.loadingPage}</main>;
  if(state.status!=="authenticated"||!state.user.roles.includes("MERCHANT"))return <main className={styles.page} lang={locale} dir={locale==="ar"?"rtl":"ltr"}><p role="alert">{t.forbidden}</p></main>;

  return <main className={styles.page} lang={locale} dir={locale==="ar"?"rtl":"ltr"}>
    <header className={styles.header}><h1>{t.title}</h1><p>{t.intro}</p></header>
    {result?<section className={styles.success} role="status"><strong>✓</strong><h2>{t.success}</h2><p>{result.offerTitle} · {result.reference}</p><button type="button" onClick={()=>setResult(null)}>{t.another}</button></section>:<div className={styles.grid}>
      <section className={styles.cameraCard}><div className={styles.videoFrame}>{stream?<video ref={video} muted playsInline/>:<span aria-hidden="true">▦</span>}</div>{stream?<button className={styles.secondaryButton} type="button" onClick={stop}>{t.stop}</button>:<button className={styles.primaryButton} type="button" onClick={()=>void start()}>{t.start}</button>}{cameraError&&<p role="alert">{cameraError}</p>}</section>
      <section className={styles.manualCard}><h2>{t.manual}</h2><label><span>{t.ref}</span><input value={reference} onChange={e=>setReference(e.target.value.toUpperCase().slice(0,40))}/></label><label><span>{t.code}</span><input value={pickupCode} onChange={e=>setPickupCode(e.target.value.toUpperCase().slice(0,12))}/></label>{message&&<p role="alert">{message}</p>}<button className={styles.primaryButton} type="button" disabled={working||!reference.trim()||!pickupCode.trim()} onClick={()=>void collect({reference,pickupCode})}>{working?t.loading:t.collect}</button></section>
    </div>}
  </main>;
}
