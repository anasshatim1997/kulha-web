"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Check, Globe2, LockKeyhole, LogOut, MapPin, UserRound } from "lucide-react";
import { useSession } from "@/components/session/SessionProvider";
import { api } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { localeFromPath, localePath } from "@/lib/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { useToast } from "@/components/feedback/ToastProvider";
import "./profile-settings.css";

type UserPreferences = { preferredCity: string | null; preferredDistrict: string | null; locale: SiteLocale };
type NotificationPreferences = {
  reservationConfirmations: boolean; pickupReminders: boolean; cancellationsAndStatusChanges: boolean;
  nearbyBaskets: boolean; reminderMinutesBefore: number; emailEnabled: boolean; smsEnabled: boolean;
};
const defaultNotifications: NotificationPreferences = {
  reservationConfirmations: true, pickupReminders: true, cancellationsAndStatusChanges: true,
  nearbyBaskets: false, reminderMinutesBefore: 60, emailEnabled: true, smsEnabled: false,
};
const copy = {
  fr: {
    title:"Profil et paramètres",subtitle:"Gérez vos informations, votre langue et vos notifications.",profile:"Profil",location:"Lieu préféré",language:"Langue",notifications:"Notifications",account:"Compte",
    personal:"Informations personnelles",personalHint:"Ces informations permettent aux commerces de vous reconnaître lors du retrait.",name:"Nom complet",phone:"Téléphone",email:"Adresse e-mail",verified:"Confirmé",save:"Enregistrer",saving:"Enregistrement…",city:"Ville",district:"Quartier",locationHint:"Nous affichons d’abord les paniers disponibles dans cette zone.",useLocation:"La géolocalisation sera disponible prochainement.",
    languageHint:"L’arabe adapte tout le site au sens de lecture de droite à gauche.",french:"Français",arabic:"العربية",english:"English",notificationHint:"Choisissez les actualités que nous pouvons vous envoyer.",confirmations:"Confirmations de réservation",confirmationsHint:"Quand votre panier est réservé",reminders:"Rappels de retrait",remindersHint:"Avant le début de votre créneau",changes:"Annulations et changements de statut",changesHint:"Annulation, collecte ou expiration",nearby:"Nouveaux paniers près de moi",nearbyHint:"Quand un commerce de votre zone publie un panier",remind:"Me rappeler",before:"avant",sendBy:"Envoyer par",emailChannel:"E-mail",sms:"SMS",accountHint:"Sécurité et session",password:"Mot de passe",passwordHint:"La gestion du mot de passe sera disponible dans les paramètres de sécurité.",logout:"Se déconnecter",saved:"Paramètres enregistrés",error:"Une erreur est survenue.",loadError:"Impossible de charger vos paramètres.",loading:"Chargement des paramètres…",
  },
  en: {
    title:"Profile & settings",subtitle:"Manage your details, language and notifications.",profile:"Profile",location:"Preferred location",language:"Language",notifications:"Notifications",account:"Account",
    personal:"Personal information",personalHint:"This is how shops see you when you collect a reservation.",name:"Full name",phone:"Phone number",email:"Email address",verified:"Confirmed",save:"Save changes",saving:"Saving…",city:"City",district:"District",locationHint:"We show baskets available in this area first.",useLocation:"Location detection will be available soon.",
    languageHint:"Arabic switches the whole site to right-to-left.",french:"Français",arabic:"العربية",english:"English",notificationHint:"Choose which updates we can send you.",confirmations:"Reservation confirmations",confirmationsHint:"When your basket is booked",reminders:"Pickup reminders",remindersHint:"Before your pickup window starts",changes:"Cancellations and status changes",changesHint:"If a shop cancels, or a basket is collected or expires",nearby:"New baskets near me",nearbyHint:"When shops in your area post baskets",remind:"Remind me",before:"before",sendBy:"Send by",emailChannel:"Email",sms:"SMS",accountHint:"Security and session",password:"Password",passwordHint:"Password management will be available in security settings.",logout:"Log out",saved:"Settings saved",error:"Something went wrong.",loadError:"We couldn’t load your settings.",loading:"Loading settings…",
  },
  ar: {
    title:"الملف الشخصي والإعدادات",subtitle:"إدارة بياناتك ولغتك وإشعاراتك.",profile:"الملف الشخصي",location:"الموقع المفضل",language:"اللغة",notifications:"الإشعارات",account:"الحساب",
    personal:"المعلومات الشخصية",personalHint:"هذه هي المعلومات التي يراها المتجر عند استلام الحجز.",name:"الاسم الكامل",phone:"رقم الهاتف",email:"البريد الإلكتروني",verified:"مؤكد",save:"حفظ التغييرات",saving:"جارٍ الحفظ…",city:"المدينة",district:"الحي",locationHint:"نعرض السلال المتاحة في هذه المنطقة أولاً.",useLocation:"سيتم توفير تحديد الموقع قريباً.",
    languageHint:"اختيار العربية يحوّل الموقع بالكامل إلى اتجاه الكتابة من اليمين إلى اليسار.",french:"Français",arabic:"العربية",english:"English",notificationHint:"اختر التحديثات التي يمكننا إرسالها إليك.",confirmations:"تأكيدات الحجز",confirmationsHint:"عند حجز سلتك",reminders:"تذكيرات الاستلام",remindersHint:"قبل بدء موعد الاستلام",changes:"الإلغاء وتغييرات الحالة",changesHint:"عند إلغاء المتجر أو استلام السلة أو انتهاء الحجز",nearby:"سلال جديدة بالقرب مني",nearbyHint:"عندما تنشر المتاجر في منطقتك سلالاً جديدة",remind:"ذكرني",before:"قبل",sendBy:"إرسال عبر",emailChannel:"البريد الإلكتروني",sms:"رسالة نصية",accountHint:"الأمان والجلسة",password:"كلمة المرور",passwordHint:"ستتوفر إدارة كلمة المرور ضمن إعدادات الأمان.",logout:"تسجيل الخروج",saved:"تم حفظ الإعدادات",error:"حدث خطأ.",loadError:"تعذر تحميل الإعدادات.",loading:"جارٍ تحميل الإعدادات…",
  },
} as const;

