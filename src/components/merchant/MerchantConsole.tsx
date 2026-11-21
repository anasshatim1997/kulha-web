"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSession } from "@/components/session/SessionProvider";
import { api } from "@/lib/api/client";
import { localePath } from "@/lib/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import styles from "./MerchantConsole.module.css";

type PageKey = "dashboard" | "orders" | "staff" | "sales";
type Shop = { name: string; city: string };
type Order = { reference:string; customerName:string; basket:string; quantity:number; pickupStart:string; pickupEnd:string; amountMinor:number; status:string; createdAt:string };
type LiveOffer = { id:string; title:string; priceMinor:number; quantityTotal:number; quantityReserved:number; status:string };
type Dashboard = { shopName:string; city:string; liveOffers:number; reservedToday:number; basketsToday:number; toCollectNow:number; collectedToday:number; todayOrders:Order[]; offers:LiveOffer[] };
type Sales = { basketsCollected:number; salesMinor:number; cancelled:number; notCollected:number; from:string; to:string; daily:{date:string;amountMinor:number}[]; latestOrders:Order[] };
type Staff = { userId:string; email:string; fullName:string; role:string; addedAt:string; canValidatePickups:boolean; canViewOrders:boolean; canManageOffers:boolean };

const copy = {
 fr:{dashboard:"Tableau de bord",orders:"Commandes",offers:"Offres",pickup:"Valider un retrait",staff:"Équipe",sales:"Ventes",newOffer:"Nouvelle offre",welcome:"Bonjour",subtitle:"Les réservations du jour et les paniers à remettre.",live:"Offres en ligne",reserved:"Réservées aujourd’hui",collect:"À récupérer maintenant",collected:"Remises",all:"Toutes",toCollect:"À récupérer",done:"Terminées",reference:"Référence",customer:"Client",basket:"Panier",pickupTime:"Retrait",status:"Statut",action:"Action",validate:"Valider",empty:"Aucune commande pour le moment.",duplicate:"Dupliquer",edit:"Modifier",left:"restants",soldOut:"Épuisé",duplicateYesterday:"Publier en un geste",duplicateBody:"Reprenez une offre récente et choisissez une nouvelle quantité.",team:"Équipe active",access:"Accès",role:"Rôle",invite:"Ajouter un compte KULHA existant",email:"Adresse e-mail",permissionPickup:"Valider les retraits",permissionOrders:"Voir les commandes",permissionOffers:"Créer et modifier les offres",sendInvite:"Accorder l’accès",owner:"Propriétaire",remove:"Retirer",noStaff:"Aucun membre d’équipe pour l’instant.",salesTitle:"Ventes",salesLead:"Paniers remis et montants encaissés au comptoir.",basketsCollected:"Paniers remis",salesMad:"Ventes (MAD)",cancelled:"Annulées",notCollected:"Non récupérées",export:"Exporter CSV",last7:"7 derniers jours",byDay:"Ventes par jour (MAD)",latest:"Dernières commandes",date:"Date",quantity:"Qté",amount:"Montant",loading:"Chargement…",retry:"Réessayer",error:"Impossible de charger les données.",forbidden:"Votre compte n’a pas l’autorisation d’accéder à cette section.",noSales:"Aucune vente sur cette période.",saving:"Enregistrement…",saved:"Modifications enregistrées.",inviteSent:"Le compte a maintenant accès à la boutique.",inviteError:"Impossible d’ajouter ce compte. Vérifiez l’adresse et les permissions.",removeConfirm:"Retirer ce membre de la boutique ?",accessNote:"Retirer un membre met fin immédiatement à son accès.",salesNote:"Montants encaissés au comptoir, avant toute commission KULHA."},
 en:{dashboard:"Dashboard",orders:"Orders",offers:"Offers",pickup:"Validate pickup",staff:"Staff",sales:"Sales",newOffer:"New offer",welcome:"Hello",subtitle:"Today's reservations and baskets to hand over.",live:"Live offers",reserved:"Reserved today",collect:"To collect now",collected:"Collected",all:"All",toCollect:"To collect",done:"Done",reference:"Reference",customer:"Customer",basket:"Basket",pickupTime:"Pickup",status:"Status",action:"Action",validate:"Validate",empty:"No orders yet.",duplicate:"Duplicate",edit:"Edit",left:"left",soldOut:"Sold out",duplicateYesterday:"Publish in one tap",duplicateBody:"Reuse a recent offer and choose a new quantity.",team:"Active team",access:"Access",role:"Role",invite:"Add an existing KULHA account",email:"Email address",permissionPickup:"Validate pickups",permissionOrders:"View orders",permissionOffers:"Create and edit offers",sendInvite:"Grant access",owner:"Owner",remove:"Remove",noStaff:"No team members yet.",salesTitle:"Sales",salesLead:"Collected baskets and amounts paid at your counter.",basketsCollected:"Baskets collected",salesMad:"Sales (MAD)",cancelled:"Cancelled",notCollected:"Not collected",export:"Export CSV",last7:"Last 7 days",byDay:"Sales per day (MAD)",latest:"Latest orders",date:"Date",quantity:"Qty",amount:"Amount",loading:"Loading…",retry:"Retry",error:"Could not load the data.",forbidden:"Your account does not have permission to access this section.",noSales:"No sales in this period.",saving:"Saving…",saved:"Changes saved.",inviteSent:"Shop access granted to this account.",inviteError:"Could not add this account. Check the email and permissions.",removeConfirm:"Remove this member from the shop?",accessNote:"Removing a teammate ends their access immediately.",salesNote:"Amounts paid at the counter, before any KULHA commission."},
 ar:{dashboard:"لوحة المتجر",orders:"الطلبات",offers:"العروض",pickup:"تأكيد الاستلام",staff:"الفريق",sales:"المبيعات",newOffer:"عرض جديد",welcome:"مرحباً",subtitle:"حجوزات اليوم والسلال الجاهزة للتسليم.",live:"العروض المنشورة",reserved:"محجوزة اليوم",collect:"بانتظار الاستلام",collected:"تم تسليمها",all:"الكل",toCollect:"بانتظار الاستلام",done:"مكتملة",reference:"المرجع",customer:"الزبون",basket:"السلة",pickupTime:"موعد الاستلام",status:"الحالة",action:"الإجراء",validate:"تأكيد",empty:"لا توجد طلبات حالياً.",duplicate:"نسخ",edit:"تعديل",left:"متبقية",soldOut:"نفدت الكمية",duplicateYesterday:"انشر بنقرة واحدة",duplicateBody:"أعد استخدام عرض سابق وحدد كمية جديدة.",team:"الفريق النشط",access:"الصلاحيات",role:"الدور",invite:"إضافة حساب KULHA موجود",email:"البريد الإلكتروني",permissionPickup:"تأكيد الاستلام",permissionOrders:"عرض الطلبات",permissionOffers:"إنشاء وتعديل العروض",sendInvite:"منح صلاحية الوصول",owner:"المالك",remove:"إزالة",noStaff:"لا يوجد أعضاء في الفريق بعد.",salesTitle:"المبيعات",salesLead:"السلال التي تم تسليمها والمبالغ المدفوعة في المتجر.",basketsCollected:"السلال المسلّمة",salesMad:"المبيعات (درهم)",cancelled:"ملغاة",notCollected:"لم تستلم",export:"تصدير CSV",last7:"آخر 7 أيام",byDay:"المبيعات اليومية (درهم)",latest:"أحدث الطلبات",date:"التاريخ",quantity:"الكمية",amount:"المبلغ",loading:"جارٍ التحميل…",retry:"إعادة المحاولة",error:"تعذر تحميل البيانات.",forbidden:"ليس لحسابك صلاحية الوصول إلى هذا القسم.",noSales:"لا توجد مبيعات خلال هذه الفترة.",saving:"جارٍ الحفظ…",saved:"تم حفظ التغييرات.",inviteSent:"تم منح هذا الحساب صلاحية الوصول إلى المتجر.",inviteError:"تعذرت إضافة هذا الحساب. تحقق من البريد والصلاحيات.",removeConfirm:"هل تريد إزالة هذا العضو من المتجر؟",accessNote:"تؤدي إزالة العضو إلى إنهاء وصوله فوراً.",salesNote:"المبالغ المدفوعة في المتجر قبل احتساب عمولة كُلحا."}
} as const;

