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

type RequestOptions = {
  method?: string;
  body?: unknown;
  timeoutMs?: number;
  headers?: Record<string, string>;
};

function activeLocale(): "fr" | "en" | "ar" {
  if (typeof window === "undefined") return "fr";
  const match = window.location.pathname.match(/^\/(en|ar)(?:\/|$)/);
  return match?.[1] === "ar" ? "ar" : match?.[1] === "en" ? "en" : "fr";
}

function localizedOptions(options: RequestOptions = {}): RequestOptions {
  return {
    ...options,
    headers: {
      "x-kulha-locale": activeLocale(),
      ...options.headers,
    },
  };
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

export async function requestJson<T = void>(url: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 30000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
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

/** Calls to the Spring Boot API through the same-origin BFF and HttpOnly session cookies. */
export const api = {
  get: <T>(path: string) => requestJson<T>(`/api/bff${path}`, localizedOptions()),
  post: <T = void>(path: string, body?: unknown, requestOptions: Omit<RequestOptions, "method" | "body"> = {}) =>
    requestJson<T>(`/api/bff${path}`, localizedOptions({ method: "POST", body: body ?? {}, ...requestOptions })),
  put: <T>(path: string, body: unknown) =>
    requestJson<T>(`/api/bff${path}`, localizedOptions({ method: "PUT", body })),
  patch: <T>(path: string, body: unknown = {}) =>
    requestJson<T>(`/api/bff${path}`, localizedOptions({ method: "PATCH", body })),
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