export function ProfileSettingsPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = localeFromPath(pathname) as SiteLocale;
  const t = copy[locale] ?? copy.fr;
  const { state, reload, signOut } = useSession();
  const toast = useToast();
  const [active, setActive] = useState<"profile"|"location"|"language"|"notifications"|"account">("profile");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({ preferredCity:"", preferredDistrict:"", locale });
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    if (state.status !== "authenticated") return;
    setFullName(state.user.fullName);
    setPhone(state.user.phone ?? "");
    let cancelled = false;
    Promise.all([
      api.get<UserPreferences>("/me/preferences"),
      api.get<NotificationPreferences>("/me/notification-preferences"),
    ]).then(([preferences, notificationPreferences]) => {
      if (cancelled) return;
      setUserPrefs(preferences);
      setNotifications(notificationPreferences);
    }).catch(cause => { if (!cancelled) setError(describeError(cause) || t.loadError); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [state, t.loadError]);

  if (state.status === "loading" || loading && state.status === "authenticated") {
    return <main className="ps-page"><div className="ps-loading">{t.loading}</div></main>;
  }
  if (state.status === "anonymous") {
    return <main className="ps-page"><div className="ps-loading">{t.account}</div></main>;
  }
  if (state.status !== "authenticated") return null;
  const user = state.user;

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(null);
    try {
      await api.put("/me", { fullName: fullName.trim(), phone: phone.trim() || null });
      await reload(); toast.success({ title: t.saved });
    } catch (cause) { setError(describeError(cause) || t.error); }
    finally { setSaving(false); }
  }
  async function saveUserPreferences(next: UserPreferences) {
    setSaving(true); setError(null);
    try {
      const saved = await api.put<UserPreferences>("/me/preferences", next);
      setUserPrefs(saved); toast.success({ title: t.saved });
      if (saved.locale !== locale) router.push(localePath(saved.locale, "/account"));
    } catch (cause) { setError(describeError(cause) || t.error); }
    finally { setSaving(false); }
  }
  async function saveNotificationPreferences() {
    setSaving(true); setError(null);
    try {
      const saved = await api.put<NotificationPreferences>("/me/notification-preferences", notifications);
      setNotifications(saved); toast.success({ title: t.saved });
    } catch (cause) { setError(describeError(cause) || t.error); }
    finally { setSaving(false); }
  }
  const nav = [
    {id:"profile" as const,label:t.profile,icon:<UserRound/>},
    {id:"location" as const,label:t.location,icon:<MapPin/>},
    {id:"language" as const,label:t.language,icon:<Globe2/>},
    {id:"notifications" as const,label:t.notifications,icon:<Bell/>},
    {id:"account" as const,label:t.account,icon:<LockKeyhole/>},
  ];

  return (
    <main className="ps-page" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <aside className="ps-sidebar">
        <nav aria-label={t.title}>
          {nav.map(item => <button key={item.id} type="button" className={active===item.id?"is-active":""} onClick={()=>setActive(item.id)}>{item.icon}<span>{item.label}</span></button>)}
        </nav>
      </aside>
      <section className="ps-content">
        <header className="ps-header"><h1>{t.title}</h1><p>{t.subtitle}</p></header>
        {error && <div className="ps-error" role="alert">{error}</div>}
        {active === "profile" && <section className="ps-card">
          <h2>{t.personal}</h2><p className="ps-hint">{t.personalHint}</p>
          <div className="ps-avatar-row"><span className="ps-avatar">{user.fullName.trim().charAt(0).toUpperCase()}</span><div><strong>{user.fullName}</strong><small>{user.email}</small></div></div>
          <form onSubmit={saveProfile} className="ps-form">
            <label><span>{t.name}</span><input value={fullName} onChange={e=>setFullName(e.target.value)} maxLength={120} required/></label>
            <label><span>{t.phone}</span><input value={phone} onChange={e=>setPhone(e.target.value)} maxLength={30} autoComplete="tel"/></label>
            <label className="ps-full"><span>{t.email}</span><div className="ps-email"><input value={user.email} readOnly/><span><Check size={15}/>{user.emailVerified?t.verified:"—"}</span></div></label>
            <div className="ps-actions"><button className="ps-primary" disabled={saving}>{saving?t.saving:t.save}</button></div>
          </form>
        </section>}
        {active === "location" && <section className="ps-card">
          <h2>{t.location}</h2><p className="ps-hint">{t.locationHint}</p>
          <div className="ps-form">
            <label><span>{t.city}</span><input value={userPrefs.preferredCity ?? ""} onChange={e=>setUserPrefs(p=>({...p,preferredCity:e.target.value}))} maxLength={80}/></label>
            <label><span>{t.district}</span><input value={userPrefs.preferredDistrict ?? ""} onChange={e=>setUserPrefs(p=>({...p,preferredDistrict:e.target.value}))} maxLength={100}/></label>
            <div className="ps-full"><button type="button" className="ps-secondary" disabled>{t.useLocation}</button></div>
            <div className="ps-actions"><button className="ps-primary" disabled={saving} onClick={()=>void saveUserPreferences(userPrefs)}>{saving?t.saving:t.save}</button></div>
          </div>
        </section>}
        {active === "language" && <section className="ps-card">
          <h2>{t.language}</h2><p className="ps-hint">{t.languageHint}</p>
          <div className="ps-language-grid">
            {([{id:"fr" as const,label:t.french},{id:"ar" as const,label:t.arabic},{id:"en" as const,label:t.english}]).map(item=>
              <button type="button" key={item.id} className={userPrefs.locale===item.id?"is-selected":""} onClick={()=>void saveUserPreferences({...userPrefs,locale:item.id})}>{item.label}{userPrefs.locale===item.id&&<Check size={18}/>}</button>
            )}
          </div>
        </section>}
        {active === "notifications" && <section className="ps-card">
          <h2>{t.notifications}</h2><p className="ps-hint">{t.notificationHint}</p>
          <div className="ps-switch-list">
            {([
              ["reservationConfirmations","confirmations","confirmationsHint"],
              ["pickupReminders","reminders","remindersHint"],
              ["cancellationsAndStatusChanges","changes","changesHint"],
              ["nearbyBaskets","nearby","nearbyHint"],
            ] as const).map(([key,label,hint])=><label className="ps-switch-row" key={key}><span><strong>{t[label]}</strong><small>{t[hint]}</small></span><input type="checkbox" checked={notifications[key]} onChange={e=>setNotifications(p=>({...p,[key]:e.target.checked}))}/></label>)}
          </div>
          <div className="ps-form ps-notification-controls">
            <label><span>{t.remind}</span><select value={notifications.reminderMinutesBefore} onChange={e=>setNotifications(p=>({...p,reminderMinutesBefore:Number(e.target.value)}))}><option value={15}>15 min {t.before}</option><option value={30}>30 min {t.before}</option><option value={60}>1 h {t.before}</option><option value={120}>2 h {t.before}</option><option value={1440}>24 h {t.before}</option></select></label>
            <div className="ps-channel"><span>{t.sendBy}</span><div><button type="button" className={notifications.emailEnabled?"is-selected":""} onClick={()=>setNotifications(p=>({...p,emailEnabled:!p.emailEnabled}))}>{t.emailChannel}</button><button type="button" className={notifications.smsEnabled?"is-selected":""} onClick={()=>setNotifications(p=>({...p,smsEnabled:!p.smsEnabled}))}>{t.sms}</button></div></div>
          </div>
          <div className="ps-actions"><button className="ps-primary" disabled={saving} onClick={()=>void saveNotificationPreferences()}>{saving?t.saving:t.save}</button></div>
        </section>}
        {active === "account" && <section className="ps-card">
          <h2>{t.account}</h2><p className="ps-hint">{t.accountHint}</p>
          <div className="ps-security-row"><span><strong>{t.password}</strong><small>{t.passwordHint}</small></span><LockKeyhole/></div>
          <div className="ps-actions"><button className="ps-secondary ps-logout" type="button" onClick={()=>void signOut()}><LogOut size={17}/>{t.logout}</button></div>
        </section>}
      </section>
    </main>
  );
}
