import type { NextRequest } from "next/server";
import { handleLogin } from "@/lib/bff/session";

export async function POST(request: NextRequest) {
  return handleLogin(request);
}
