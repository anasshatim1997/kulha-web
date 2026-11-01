import Link from "next/link";
import type { ReactNode } from "react";

export function InfoPage({ eyebrow, title, lead, children, cta = "Créer mon compte", ctaHref = "/register" }: { eyebrow: string; title: string; lead: string; children?: ReactNode; cta?: string; ctaHref?: string }) {
  return <div className="content-page"><p className="section-kicker">{eyebrow}</p><h1>{title}</h1><p className="page-lead">{lead}</p>{children}<div className="content-panel"><h2>On continue ensemble ?</h2><p>Créez un compte pour découvrir Kulha! au fur et à mesure de l’ouverture du service.</p><Link href={ctaHref} className="button button-yellow">{cta}<span aria-hidden>↗</span></Link></div></div>;
}

export function ContentTile({ title, text, href = "#" }: { title: string; text: string; href?: string }) {
  return <Link className="content-tile" href={href}><h2>{title} ↗</h2><p>{text}</p></Link>;
}
