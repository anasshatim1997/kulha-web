import { NextResponse, type NextRequest } from "next/server";

/**
 * Convenience redirect only: pages that need a login send visitors without a session cookie to /login.
 * It is NOT a security control. Every API call is authorized again by the Spring Boot API.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has("kulha_rt")) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/account/:path*", "/merchant/:path*", "/admin/:path*"],
};
