import { NextResponse } from "next/server";

/** An error in the same shape as the API's Problem Details responses. */
export function problemResponse(status: number, title: string, detail?: string): NextResponse {
  return new NextResponse(JSON.stringify({ type: "about:blank", title, status, detail }), {
    status,
    headers: { "Content-Type": "application/problem+json", "Cache-Control": "no-store" },
  });
}

function forwardedContentType(upstream: Response): string | null {
  const contentType = upstream.headers.get("content-type");
  if (!contentType) return null;
  const [mediaType, ...parameters] = contentType.split(";");
  if (!/^application\/(?:[a-z0-9.+-]+\+)?json$/i.test(mediaType.trim())) return contentType;
  const preservedParameters = parameters.filter((parameter) => !/^\s*charset\s*=/i.test(parameter));
  return [mediaType.trim(), ...preservedParameters, "charset=utf-8"].join("; ");
}

function responseBody(upstream: Response): ReadableStream<Uint8Array> | null {
  return upstream.status === 204 || upstream.status === 205 ? null : upstream.body;
}

export async function copyResponse(upstream: Response): Promise<NextResponse> {
  const headers = new Headers({ "Cache-Control": "no-store" });
  const contentType = forwardedContentType(upstream);
  if (contentType) headers.set("Content-Type", contentType);
  const retryAfter = upstream.headers.get("retry-after");
  if (retryAfter) headers.set("Retry-After", retryAfter);
  return new NextResponse(responseBody(upstream), { status: upstream.status, headers });
}

/** Public read-only BFF responses may be cached briefly; errors stay private and immediately retryable. */
export async function copyPublicResponse(upstream: Response): Promise<NextResponse> {
  const headers = new Headers({
    "Cache-Control": upstream.ok ? "public, max-age=0, s-maxage=30" : "no-store",
  });
  const contentType = forwardedContentType(upstream);
  if (contentType) headers.set("Content-Type", contentType);
  const retryAfter = upstream.headers.get("retry-after");
  if (retryAfter) headers.set("Retry-After", retryAfter);
  return new NextResponse(responseBody(upstream), { status: upstream.status, headers });
}
