export type Lang = "fr" | "ar";
export const T = {
  fr: {
    headline: "Des paniers à récupérer près de chez vous", search: "Rechercher un commerce ou un panier",
    filters: "Filtres", category: "Catégorie", all: "Toutes", district: "Quartier", allDistricts: "Tous les quartiers",
    maxPrice: "Prix maximum", onlyAvail: "Masquer les paniers épuisés", reset: "Réinitialiser",
    sort: "Trier par", sortSoon: "Retrait le plus proche", sortPrice: "Prix croissant", sortSave: "Plus grosse économie",
    today: "Aujourd’hui", tomorrow: "Demain", pickup: "Retrait", left: (n: number) => `${n} restant${n > 1 ? "s" : ""}`,
    last: (n: number) => `Plus que ${n}`, soldOut: "Épuisé", reserve: "Réserver", saves: (n: number) => `-${n} %`,
    allergens: "Allergènes", unknown: "Allergènes non renseignés", results: (n: number) => `${n} panier${n > 1 ? "s" : ""} disponible${n > 1 ? "s" : ""}`,
    emptyTitle: "Aucun panier ne correspond", emptyBody: "Élargissez le quartier ou le prix maximum pour voir plus d’offres.",
    cat: { bakery: "Boulangerie", restaurant: "Restaurant", grocery: "Supermarché", cafe: "Café" },
    note: "Les prix sont en dirhams (MAD). Les informations alimentaires sont celles déclarées par le commerçant.",
  },
  ar: {
    headline: "سلال طعام قريبة منك بأسعار مخفضة", search: "ابحث عن متجر أو سلة",
    filters: "التصفية", category: "الفئة", all: "الكل", district: "الحي", allDistricts: "كل الأحياء",
    maxPrice: "الحد الأقصى للسعر", onlyAvail: "إخفاء السلال المنتهية", reset: "إعادة التعيين",
    sort: "الترتيب حسب", sortSoon: "أقرب موعد استلام", sortPrice: "السعر الأقل", sortSave: "أكبر توفير",
    today: "اليوم", tomorrow: "غدًا", pickup: "الاستلام", left: (n: number) => `متبقي ${n}`,
    last: (n: number) => `بقي ${n} فقط`, soldOut: "نفدت", reserve: "احجز", saves: (n: number) => `-${n}٪`,
    allergens: "مسببات الحساسية", unknown: "مسببات الحساسية غير مذكورة", results: (n: number) => `${n} سلة متاحة`,
    emptyTitle: "لا توجد سلال مطابقة", emptyBody: "وسّع الحي أو الحد الأقصى للسعر لعرض عروض أكثر.",
    cat: { bakery: "مخبزة", restaurant: "مطعم", grocery: "سوق ممتاز", cafe: "مقهى" },
    note: "الأسعار بالدرهم المغربي. معلومات الطعام هي التي صرّح بها التاجر.",
  },
};
