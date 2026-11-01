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
};

/** Calls the Spring Boot API from the server. Never used from the browser. */
export async function backendRequest(path: string, init: BackendRequestInit): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.accessToken) headers["Authorization"] = `Bearer ${init.accessToken}`;
  try {
    return await fetch(`${getConfig().apiBaseUrl}${path}`, {
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
