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
type PickupPayload = { qrPayload: string } | { reference: string; pickupCode: string };
type PickupPreview = {
  reference:string; merchantName:string; offerTitle:string; quantity:number;
  totalPriceMinor:number; currency:string; pickupStart:string; pickupEnd:string;
  status:string; validationState:"VALID"|"ALREADY_COLLECTED"|"WINDOW_NOT_OPEN"|"WINDOW_ENDED"|"NOT_VALID";
  canConfirm:boolean;
};

const copy = {
 fr:{title:"Scanner un retrait",intro:"Scannez le QR du client ou saisissez son code.",start:"Ouvrir la caméra",stop:"Fermer",manual:"Saisie manuelle",ref:"Référence de réservation",code:"Code de retrait",check:"Vérifier le code",confirm:"Confirmer la remise",loadingCheck:"Vérification…",loadingConfirm:"Confirmation…",success:"Panier remis au client",another:"Scanner un autre panier",camera:"Caméra indisponible. Vérifiez les permissions ou utilisez la saisie manuelle.",unsupported:"Le scan QR n’est pas pris en charge sur cet appareil.",invalid:"Code invalide ou réservation introuvable pour cette boutique.",expired:"Le créneau est terminé. Le panier n’a pas été remis.",forbidden:"Réservé aux comptes commerçants.",loadingPage:"Chargement…",valid:"Retrait valide",window:"Créneau ouvert · ce code ne fonctionne qu’une fois",already:"Déjà récupéré",alreadyDetail:"Ce retrait a déjà été confirmé.",notOpen:"Créneau pas encore ouvert",notOpenDetail:"Ce panier pourra être récupéré à",ended:"Créneau terminé",notValid:"Réservation non disponible pour ce retrait",reference:"Référence",basket:"Panier",pickup:"Créneau de retrait",counter:"À encaisser au comptoir",status:"Statut",customer:"Client",cancel:"Annuler la vérification"},
 en:{title:"Validate a pickup",intro:"Scan the customer's QR code or enter the 4-character pickup code.",start:"Open camera",stop:"Close",manual:"Manual entry",ref:"Reservation reference",code:"Pickup code",check:"Check code",confirm:"Confirm handover",loadingCheck:"Checking…",loadingConfirm:"Confirming…",success:"Basket handed to customer",another:"Scan another basket",camera:"Camera unavailable. Check permissions or use manual entry.",unsupported:"QR scanning is not supported on this device.",invalid:"Code not found for a reservation at your shop.",expired:"The pickup window has expired. The basket was not collected.",forbidden:"Available to merchant accounts only.",loadingPage:"Loading…",valid:"Valid pickup",window:"Window is open · this code works once",already:"Already collected",alreadyDetail:"This pickup was already confirmed.",notOpen:"Pickup window not open yet",notOpenDetail:"This basket can be collected from",ended:"Pickup window ended",notValid:"This reservation is not available for pickup",reference:"Reference",basket:"Basket",pickup:"Pickup window",counter:"Collect at the counter",status:"Status",customer:"Customer",cancel:"Clear check"},
 ar:{title:"تأكيد الاستلام",intro:"امسح رمز QR الخاص بالزبون أو أدخل رمز الاستلام المكوّن من أربعة أحرف.",start:"فتح الكاميرا",stop:"إغلاق",manual:"إدخال يدوي",ref:"مرجع الحجز",code:"رمز الاستلام",check:"التحقق من الرمز",confirm:"تأكيد التسليم",loadingCheck:"جارٍ التحقق…",loadingConfirm:"جارٍ التأكيد…",success:"تم تسليم السلة للزبون",another:"مسح سلة أخرى",camera:"الكاميرا غير متاحة. تحقق من الأذونات أو استخدم الإدخال اليدوي.",unsupported:"مسح QR غير مدعوم على هذا الجهاز.",invalid:"الرمز غير صالح أو الحجز غير موجود في متجرك.",expired:"انتهى موعد الاستلام. لم يتم تسليم السلة.",forbidden:"متاح لحسابات التجار فقط.",loadingPage:"جارٍ التحميل…",valid:"استلام صالح",window:"موعد الاستلام مفتوح · يعمل هذا الرمز مرة واحدة",already:"تم الاستلام مسبقاً",alreadyDetail:"تم تأكيد هذا الاستلام من قبل.",notOpen:"موعد الاستلام لم يبدأ بعد",notOpenDetail:"يمكن استلام هذه السلة ابتداءً من",ended:"انتهى موعد الاستلام",notValid:"هذا الحجز غير متاح للاستلام",reference:"المرجع",basket:"السلة",pickup:"موعد الاستلام",counter:"المبلغ عند المتجر",status:"الحالة",customer:"الزبون",cancel:"إلغاء التحقق"},
} as const;

