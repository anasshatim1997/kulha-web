import { isIP } from "node:net";

/**
 * The edge proxy must overwrite X-Real-IP with the connecting client address.
 * Never use X-Forwarded-For or the internal X-Kulha-* headers from the request.
 */
export function trustedProxyClientIp(headers: Headers): string | undefined {
  const value = headers.get("x-real-ip");
  if (!value || value.trim() !== value || isIP(value) === 0) return undefined;
  return value;
}
