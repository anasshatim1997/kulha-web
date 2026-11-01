import { notFound } from "next/navigation";
import { InfoPage } from "@/components/landing/InfoPage";

const posts: Record<string, { title: string; lead: string; body: string[] }> = {
  "anti-waste-baskets": {
    title: "Pourquoi réserver un panier anti-gaspi ?",
    lead: "Un panier d’invendus donne une nouvelle possibilité à des produits alimentaires encore proposés par un commerce.",
    body: [
      "Les boulangeries, cafés, restaurants et commerces alimentaires peuvent se retrouver avec des produits qui n’ont pas été vendus à la fin de la journée ou d’un service. Selon leur nature et les conditions de conservation, certains peuvent être proposés dans un panier à prix réduit.",
      "Le principe de KULHA! est de rendre ces offres visibles : le commerce décrit le panier, fixe son prix et sa quantité, puis indique le créneau pendant lequel le client peut venir le récupérer.",
      "Avant de réserver, prenez le temps de lire la description, le prix en MAD, l’adresse, le créneau et toutes les informations alimentaires fournies. Les ingrédients et allergènes non confirmés ne doivent jamais être supposés.",
    ],
  },
  "clear-pickup": {
    title: "Le retrait chez le commerçant, simplement",
    lead: "Une réservation réussie doit toujours indiquer où et quand récupérer le panier.",
    body: [
      "Chaque offre KULHA! est pensée autour d’un point de retrait précis. Vérifiez le nom du commerce, son adresse et le créneau proposé avant de confirmer.",
      "Après validation de la réservation, le client présente son code de retrait au commerçant pendant la période indiquée. Le code est conçu pour confirmer la collecte une seule fois.",
      "Le commerçant confirme la collecte avec un code à usage unique, afin que chaque réservation soit validée une seule fois.",
    ],
  },
  "local-shops": {
    title: "Les commerces de quartier au cœur de KULHA!",
    lead: "Une démarche locale qui se construit avec les commerces marocains.",
    body: [
      "Les boulangeries, cafés, restaurants, épiceries et supermarchés connaissent leurs produits, leurs quantités et leurs horaires. KULHA! veut leur donner un moyen simple de proposer leurs invendus alimentaires en paniers à prix réduit.",
      "Le commerçant garde la main sur la description, le prix, le stock et le créneau de collecte. Les offres ne sont visibles que lorsque le commerce et le panier répondent aux règles de publication prévues.",
      "La zone pilote et les commerces participants seront annoncés lorsqu’ils auront été confirmés. KULHA! ne présente pas de commerce comme partenaire sans accord officiel.",
    ],
  },
};

export function generateStaticParams() { return Object.keys(posts).map((slug) => ({ slug })); }
export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return params.then(({ slug }) => ({ title: `${posts[slug]?.title ?? "KULHA!"} | KULHA!` }));
}
export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) notFound();
  return <InfoPage eyebrow="LE CARNET KULHA! · ANTI-GASPI" title={post.title} lead={post.lead}><article className="content-panel">{post.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</article></InfoPage>;
}
