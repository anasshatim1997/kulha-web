import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

/** Starts the Google authorization-code flow on the configured Spring Security backend.
 * OAuth state, callback validation and session establishment remain owned by the backend.
 */
export function GET() {
  const config = getConfig();
  const backendOrigin = new URL(config.apiBaseUrl);
  const authorizationUrl = new URL(config.googleOAuthAuthorizationPath, backendOrigin);
  return NextResponse.redirect(authorizationUrl, {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
