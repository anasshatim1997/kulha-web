import type { NextRequest } from "next/server";
import { forwardPublicOfferRequest } from "@/lib/bff/public-offers";

export async function GET(request: NextRequest) {
  return forwardPublicOfferRequest(request, ["suggestions"]);
}

const handleUnsupportedMutation = (request: NextRequest) => forwardPublicOfferRequest(request, ["suggestions"]);

export const POST = handleUnsupportedMutation;
export const PUT = handleUnsupportedMutation;
export const PATCH = handleUnsupportedMutation;
export const DELETE = handleUnsupportedMutation;
