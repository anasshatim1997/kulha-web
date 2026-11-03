import type { NextRequest } from "next/server";
import { handleVerifyEmail } from "@/lib/bff/session";

export async function POST(request: NextRequest) {
  return handleVerifyEmail(request);
}
