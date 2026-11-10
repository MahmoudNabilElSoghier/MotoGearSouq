export interface ApiResponse<T> {
  data: T;
  isMock: boolean;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let inMemoryAccessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

export const setAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token;
};

export const getAccessToken = (): string | null => inMemoryAccessToken;

export function ensureAuth(force = false): Promise<string> {
  if (refreshPromise) return refreshPromise;
  if (!force && inMemoryAccessToken) return Promise.resolve(inMemoryAccessToken);
  refreshPromise = (async () => {
    const res = await fetch(`${baseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Refresh failed");
    const json = (await res.json()) as ApiResponse<{ accessToken: string }>;
    const newToken = json.data.accessToken;
    inMemoryAccessToken = newToken;
    return newToken;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

const baseUrl = (): string => {
  // Single source of truth: NEXT_PUBLIC_API_URL (client) or API_ORIGIN (server).
  // Appends "/api" only when the env var points to a bare origin (no /api suffix).
  const env =
    (typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_URL
      : process.env.API_ORIGIN ?? process.env.NEXT_PUBLIC_API_URL) ?? "/api";
  if (env === "/api" || env.endsWith("/api")) return env;
  if (env.startsWith("http")) return `${env}/api`;
  return "/api";
};

export async function request<T>(
  path: string,
  init: RequestInit & { method?: string } = {},
  isRetry = false,
  skipAuthRedirect = false,
): Promise<ApiResponse<T>> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (inMemoryAccessToken && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${inMemoryAccessToken}`);
  }

  if (init.method && init.method !== "GET" && typeof window === "undefined" && process.env.ADMIN_API_KEY) {
    headers.set("x-admin-api-key", process.env.ADMIN_API_KEY);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers,
      cache: "no-store",
      credentials: "include",
    });
  } catch (error) {
    throw new ApiError(
      0,
      `API unreachable at ${baseUrl()}${path} (${error instanceof Error ? error.message : String(error)}) — is apps/api running?`,
    );
  }

  if (response.status === 401 && !path.startsWith("/auth/")) {
    if (!isRetry) {
      try {
        const newToken = await ensureAuth(true);
        headers.set("authorization", `Bearer ${newToken}`);
        return request<T>(path, { ...init, headers }, true);
      } catch {
        inMemoryAccessToken = null;
        if (typeof window !== "undefined" && !skipAuthRedirect) {
          // Customer-facing routes (cart, orders, products, etc.) must redirect
          // to the customer login, NOT the admin login.
          const loginPath = path.startsWith("/admin") ? "/admin/login" : "/login";
          window.location.href = `${loginPath}?next=${encodeURIComponent(window.location.pathname)}`;
        } else if (typeof window !== "undefined") {
          // skipAuthRedirect: throw so the caller can handle the 401 without redirecting.
          throw new ApiError(401, "Authentication required");
        }
      }
    }
  }

  if (!response.ok) {
    let message = `Request failed with HTTP ${response.status}`;
    let errorBody: unknown = null;
    try {
      const text = await response.text();
      errorBody = text ? JSON.parse(text) : null;
      const bodyObj = errorBody as { message?: string | string[] };
      if (Array.isArray(bodyObj.message)) message = bodyObj.message.join("; ");
      else if (bodyObj.message) message = bodyObj.message;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(response.status, message, errorBody);
  }

  // Safely parse JSON — an empty body (e.g. 500 with no content) would throw
  // "Unexpected end of JSON input" on response.json().
  let data: unknown = null;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return data as unknown as ApiResponse<T>;
}

export async function apiGet<T>(path: string, skipAuthRedirect = false): Promise<T> {
  return (await request<T>(path, {}, false, skipAuthRedirect)).data;
}

export async function apiGetOrNull<T>(path: string): Promise<T | null> {
  try {
    return await apiGet<T>(path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function apiSend<T>(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  skipAuthRedirect = false,
): Promise<ApiResponse<T>> {
  return request<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  }, false, skipAuthRedirect);
}

// For endpoints whose body is the payload itself (no { data } wrapper) —
// e.g. GET /purchases and GET /stock-movements return { items, total, ... }.
export async function apiRaw<T>(
  path: string,
  init?: RequestInit & { method?: string },
): Promise<T> {
  return (await request<T>(path, init)) as unknown as T;
}