function money(value:number,locale:SiteLocale){return new Intl.NumberFormat(locale==="ar"?"ar-MA":locale==="en"?"en-MA":"fr-MA",{style:"currency",currency:"MAD",maximumFractionDigits:2}).format(value/100);}
function localDate(value:string,locale:SiteLocale,time=false){return new Intl.DateTimeFormat(locale==="ar"?"ar-MA":locale==="en"?"en-MA":"fr-MA",time?{timeZone:"Africa/Casablanca",hour:"2-digit",minute:"2-digit"}:{timeZone:"Africa/Casablanca",day:"2-digit",month:"short"}).format(new Date(value));}
function Status({value,locale}:{value:string;locale:SiteLocale}){
 const labels:Record<string,Record<SiteLocale,string>>={
  CONFIRMED:{fr:"À récupérer",en:"To collect",ar:"بانتظار الاستلام"},COMPLETED:{fr:"Récupérée",en:"Collected",ar:"تم الاستلام"},
  CANCELLED:{fr:"Annulée",en:"Cancelled",ar:"ملغاة"},EXPIRED:{fr:"Non récupérée",en:"Not collected",ar:"لم تستلم"},
  DRAFT:{fr:"Brouillon",en:"Draft",ar:"مسودة"},PUBLISHED:{fr:"En ligne",en:"Live",ar:"منشور"},
  UNPUBLISHED:{fr:"Dépubliée",en:"Unpublished",ar:"غير منشور"},SUSPENDED:{fr:"Masquée",en:"Hidden",ar:"مخفي"}
 };
 return <span className={styles.status+" "+(styles["status"+value]||"")}>{labels[value]?.[locale]??value}</span>;
}
function OrdersTable({rows,locale,t,onValidate=false}:{rows:Order[];locale:SiteLocale;t:typeof copy[SiteLocale];onValidate?:boolean}){
 if(!rows.length)return <div className={styles.empty}>{t.empty}</div>;
 return <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>{t.reference}</th><th>{t.customer}</th><th>{t.basket}</th><th>{t.pickupTime}</th><th>{t.status}</th>{onValidate&&<th>{t.action}</th>}</tr></thead>
 <tbody>{rows.map(row=><tr key={row.reference}><td className={styles.ref}>{row.reference}</td><td>{row.customerName}</td><td>{row.basket} × {row.quantity}</td><td>{localDate(row.pickupStart,locale,true)}–{localDate(row.pickupEnd,locale,true)}</td><td><Status value={row.status} locale={locale}/></td>{onValidate&&<td>{row.status==="CONFIRMED"?<Link className={styles.smallAction} href={localePath(locale,"/merchant/reservations/scan")}>{t.validate}</Link>:"—"}</td>}</tr>)}</tbody>
 </table></div>;
}

