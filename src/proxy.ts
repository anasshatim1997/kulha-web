import { NextResponse, type NextRequest } from "next/server";
import { securityHeaders } from "@/lib/security/headers";

function secure(response: NextResponse, request: NextRequest): NextResponse {
  for (const [name, value] of Object.entries(securityHeaders(process.env.NODE_ENV ?? "development", request.nextUrl.protocol, request.nextUrl.pathname))) {
    response.headers.set(name, value);
  }
  return response;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (/^\/fr(?:\/|$)/.test(pathname)) {
    const target = request.nextUrl.clone();
    target.pathname = pathname.replace(/^\/fr(?=\/|$)/, "") || "/";
    return secure(NextResponse.redirect(target, 308), request);
  }
  if (/^\/(?:ary|ary-latn)(?:\/|$)/.test(pathname)) {
    const target = request.nextUrl.clone();
    target.pathname = pathname.replace(/^\/(?:ary|ary-latn)(?=\/|$)/, "/ar") || "/ar";
    return secure(NextResponse.redirect(target, 308), request);
  }

  const protectedPath = /^\/(?:account|merchant|admin|reservations)(?:\/|$)/.test(pathname)
    || /^\/(?:en|ar)\/(?:account|merchant|reservations)(?:\/|$)/.test(pathname);
  if (protectedPath && !request.cookies.has("kulha_rt")) {
    const prefix = pathname.startsWith("/en/") ? "/en" : pathname.startsWith("/ar/") ? "/ar" : "";
    const login = new URL(`${prefix}/login`, request.url);
    login.searchParams.set("next", pathname + request.nextUrl.search);
    return secure(NextResponse.redirect(login), request);
  }
  const forwardedHeaders = new Headers(request.headers);
  const requestedBffLocale = forwardedHeaders.get("x-kulha-locale");
  const bffLocale = pathname.startsWith("/api/bff/")
    && (requestedBffLocale === "fr" || requestedBffLocale === "en" || requestedBffLocale === "ar")
      ? requestedBffLocale
      : null;
  const pageLocale = bffLocale ?? (pathname === "/ar" || pathname.startsWith("/ar/")
    ? "ar"
    : pathname === "/en" || pathname.startsWith("/en/")
      ? "en"
      : "fr");
  forwardedHeaders.set("x-kulha-locale", pageLocale);

  // French is the canonical unprefixed locale. Resolve those public page URLs
  // to the [locale] route segment internally without changing the browser URL.
  const isLocalizedPath = /^\/(?:en|ar)(?:\/|$)/.test(pathname);
  const isInternalPath = /^\/(?:api|_next|_vercel)(?:\/|$)/.test(pathname);
  const isFilePath = /\.[^/]+$/.test(pathname);
  // The root URL has its own French landing page at src/app/page.tsx.
  // Do not rewrite `/` to `/fr`: the [locale] landing route is reserved for
  // the explicitly prefixed English and Arabic pages.
  if (pathname !== "/" && !isLocalizedPath && !isInternalPath && !isFilePath) {
    const target = request.nextUrl.clone();
    target.pathname = `/fr${pathname}`;
    return secure(NextResponse.rewrite(target, { request: { headers: forwardedHeaders } }), request);
  }

  return secure(NextResponse.next({ request: { headers: forwardedHeaders } }), request);
}

export const config = { matcher: ["/:path*"] };
