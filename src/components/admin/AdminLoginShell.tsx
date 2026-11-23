import type { ReactNode } from "react";
import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import styles from "./AdminLoginShell.module.css";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { localePath } from "@/lib/navigation";

type AdminLoginShellProps = { locale?: SiteLocale; title: string; lead: string; children: ReactNode };
const copy = {
 fr:{eyebrow:"Accès sécurisé",restricted:"Espace réservé aux administrateurs autorisés",audit:"Les actions d’administration sont protégées et consignées dans le journal d’audit.",customer:"Vous cherchez l’accès client ou commerçant ?",go:"Se connecter"},
 en:{eyebrow:"Secure administrator access",restricted:"Restricted workspace · Authorized administrators only",audit:"Administrative actions are protected and recorded in the audit log.",customer:"Looking for the customer or shop sign in?",go:"Go to sign in"},
 ar:{eyebrow:"دخول إداري آمن",restricted:"مساحة مخصصة للمسؤولين المصرح لهم فقط",audit:"تتم حماية إجراءات الإدارة وتسجيلها في سجل التدقيق.",customer:"هل تبحث عن دخول العملاء أو المتاجر؟",go:"الانتقال إلى تسجيل الدخول"}
} as const;
export function AdminLoginShell({locale="fr",title,lead,children}:AdminLoginShellProps){
 const t=copy[locale];
 return <main className={styles.layout} dir={locale==="ar"?"rtl":"ltr"} lang={locale==="ar"?"ar-MA":locale}>
  <header className={styles.topbar}>
   <Link href={localePath(locale,"/admin/login")} className={styles.brand} aria-label="Kulha! Admin"><span className={styles.word} dir="ltr">KULHA<span>!</span></span><span className={styles.brandDivider} aria-hidden="true"/><span className={styles.brandLabel}>ADMIN</span></Link>
   <span className={styles.restricted}><LockKeyhole size={14} aria-hidden="true"/>{t.restricted}</span>
  </header>
  <section className={styles.stage} aria-labelledby="admin-login-title">
   <div className={styles.portal}>
    <div className={styles.portalMark} aria-hidden="true"><ShieldCheck size={25} strokeWidth={1.8}/></div>
    <p className={styles.eyebrow}>{t.eyebrow}</p><h1 id="admin-login-title">{title}</h1><p className={styles.lead}>{lead}</p>
    <div className={styles.form}>{children}</div>
    <div className={styles.assurance}><ShieldCheck size={16} aria-hidden="true"/><p>{t.audit}</p></div>
   </div>
  </section>
  <footer className={styles.footer}><span>{t.customer}</span><Link href={localePath(locale,"/login")}>{t.go}</Link></footer>
 </main>;
}