function money(minor:number,locale:SiteLocale){return new Intl.NumberFormat(locale==="ar"?"ar-MA":locale==="en"?"en-MA":"fr-MA",{style:"currency",currency:"MAD",maximumFractionDigits:2}).format(minor/100);}
function dateTime(value:string,locale:SiteLocale){return new Intl.DateTimeFormat(locale==="ar"?"ar-MA":locale==="en"?"en-MA":"fr-MA",{timeZone:"Africa/Casablanca",hour:"2-digit",minute:"2-digit"}).format(new Date(value));}

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
 const [pendingPayload,setPendingPayload]=useState<PickupPayload|null>(null);
 const [preview,setPreview]=useState<PickupPreview|null>(null);
 const [result,setResult]=useState<Reservation|null>(null);

 const stop=useCallback(()=>setStream(current=>{current?.getTracks().forEach(track=>track.stop());return null;}),[]);
 const checkPickup=useCallback(async(payload:PickupPayload)=>{
  if(busy.current)return;
  busy.current=true;setWorking(true);setMessage("");setPreview(null);setPendingPayload(null);
  try{
   const found=await api.post<PickupPreview>("/reservations/pickup/check",payload);
   setPreview(found);setPendingPayload(payload);
   if(found.validationState==="ALREADY_COLLECTED")setMessage(t.alreadyDetail);
   else if(found.validationState==="WINDOW_NOT_OPEN")setMessage(t.notOpenDetail+" "+dateTime(found.pickupStart,locale)+".");
   else if(found.validationState==="WINDOW_ENDED")setMessage(t.expired);
   else if(found.validationState==="NOT_VALID")setMessage(t.notValid);
  }catch{setMessage(t.invalid);}
  finally{stop();busy.current=false;setWorking(false);}
 },[locale,stop,t.alreadyDetail,t.notOpenDetail,t.expired,t.notValid,t.invalid]);

 const confirmPickup=useCallback(async()=>{
  if(!pendingPayload||!preview?.canConfirm||busy.current)return;
  busy.current=true;setWorking(true);setMessage("");
  try{
   const value=await api.post<Reservation>("/reservations/collect",pendingPayload);
   if(value.status!=="COMPLETED"){setMessage(t.expired);setPreview(null);setPendingPayload(null);return;}
   setResult(value);setReference("");setPickupCode("");setPreview(null);setPendingPayload(null);stop();
  }catch{setMessage(t.invalid);setPreview(null);setPendingPayload(null);stop();}
  finally{busy.current=false;setWorking(false);}
 },[pendingPayload,preview,stop,t.expired,t.invalid]);

 async function start(){
  setCameraError("");
  const Detector=(window as unknown as {BarcodeDetector?:DetectorCtor}).BarcodeDetector;
  if(!Detector){setCameraError(t.unsupported);return;}
  if(!navigator.mediaDevices?.getUserMedia){setCameraError(t.camera);return;}
  try{setStream(await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:"environment"}}}));}
  catch{setCameraError(t.camera);}
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
    try{
     if(element.readyState>=2){
      const hit=(await detector.detect(element)).find(item=>item.rawValue.startsWith("KULHA1:"));
      if(hit){active=false;void checkPickup({qrPayload:hit.rawValue});return;}
     }
    }catch{if(active)setCameraError(t.camera);}
    if(active)raf=requestAnimationFrame(()=>void scan());
   };
   raf=requestAnimationFrame(()=>void scan());
  }).catch(()=>{if(active)setCameraError(t.camera);});
  return()=>{active=false;cancelAnimationFrame(raf);stream.getTracks().forEach(track=>track.stop());if(element.srcObject===stream)element.srcObject=null;};
 },[stream,checkPickup,t.camera]);

 if(state.status==="loading")return <main className={styles.page}>{t.loadingPage}</main>;
 const canUseScanner=state.status==="authenticated"&&state.user.roles.some(role=>["MERCHANT","MERCHANT_OWNER","MERCHANT_STAFF"].includes(role));
 if(!canUseScanner)return <main className={styles.page} lang={locale} dir={locale==="ar"?"rtl":"ltr"}><p role="alert">{t.forbidden}</p></main>;

 return <main className={styles.page} lang={locale} dir={locale==="ar"?"rtl":"ltr"}>
  <header className={styles.header}><h1>{t.title}</h1><p>{t.intro}</p></header>
  {result?<section className={styles.success} role="status"><strong>✓</strong><h2>{t.success}</h2><p>{result.offerTitle} · {result.reference}</p><button type="button" onClick={()=>setResult(null)}>{t.another}</button></section>:<div className={styles.grid}>
   <section className={styles.cameraCard}><div className={styles.videoFrame}>{stream?<video ref={video} muted playsInline/>:<span aria-hidden="true">▦</span>}</div>
    {stream?<button className={styles.secondaryButton} type="button" onClick={stop}>{t.stop}</button>:<button className={styles.primaryButton} type="button" onClick={()=>void start()}>{t.start}</button>}
    {cameraError&&<p role="alert">{cameraError}</p>}
   </section>
   <section className={styles.manualCard}><h2>{t.manual}</h2>
    <label><span>{t.ref}</span><input value={reference} onChange={e=>setReference(e.target.value.toUpperCase().slice(0,40))} disabled={working||Boolean(preview)}/></label>
    <label><span>{t.code}</span><input value={pickupCode} onChange={e=>setPickupCode(e.target.value.toUpperCase().slice(0,12))} disabled={working||Boolean(preview)}/></label>
    {message&&<p role="alert">{message}</p>}
    {!preview?<button className={styles.primaryButton} type="button" disabled={working||!reference.trim()||!pickupCode.trim()} onClick={()=>void checkPickup({reference,pickupCode})}>{working?t.loadingCheck:t.check}</button>:<button className={styles.secondaryButton} type="button" disabled={working} onClick={()=>{setPreview(null);setPendingPayload(null);setMessage("");}}>{t.cancel}</button>}
   </section>
   {preview&&<section className={styles.previewCard} aria-live="polite">
    <div className={preview.canConfirm?styles.validBanner:styles.invalidBanner}><strong>{preview.canConfirm?t.valid:preview.validationState==="ALREADY_COLLECTED"?t.already:preview.validationState==="WINDOW_NOT_OPEN"?t.notOpen:preview.validationState==="WINDOW_ENDED"?t.ended:t.notValid}</strong><span>{preview.canConfirm?t.window:message}</span></div>
    <div className={styles.previewRows}>
     <p><span>{t.reference}</span><strong>{preview.reference}</strong></p>
     <p><span>{t.basket}</span><strong>{preview.offerTitle} × {preview.quantity}</strong></p>
     <p><span>{t.pickup}</span><strong>{dateTime(preview.pickupStart,locale)}–{dateTime(preview.pickupEnd,locale)}</strong></p>
     <p><span>{t.counter}</span><strong>{money(preview.totalPriceMinor,locale)}</strong></p>
    </div>
    <button className={styles.primaryButton} type="button" disabled={working||!preview.canConfirm} onClick={()=>void confirmPickup()}>{working?t.loadingConfirm:t.confirm}</button>
   </section>}
  </div>}
 </main>;
}
