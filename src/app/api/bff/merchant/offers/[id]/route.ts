import type { NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/bff/forward";
type Context = { params: Promise<{ id: string }> };
async function handle(request: NextRequest, context: Context) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  return forwardToBackend(request, ["merchants", "me", "offers", id]);
}
export async function GET(request: NextRequest, context: Context) { return handle(request, context); }
export async function PUT(request: NextRequest, context: Context) { return handle(request, context); }
export async function DELETE(request: NextRequest, context: Context) { return handle(request, context); }
