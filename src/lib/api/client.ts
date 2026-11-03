/** Browser-side calls. They only talk to this web app's own /api routes, never to the Spring Boot API. */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly title: string,
    readonly detail?: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(detail ?? title);
    this.name = "ApiError";
  }

  /** Status 0 means the request never reached the server. */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  let title = response.statusText || "Error";
  let detail: string | undefined;
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null) {
      const problem = body as { title?: unknown; detail?: unknown };
      if (typeof problem.title === "string") title = problem.title;
      if (typeof problem.detail === "string") detail = problem.detail;
    }
  } catch {
    // The answer was not JSON; keep the defaults.
  }
  const retryAfter = Number(response.headers.get("retry-after"));
  return new ApiError(response.status, title, detail, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined);
}

export async function requestJson<T = void>(url: string, options: { method?: string; body?: unknown; timeoutMs?: number } = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 30000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw await toApiError(response);
    if (response.status === 204 || response.status === 202) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(408, "Request timed out", "The server did not respond in time. Please try again.");
    }
    if (error instanceof TypeError) throw new ApiError(0, "Network error");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/** Calls to the Spring Boot API, through the web app's backend-for-frontend. */
export const api = {
  get: <T>(path: string) => requestJson<T>(`/api/bff${path}`),
  post: <T = void>(path: string, body?: unknown, requestOptions: { timeoutMs?: number } = {}) => requestJson<T>(`/api/bff${path}`, { method: "POST", body: body ?? {}, ...requestOptions }),
  put: <T>(path: string, body: unknown) => requestJson<T>(`/api/bff${path}`, { method: "PUT", body }),
};

/** Login and logout set or clear the HttpOnly cookies, so they have their own routes. */
export const authApi = {
  login: (email: string, password: string) =>
    requestJson<{ ok: true }>("/api/auth/login", { method: "POST", body: { email, password }, timeoutMs: 30000 }),
  logout: () => requestJson("/api/auth/logout", { method: "POST", body: {} }),
  /** Confirms the email address and, when `signedIn` is true, the HttpOnly session cookies are already set. */
  verifyEmail: (token: string) =>
    requestJson<{ ok: true; signedIn: boolean }>("/api/auth/verify-email", { method: "POST", body: { token }, timeoutMs: 30000 }),
};
