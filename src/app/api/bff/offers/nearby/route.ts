import type { NextRequest } from "next/server";
import { forwardPublicNearbyRequest } from "@/lib/bff/public-offers";

export async function POST(request: NextRequest) {
  return forwardPublicNearbyRequest(request);
}
