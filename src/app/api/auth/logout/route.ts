import type { NextRequest } from "next/server";
import { handleLogout } from "@/lib/bff/session";

export async function POST(request: NextRequest) {
  return handleLogout(request);
}
