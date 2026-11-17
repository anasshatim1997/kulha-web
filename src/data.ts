// MOCK DATA — shape inferred from the product spec. Replace with GET /api/v1/offers.
export type Day = "today" | "tomorrow";
export type Category = "bakery" | "restaurant" | "grocery" | "cafe";
export interface Offer {
  id: string; title: string; merchant: string; district: string; category: Category;
  price: number; refPrice?: number; // refPrice only when verifiable
  remaining: number; day: Day; from: string; to: string;
  food: string; allergens: string | null; // null = "Non renseigné", never guessed
}
export const OFFERS: Offer[] = [
  { id: "o1", title: "Panier viennoiseries", merchant: "Boulangerie Atlas", district: "Maârif", category: "bakery", price: 25, refPrice: 70, remaining: 2, day: "today", from: "18:30", to: "19:30", food: "Croissants, pains au chocolat, baguette", allergens: "Gluten, lait, œufs" },
  { id: "o2", title: "Panier du soir", merchant: "Café Habous", district: "Habous", category: "cafe", price: 30, remaining: 6, day: "today", from: "19:00", to: "20:00", food: "Pâtisseries orientales et sandwichs", allergens: null },
  { id: "o3", title: "Plats du jour", merchant: "Dar Zitoun", district: "Gauthier", category: "restaurant", price: 45, refPrice: 110, remaining: 4, day: "today", from: "21:30", to: "22:15", food: "Tajine ou couscous, portion individuelle", allergens: "Gluten, fruits à coque" },
  { id: "o4", title: "Fruits et légumes", merchant: "Marjane Californie", district: "Californie", category: "grocery", price: 20, refPrice: 55, remaining: 0, day: "today", from: "20:00", to: "21:00", food: "Assortiment de saison, 3 kg environ", allergens: null },
  { id: "o5", title: "Pains et msemen", merchant: "Boulangerie Atlas", district: "Maârif", category: "bakery", price: 15, remaining: 9, day: "tomorrow", from: "07:30", to: "09:00", food: "Pains du jour et msemen", allergens: "Gluten" },
  { id: "o6", title: "Panier déjeuner", merchant: "Chez Lahcen", district: "Ain Diab", category: "restaurant", price: 40, refPrice: 95, remaining: 3, day: "tomorrow", from: "15:00", to: "16:00", food: "Salade, plat chaud et dessert", allergens: null },
  { id: "o7", title: "Épicerie fraîche", merchant: "Carrefour Market", district: "Bourgogne", category: "grocery", price: 35, refPrice: 90, remaining: 1, day: "tomorrow", from: "19:30", to: "20:30", food: "Produits laitiers et charcuterie, DLC à lire", allergens: "Lait" },
];
