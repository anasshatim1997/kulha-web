"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Check, CheckCheck, Clock3, PackageCheck, ShoppingBasket, X } from "lucide-react";
import { api } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { localeFromPath, localePath } from "@/lib/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import "./notifications.css";

type NotificationItem = {
  id: string;
  type: "RESERVATION_CONFIRMED" | "PICKUP_REMINDER" | "RESERVATION_CANCELLED" | "RESERVATION_COLLECTED" | "RESERVATION_EXPIRED" | "GENERAL";
  title: string;
  message: string;
  actionLabel: string | null;
  actionUrl: string | null;
  createdAt: string;
  readAt: string | null;
};

type Copy = {
  title: string; subtitle: string; all: string; unread: string; today: string; earlier: string;
  markAll: string; settingsTitle: string; settingsBody: string; manage: string; loading: string;
  emptyTitle: string; emptyBody: string; loadError: string; retry: string; read: string;
  confirmed: string; reminder: string; cancelled: string; collected: string; expired: string; general: string;
  types: string; confirmation: string; pickup: string; cancellation: string; status: string;
};
const copy: Record<SiteLocale, Copy> = {
  fr: {
    title: "Notifications", subtitle: "Suivez vos réservations et vos rappels de retrait.",
    all: "Tout", unread: "Non lues", today: "Aujourd’hui", earlier: "Plus tôt",
    markAll: "Tout marquer comme lu", settingsTitle: "Préférences de notification",
    settingsBody: "Choisissez les actualités que vous recevez et le moment de nos rappels.",
    manage: "Gérer mes préférences", loading: "Chargement de vos notifications…",
    emptyTitle: "Vous êtes à jour !", emptyBody: "Vos nouvelles confirmations et rappels apparaîtront ici.",
    loadError: "Impossible de charger vos notifications.", retry: "Réessayer", read: "Marquer comme lu",
    confirmed: "Réservation confirmée", reminder: "Rappel de retrait", cancelled: "Réservation annulée",
    collected: "Panier récupéré", expired: "Réservation expirée", general: "Information",
    types: "TYPES", confirmation: "Confirmation", pickup: "Rappel de retrait", cancellation: "Annulation", status: "Changement de statut",
  },
  en: {
    title: "Notifications", subtitle: "Reservation updates and pickup reminders.",
    all: "All", unread: "Unread", today: "Today", earlier: "Earlier",
    markAll: "Mark all as read", settingsTitle: "Notification settings",
    settingsBody: "Choose which updates you receive and when we remind you.",
    manage: "Manage preferences", loading: "Loading your notifications…",
    emptyTitle: "You’re all caught up!", emptyBody: "New confirmations and pickup reminders will appear here.",
    loadError: "We couldn’t load your notifications.", retry: "Try again", read: "Mark as read",
    confirmed: "Reservation confirmed", reminder: "Pickup reminder", cancelled: "Reservation cancelled",
    collected: "Basket collected", expired: "Reservation expired", general: "Update",
    types: "TYPES", confirmation: "Confirmation", pickup: "Pickup reminder", cancellation: "Cancellation", status: "Status change",
  },
  ar: {
    title: "الإشعارات", subtitle: "تابع تحديثات حجوزاتك وتذكيرات الاستلام.",
    all: "الكل", unread: "غير المقروءة", today: "اليوم", earlier: "سابقاً",
    markAll: "تحديد الكل كمقروء", settingsTitle: "إعدادات الإشعارات",
    settingsBody: "اختر التحديثات التي تصلك وموعد التذكير.",
    manage: "إدارة التفضيلات", loading: "جارٍ تحميل الإشعارات…",
    emptyTitle: "أنت على اطلاع بكل جديد!", emptyBody: "ستظهر تأكيدات الحجوزات وتذكيرات الاستلام هنا.",
    loadError: "تعذر تحميل الإشعارات.", retry: "إعادة المحاولة", read: "تحديد كمقروء",
    confirmed: "تم تأكيد الحجز", reminder: "تذكير بالاستلام", cancelled: "تم إلغاء الحجز",
    collected: "تم استلام السلة", expired: "انتهى الحجز", general: "تحديث",
    types: "الأنواع", confirmation: "تأكيد", pickup: "تذكير الاستلام", cancellation: "إلغاء", status: "تغيير الحالة",
  },
};

function typeLabel(type: NotificationItem["type"], t: Copy) {
  switch (type) {
    case "RESERVATION_CONFIRMED": return t.confirmed;
    case "PICKUP_REMINDER": return t.reminder;
    case "RESERVATION_CANCELLED": return t.cancelled;
    case "RESERVATION_COLLECTED": return t.collected;
    case "RESERVATION_EXPIRED": return t.expired;
    default: return t.general;
  }
}
function iconFor(type: NotificationItem["type"]) {
  if (type === "RESERVATION_CONFIRMED") return <Check aria-hidden="true" />;
  if (type === "PICKUP_REMINDER" || type === "RESERVATION_EXPIRED") return <Clock3 aria-hidden="true" />;
  if (type === "RESERVATION_CANCELLED") return <X aria-hidden="true" />;
  if (type === "RESERVATION_COLLECTED") return <PackageCheck aria-hidden="true" />;
  return <Bell aria-hidden="true" />;
}
function safeActionUrl(url: string | null) {
  return url && url.startsWith("/") && !url.startsWith("//") ? url : null;
}

