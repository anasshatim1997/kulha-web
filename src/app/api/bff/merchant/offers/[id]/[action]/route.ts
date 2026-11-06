import type { NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/bff/forward";
type Context = { params: Promise<{ id: string; action: string }> };
export async function POST(request: NextRequest, context: Context) {
  const { id, action } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["publish", "unpublish", "duplicate"].includes(action)) return new Response("Not found", { status: 404 });
  return forwardToBackend(request, ["merchants", "me", "offers", id, action]);
}
