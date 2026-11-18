export type ReservationAvailability = {
  offerId: string;
  offerTitle: string | null;
  merchantId: string | null;
  merchantName: string | null;
  availableUnits: number;
  maxQuantity: number;
  selectedQuantity: number;
  unitPriceMinor: number | null;
  totalPriceMinor: number | null;
  currency: "MAD";
  slots: Array<{ start: string; end: string; availableUnits: number }>;
};

export type Reservation = {
  reference: string;
  offerId: string;
  offerTitle: string;
  offerCategory: string;
  merchantId: string;
  merchantName: string;
  merchantAddress: string;
  merchantCity: string;
  merchantPickupInstructions: string | null;
  pickupStart: string;
  pickupEnd: string;
  pickupCode: string;
  quantity: number;
  unitPriceMinor: number;
  totalPriceMinor: number;
  currency: "MAD";
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  statusLabel: string;
  classification: "UPCOMING" | "PAST" | "CANCELLED";
  canCancel: boolean;
  pickupInstructions: string;
  createdAt: string;
};

export type ReservationPage = {
  items: Reservation[];
  page: number;
  size: number;
  total: number;
};
