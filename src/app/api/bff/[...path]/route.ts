import type { NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/bff/forward";

async function handle(request: NextRequest, context: RouteContext<"/api/bff/[...path]">) {
  const { path } = await context.params;
  return forwardToBackend(request, path);
}

export async function GET(request: NextRequest, context: RouteContext<"/api/bff/[...path]">) {
  return handle(request, context);
}
export async function POST(request: NextRequest, context: RouteContext<"/api/bff/[...path]">) {
  return handle(request, context);
}
export async function PUT(request: NextRequest, context: RouteContext<"/api/bff/[...path]">) {
  return handle(request, context);
}
export async function PATCH(request: NextRequest, context: RouteContext<"/api/bff/[...path]">) {
  return handle(request, context);
}
export async function DELETE(request: NextRequest, context: RouteContext<"/api/bff/[...path]">) {
  return handle(request, context);
}
