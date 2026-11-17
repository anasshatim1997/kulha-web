import type { NextRequest } from "next/server";
import { forwardPublicOfferRequest } from "@/lib/bff/public-offers";

const handleUnsupportedMutation = (request: NextRequest) => forwardPublicOfferRequest(request, []);

export async function GET(request: NextRequest) {
  return forwardPublicOfferRequest(request, []);
}

export const POST = handleUnsupportedMutation;
export const PUT = handleUnsupportedMutation;
export const PATCH = handleUnsupportedMutation;
export const DELETE = handleUnsupportedMutation;
