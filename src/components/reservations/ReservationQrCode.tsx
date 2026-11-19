"use client";

import { useMemo } from "react";
import { encodePickupQr, pickupQrPath } from "@/lib/qr/pickup-qr";

export function ReservationQrCode({ payload, label }: { payload: string; label: string }) {
  const path = useMemo(() => pickupQrPath(encodePickupQr(payload)), [payload]);
  return (
    <svg className="kulha-pickup-qr" viewBox="0 0 41 41" role="img" aria-label={label} shapeRendering="crispEdges">
      <rect x="0" y="0" width="41" height="41" fill="#fff" />
      <path d={path} fill="#073324" />
    </svg>
  );
}
