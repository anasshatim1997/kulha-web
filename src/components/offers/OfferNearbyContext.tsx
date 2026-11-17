"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { PublicOfferPage } from "@/lib/offers/public-api";

type NearbyContextValue = {
  results: PublicOfferPage | null;
  setResults: (page: PublicOfferPage) => void;
  clearResults: () => void;
};

const NearbyContext = createContext<NearbyContextValue | null>(null);

export function OfferNearbyProvider({ children }: { children: ReactNode }) {
  const [results, setResultsState] = useState<PublicOfferPage | null>(null);
  const setResults = useCallback((page: PublicOfferPage) => setResultsState(page), []);
  const clearResults = useCallback(() => setResultsState(null), []);
  const value = useMemo(() => ({ results, setResults, clearResults }), [results, setResults, clearResults]);
  return <NearbyContext.Provider value={value}>{children}</NearbyContext.Provider>;
}

export function useOfferNearby() {
  const value = useContext(NearbyContext);
  if (!value) throw new Error("useOfferNearby must be used inside OfferNearbyProvider");
  return value;
}