export function MerchantConsole({locale,page,shop}:{locale:SiteLocale;page:PageKey;shop?:Shop}){
 const t=copy[locale]; const {state}=useSession();
 const [dashboard,setDashboard]=useState<Dashboard|null>(null); const [orders,setOrders]=useState<Order[]>([]);
 const [filter,setFilter]=useState("ALL"); const [staff,setStaff]=useState<Staff[]>([]); const [sales,setSales]=useState<Sales|null>(null);
 const [reload,setReload]=useState(0); const [loading,setLoading]=useState(true); const [failed,setFailed]=useState(false);
 const [message,setMessage]=useState(""); const [working,setWorking]=useState(false); const [email,setEmail]=useState("");
 const [permissions,setPermissions]=useState({canValidatePickups:true,canViewOrders:true,canManageOffers:false});
 const [from,setFrom]=useState(""); const [to,setTo]=useState("");
 const range=useMemo(()=>({from,to}),[from,to]);

 useEffect(()=>{let active=true;
  const load=async()=>{try{
   if(page==="dashboard"){const d=await api.get<Dashboard>("/merchants/me/workspace");if(active){setDashboard(d);setFailed(false);}}
   else if(page==="orders"){const d=await api.get<Order[]>("/merchants/me/orders?filter="+filter);if(active){setOrders(d);setFailed(false);}}
   else if(page==="staff"){const d=await api.get<Staff[]>("/merchants/me/staff");if(active){setStaff(d);setFailed(false);}}
   else{const query=new URLSearchParams();if(range.from)query.set("from",range.from);if(range.to)query.set("to",range.to);const d=await api.get<Sales>("/merchants/me/sales"+(query.size?"?"+query.toString():""));if(active){setSales(d);setFailed(false);}}
  }catch(e){if(active){setFailed(true);setMessage(e instanceof Error&&"status" in e&&(e as {status:number}).status===403?t.forbidden:t.error);}}
  finally{if(active)setLoading(false);}};
  void load();return()=>{active=false;};
 },[page,filter,reload,range,t.error,t.forbidden]);

 async function duplicate(id:string){setWorking(true);setMessage("");try{await api.post("/merchant/offers/"+id+"/duplicate",{});setMessage(t.saved);setReload(v=>v+1);}catch{setMessage(t.error);}finally{setWorking(false);}}
 async function addStaff(event:FormEvent<HTMLFormElement>){event.preventDefault();setWorking(true);setMessage("");try{
  await api.post("/merchants/me/staff",{email:email.trim(),...permissions});setEmail("");setPermissions({canValidatePickups:true,canViewOrders:true,canManageOffers:false});setMessage(t.saved);setReload(v=>v+1);
 }catch{setMessage(t.inviteError);}finally{setWorking(false);}}
 async function updateStaff(member:Staff,patch:Partial<Staff>){setWorking(true);const next={canValidatePickups:patch.canValidatePickups??member.canValidatePickups,canViewOrders:patch.canViewOrders??member.canViewOrders,canManageOffers:patch.canManageOffers??member.canManageOffers};
  try{await api.put("/merchants/me/staff/"+member.userId,next);setMessage(t.saved);setReload(v=>v+1);}catch{setMessage(t.error);}finally{setWorking(false);}}
 async function removeStaff(member:Staff){if(!window.confirm(t.removeConfirm))return;setWorking(true);try{const res=await fetch("/api/bff/merchants/me/staff/"+member.userId,{method:"DELETE",credentials:"same-origin"});if(!res.ok)throw new Error();setMessage(t.saved);setReload(v=>v+1);}catch{setMessage(t.error);}finally{setWorking(false);}}
 async function exportCsv(){setWorking(true);try{const query=new URLSearchParams();if(range.from)query.set("from",range.from);if(range.to)query.set("to",range.to);const res=await fetch("/api/bff/merchants/me/sales/export"+(query.size?"?"+query.toString():""),{credentials:"same-origin",cache:"no-store"});if(!res.ok)throw new Error();const blob=await res.blob();const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="kulha-sales.csv";a.click();URL.revokeObjectURL(url);}catch{setMessage(t.error);}finally{setWorking(false);}}

 const isOwner=state.status==="authenticated"&&(state.user.roles.includes("MERCHANT")||state.user.roles.includes("MERCHANT_OWNER"));
 const title=page==="dashboard"?t.dashboard:page==="orders"?t.orders:page==="staff"?t.staff:t.salesTitle;
 if(loading)return <main className={styles.page} dir={locale==="ar"?"rtl":"ltr"}><div className={styles.skeleton}/><div className={styles.skeletonGrid}><i/><i/><i/><i/></div><div className={styles.skeletonPanel}/></main>;
 if(failed)return <main className={styles.page} dir={locale==="ar"?"rtl":"ltr"}><div className={styles.alert}>{message}<button onClick={()=>{setLoading(true);setFailed(false);setReload(v=>v+1);}}>{t.retry}</button></div></main>;

 return <main className={styles.page} dir={locale==="ar"?"rtl":"ltr"}>
  <header className={styles.heading}><div><p className={styles.kicker}>{shop?.name||dashboard?.shopName||"KULHA! · SHOP SPACE"}{(shop?.city||dashboard?.city)?" · "+(shop?.city||dashboard?.city):""}</p>
   <h1>{page==="dashboard"?t.welcome+(shop?.name||dashboard?.shopName?", "+(shop?.name||dashboard?.shopName):""):title}</h1><p>{page==="dashboard"?t.subtitle:page==="sales"?t.salesLead:page==="staff"?t.accessNote:""}</p></div>
   <div className={styles.headingActions}>{(page==="dashboard"||page==="orders")&&<Link href={localePath(locale,"/merchant/offers/new")} className={styles.primaryAction}>＋ {t.newOffer}</Link>}
   {(page==="dashboard"||page==="orders")&&<Link href={localePath(locale,"/merchant/reservations/scan")} className={styles.darkAction}>▦ {t.pickup}</Link>}</div>
  </header>
  {message&&<p className={styles.notice} role="status">{message}</p>}
  {page==="dashboard"&&dashboard&&<>
   <section className={styles.metrics}>
    <article><span>{t.live}</span><strong>{dashboard.liveOffers}</strong><small>{dashboard.offers.filter(o=>o.status==="PUBLISHED"&&o.quantityTotal-o.quantityReserved>0).length} {t.left}</small></article>
    <article><span>{t.reserved}</span><strong>{dashboard.reservedToday}</strong><small>{dashboard.basketsToday} {t.basket.toLowerCase()}</small></article>
    <article className={styles.metricHighlight}><span>{t.collect}</span><strong>{dashboard.toCollectNow}</strong><small>{t.toCollect}</small></article>
    <article><span>{t.collected}</span><strong>{dashboard.collectedToday}</strong><small>{t.done}</small></article>
   </section>
   <section className={styles.panel}><div className={styles.panelHead}><h2>{t.orders}</h2><Link href={localePath(locale,"/merchant/orders")}>{t.all} ↗</Link></div><OrdersTable rows={dashboard.todayOrders} locale={locale} t={t} onValidate/></section>
   <section className={styles.bottomGrid}><div className={styles.panel}><div className={styles.panelHead}><h2>{t.offers}</h2><Link href={localePath(locale,"/merchant/offers")}>{t.all} ↗</Link></div>
    <div className={styles.offerList}>{dashboard.offers.map(item=><div className={styles.offerRow} key={item.id}><div className={styles.offerMeta}><strong>{item.title}</strong><b>{money(item.priceMinor,locale)}</b></div>
     <div className={styles.progress}><span style={{width:Math.max(0,Math.min(100,(item.quantityTotal-item.quantityReserved)/Math.max(1,item.quantityTotal)*100))+"%"}}/></div>
     <small>{item.status==="PUBLISHED"?(item.quantityTotal-item.quantityReserved)+" "+t.left:item.status}</small>
     <div className={styles.rowActions}><Link href={localePath(locale,"/merchant/offers/"+item.id)}>{t.edit}</Link><button disabled={working} onClick={()=>void duplicate(item.id)}>{t.duplicate}</button></div>
    </div>)}</div></div>
    <div className={styles.duplicatePanel}><span className={styles.duplicateIcon}>▢</span><h2>{t.duplicateYesterday}</h2><p>{t.duplicateBody}</p><button disabled={working||dashboard.offers.length===0} onClick={()=>void duplicate(dashboard.offers[0].id)}>{t.duplicateYesterday}</button></div>
   </section>
  </>}
  {page==="orders"&&<><div className={styles.filters}>{([["ALL",t.all],["TO_COLLECT",t.toCollect],["DONE",t.done]] as [string,string][]).map(([value,label])=><button key={value} className={filter===value?styles.filterActive:styles.filter} onClick={()=>{setLoading(true);setFailed(false);setFilter(value);}}>{label}</button>)}</div><section className={styles.panel}><OrdersTable rows={orders} locale={locale} t={t} onValidate/></section></>}
  {page==="staff"&&(!isOwner?<div className={styles.alert}>{t.forbidden}</div>:<>
   <section className={styles.panel}><div className={styles.panelHead}><h2>{t.team} · {staff.length}</h2><p>{t.accessNote}</p></div>
    {!staff.length?<p className={styles.empty}>{t.noStaff}</p>:<div className={styles.staffList}>{staff.map(member=><article key={member.userId} className={styles.staffRow}>
     <div className={styles.avatar}>{member.fullName.slice(0,1).toUpperCase()}</div><div className={styles.staffIdentity}><strong>{member.fullName}</strong><small>{member.email}</small></div><span className={styles.role}>{member.role==="OWNER"?t.owner:t.staff}</span>
     {member.role!=="OWNER"&&<div className={styles.staffPerms}>
      <label><input type="checkbox" checked={member.canValidatePickups} disabled={working} onChange={e=>void updateStaff(member,{canValidatePickups:e.target.checked})}/>{t.permissionPickup}</label>
      <label><input type="checkbox" checked={member.canViewOrders} disabled={working} onChange={e=>void updateStaff(member,{canViewOrders:e.target.checked})}/>{t.permissionOrders}</label>
      <label><input type="checkbox" checked={member.canManageOffers} disabled={working} onChange={e=>void updateStaff(member,{canManageOffers:e.target.checked})}/>{t.permissionOffers}</label>
     </div>}{member.role!=="OWNER"&&<button className={styles.removeButton} disabled={working} onClick={()=>void removeStaff(member)}>{t.remove}</button>}
    </article>)}</div>}
   </section>
   <div className={styles.bottomGrid}><form className={styles.panel} onSubmit={addStaff}><h2>{t.invite}</h2><label className={styles.field}><span>{t.email}</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" required/></label>
    <div className={styles.permissionList}>
     <label><input type="checkbox" checked={permissions.canValidatePickups} onChange={e=>setPermissions(v=>({...v,canValidatePickups:e.target.checked}))}/>{t.permissionPickup}</label>
     <label><input type="checkbox" checked={permissions.canViewOrders} onChange={e=>setPermissions(v=>({...v,canViewOrders:e.target.checked}))}/>{t.permissionOrders}</label>
     <label><input type="checkbox" checked={permissions.canManageOffers} onChange={e=>setPermissions(v=>({...v,canManageOffers:e.target.checked}))}/>{t.permissionOffers}</label>
    </div><button className={styles.darkAction} type="submit" disabled={working||!email.trim()}>{working?t.saving:t.sendInvite}</button>
   </form><section className={styles.panel}><h2>{t.role}</h2><div className={styles.roleGrid}><p><strong>{t.owner}</strong><span>{t.permissionPickup} · {t.permissionOrders} · {t.permissionOffers} · {t.sales}</span></p><p><strong>{t.staff}</strong><span>{t.permissionPickup} · {t.permissionOrders}</span></p></div></section></div>
  </>)}
  {page==="sales"&&sales&&<>
   <div className={styles.salesToolbar}><div><label>{t.date}<input type="date" value={from} onChange={e=>{setLoading(true);setFailed(false);setFrom(e.target.value);}}/></label><label>{t.toCollect}<input type="date" value={to} onChange={e=>{setLoading(true);setFailed(false);setTo(e.target.value);}}/></label></div><button className={styles.primaryAction} disabled={working} onClick={()=>void exportCsv()}>{t.export}</button></div>
   <section className={styles.metrics}><article><span>{t.basketsCollected}</span><strong>{sales.basketsCollected}</strong><small>{t.last7}</small></article><article><span>{t.salesMad}</span><strong>{money(sales.salesMinor,locale)}</strong><small>{t.salesNote}</small></article><article><span>{t.cancelled}</span><strong>{sales.cancelled}</strong><small>{t.orders}</small></article><article><span>{t.notCollected}</span><strong>{sales.notCollected}</strong><small>{t.orders}</small></article></section>
   <section className={styles.panel}><h2>{t.byDay}</h2>{sales.daily.length===0?<p className={styles.empty}>{t.noSales}</p>:<div className={styles.chart}>{sales.daily.map(d=><div className={styles.chartBar} key={d.date}><strong>{money(d.amountMinor,locale)}</strong><span style={{height:Math.max(6,d.amountMinor/Math.max(1,...sales.daily.map(x=>x.amountMinor))*150)+"px"}}/><small>{new Intl.DateTimeFormat(locale==="ar"?"ar-MA":locale==="en"?"en-MA":"fr-MA",{timeZone:"Africa/Casablanca",weekday:"short"}).format(new Date(d.date+"T12:00:00"))}</small></div>)}</div>}</section>
   <section className={styles.panel}><h2>{t.latest}</h2><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>{t.date}</th><th>{t.reference}</th><th>{t.basket}</th><th>{t.quantity}</th><th>{t.amount}</th><th>{t.status}</th></tr></thead><tbody>
    {sales.latestOrders.map(row=><tr key={row.reference}><td>{localDate(row.createdAt,locale)}</td><td className={styles.ref}>{row.reference}</td><td>{row.basket}</td><td>{row.quantity}</td><td>{money(row.amountMinor,locale)}</td><td><Status value={row.status} locale={locale}/></td></tr>)}
   </tbody></table></div></section>
  </>}
 </main>;
}
