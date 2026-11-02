import { isIP } from "node:net";
import { getConfig } from "@/lib/config";

export class BackendUnavailableError extends Error {
  constructor() {
    super("The API is not reachable");
  }
}

export type BackendRequestInit = {
  method: string;
  body?: string;
  accessToken?: string;
  clientIp?: string;
  bffAuthenticated?: boolean;
};

/** Calls the Spring Boot API from the server. Never used from the browser. */
export async function backendRequest(path: string, init: BackendRequestInit): Promise<Response> {
  const config = getConfig();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.accessToken) headers["Authorization"] = `Bearer ${init.accessToken}`;
  if (init.clientIp && isIP(init.clientIp) !== 0 && config.bffSharedSecret) {
    headers["X-Kulha-Client-IP"] = init.clientIp;
  }
  if ((init.bffAuthenticated || (init.clientIp && isIP(init.clientIp) !== 0)) && config.bffSharedSecret) {
    headers["X-Kulha-Bff-Secret"] = config.bffSharedSecret;
  }
  try {
    return await fetch(`${config.apiBaseUrl}${path}`, {
      method: init.method,
      headers,
      body: init.body,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new BackendUnavailableError();
  }
}
