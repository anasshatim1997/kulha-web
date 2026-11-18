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
  const pageLocale = pathname === "/ar" || pathname.startsWith("/ar/")
    ? "ar"
    : pathname === "/en" || pathname.startsWith("/en/")
      ? "en"
      : "fr";
  forwardedHeaders.set("x-kulha-locale", pageLocale);
  return secure(NextResponse.next({ request: { headers: forwardedHeaders } }), request);
}

export const config = { matcher: ["/:path*"] };
