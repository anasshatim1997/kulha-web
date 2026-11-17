import type { NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/bff/forward";

type PathRouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, context: PathRouteContext) {
  const { path } = await context.params;
  return forwardToBackend(request, path);
}

export async function GET(request: NextRequest, context: PathRouteContext) {
  return handle(request, context);
}
export async function POST(request: NextRequest, context: PathRouteContext) {
  return handle(request, context);
}
export async function PUT(request: NextRequest, context: PathRouteContext) {
  return handle(request, context);
}
export async function PATCH(request: NextRequest, context: PathRouteContext) {
  return handle(request, context);
}
export async function DELETE(request: NextRequest, context: PathRouteContext) {
  return handle(request, context);
}