export function NotificationPanel() {
  const pathname = usePathname();
  const locale = localeFromPath(pathname) as SiteLocale;
  const t = copy[locale] ?? copy.fr;
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, count] = await Promise.all([
        api.get<NotificationItem[]>(`/notifications?unreadOnly=${filter === "unread"}&page=0&size=50`),
        api.get<{ count: number }>("/notifications/unread-count"),
      ]);
      setItems(list);
      setUnreadCount(count.count);
    } catch (cause) {
      setError(describeError(cause) || t.loadError);
    } finally {
      setLoading(false);
    }
  }, [filter, t.loadError]);

  useEffect(() => { void load(); }, [load]);

  async function markRead(id: string) {
    setBusyId(id);
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems(current => current.map(item => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
      setUnreadCount(count => Math.max(0, count - 1));
    } catch (cause) {
      setError(describeError(cause) || t.loadError);
    } finally {
      setBusyId(null);
    }
  }

  async function markAllRead() {
    setBusyId("all");
    try {
      await api.post("/notifications/read-all");
      setItems(current => current.map(item => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch (cause) {
      setError(describeError(cause) || t.loadError);
    } finally {
      setBusyId(null);
    }
  }

  const { today, earlier } = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return {
      today: items.filter(item => new Date(item.createdAt) >= start),
      earlier: items.filter(item => new Date(item.createdAt) < start),
    };
  }, [items]);

  function timeLabel(value: string) {
    const date = new Date(value);
    const diff = Date.now() - date.getTime();
    if (diff < 60_000) return locale === "ar" ? "الآن" : locale === "en" ? "Just now" : "À l’instant";
    if (diff < 3_600_000) {
      const minutes = Math.floor(diff / 60_000);
      return locale === "ar" ? `قبل ${minutes} د` : locale === "en" ? `${minutes} min ago` : `Il y a ${minutes} min`;
    }
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : locale === "en" ? "en" : "fr-MA", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    }).format(date);
  }

  function renderGroup(label: string, rows: NotificationItem[]) {
    if (!rows.length) return null;
    return (
      <section className="nt-group" aria-label={label}>
        <h2>{label}</h2>
        <div className="nt-list">
          {rows.map(item => {
            const href = safeActionUrl(item.actionUrl);
            return (
              <article className={`nt-item ${item.readAt ? "is-read" : "is-unread"} nt-type--${item.type.toLowerCase()}`} key={item.id}>
                <span className="nt-item__icon">{iconFor(item.type)}</span>
                <div className="nt-item__body">
                  <div className="nt-item__heading">
                    <h3>{item.title || typeLabel(item.type, t)}</h3>
                    <time dateTime={item.createdAt}>{timeLabel(item.createdAt)}</time>
                  </div>
                  <p>{item.message}</p>
                  {href && item.actionLabel && <Link className="nt-action" href={localePath(locale, href)}>{item.actionLabel}</Link>}
                </div>
                {!item.readAt && <button className="nt-read" type="button" aria-label={t.read} title={t.read} disabled={busyId === item.id} onClick={() => void markRead(item.id)} />}
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <main className="nt-page" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className="nt-header">
        <div><h1>{t.title}</h1><p>{t.subtitle}</p></div>
        {unreadCount > 0 && <button type="button" className="nt-mark-all" disabled={busyId === "all"} onClick={() => void markAllRead()}><CheckCheck size={18} />{t.markAll}</button>}
      </header>
      <div className="nt-layout">
        <div className="nt-main">
          <div className="nt-filters" role="group" aria-label={t.title}>
            <button type="button" className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>{t.all}</button>
            <button type="button" className={filter === "unread" ? "is-active" : ""} onClick={() => setFilter("unread")}>{t.unread} · {unreadCount}</button>
          </div>
          {error && <div className="nt-error" role="alert"><span>{error}</span><button type="button" onClick={() => void load()}>{t.retry}</button></div>}
          {loading ? <div className="nt-state" role="status">{t.loading}</div> :
            items.length === 0 ? <div className="nt-empty"><span><Bell /></span><h2>{t.emptyTitle}</h2><p>{t.emptyBody}</p></div> :
              <>{renderGroup(t.today, today)}{renderGroup(t.earlier, earlier)}</>}
        </div>
        <aside className="nt-aside">
          <section className="nt-settings">
            <div className="nt-settings__title"><Bell /><h2>{t.settingsTitle}</h2></div>
            <p>{t.settingsBody}</p>
            <Link href={localePath(locale, "/account#notifications")}>{t.manage}</Link>
          </section>
          <section className="nt-legend">
            <h2>{t.types}</h2>
            <div><span className="nt-chip nt-chip--green"><Check />{t.confirmed}</span><strong>{t.confirmation}</strong></div>
            <div><span className="nt-chip nt-chip--yellow"><Clock3 />{t.reminder}</span><strong>{t.pickup}</strong></div>
            <div><span className="nt-chip nt-chip--red"><X />{t.cancelled}</span><strong>{t.cancellation}</strong></div>
            <div><span className="nt-chip nt-chip--blue"><ShoppingBasket />{t.collected}</span><strong>{t.status}</strong></div>
          </section>
        </aside>
      </div>
    </main>
  );
}
