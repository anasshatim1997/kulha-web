import Link from "next/link";
import { InfoPage } from "@/components/landing/InfoPage";

const articles = [
  { title: "Pourquoi réserver un panier anti-gaspi ?", text: "Comprendre le principe des paniers d’invendus et leur intérêt pour les commerces comme pour les habitants.", href: "/blog/anti-waste-baskets" },
  { title: "Le retrait chez le commerçant, simplement", text: "Les informations à vérifier avant de réserver : adresse, créneau, prix et code de collecte.", href: "/blog/clear-pickup" },
  { title: "Les commerces de quartier au cœur de KULHA!", text: "Boulangeries, cafés, restaurants et épiceries : une démarche locale construite avec les commerçants.", href: "/blog/local-shops" },
];

export const metadata = { title: "Conseils anti-gaspi | KULHA!" };
export default function Page() {
  return <InfoPage eyebrow="LE CARNET KULHA!" title="Moins de gaspillage, plus de bonnes trouvailles." lead="Des repères simples autour des paniers anti-gaspillage, du retrait chez les commerces et de la vie de quartier.">
    <div className="content-list">{articles.map((article) => <article className="content-tile" key={article.href}><h2>{article.title}</h2><p>{article.text}</p><Link href={article.href}>Lire l’article ↗</Link></article>)}</div>
  </InfoPage>;
}
