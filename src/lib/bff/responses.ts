import { NextResponse } from "next/server";

/** An error in the same shape as the API's Problem Details responses. */
export function problemResponse(status: number, title: string, detail?: string): NextResponse {
  return new NextResponse(JSON.stringify({ type: "about:blank", title, status, detail }), {
    status,
    headers: { "Content-Type": "application/problem+json", "Cache-Control": "no-store" },
  });
}

/** Copies an API response, keeping only the headers the browser needs. */
export async function copyResponse(upstream: Response): Promise<NextResponse> {
  const headers = new Headers({ "Cache-Control": "no-store" });
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const retryAfter = upstream.headers.get("retry-after");
  if (retryAfter) headers.set("Retry-After", retryAfter);
  const hasBody = upstream.status !== 204 && upstream.status !== 205;
  return new NextResponse(hasBody ? await upstream.text() : null, { status: upstream.status, headers });
}
