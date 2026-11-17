import type { NextRequest } from "next/server";
import { forwardPublicOfferRequest } from "@/lib/bff/public-offers";

type OfferRouteContext = { params: Promise<{ id: string }> };

async function handle(request: NextRequest, context: OfferRouteContext) {
  const { id } = await context.params;
  return forwardPublicOfferRequest(request, [id]);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
