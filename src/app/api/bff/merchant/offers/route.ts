import type { NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/bff/forward";
const path = ["merchants", "me", "offers"];
export async function GET(request: NextRequest) { return forwardToBackend(request, path); }
export async function POST(request: NextRequest) { return forwardToBackend(request, path); }
