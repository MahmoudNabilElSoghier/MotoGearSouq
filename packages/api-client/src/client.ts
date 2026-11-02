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

const baseUrl = (): string => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? "/api";
  }
  const origin = process.env.API_ORIGIN ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  return origin.startsWith("http") ? `${origin}/api` : origin;
};

async function request<T>(
  path: string,
  init: RequestInit & { method?: string } = {},
  isRetry = false,
): Promise<ApiResponse<T>> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) {
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
        if (!refreshPromise) {
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
        }
        const newToken = await refreshPromise;
        headers.set("authorization", `Bearer ${newToken}`);
        return request<T>(path, { ...init, headers }, true);
      } catch {
        inMemoryAccessToken = null;
        if (typeof window !== "undefined") {
          window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
        }
      }
    }
  }

  if (!response.ok) {
    let message = `Request failed with HTTP ${response.status}`;
    let errorBody: unknown = null;
    try {
      errorBody = await response.json();
      const bodyObj = errorBody as { message?: string | string[] };
      if (Array.isArray(bodyObj.message)) message = bodyObj.message.join("; ");
      else if (bodyObj.message) message = bodyObj.message;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(response.status, message, errorBody);
  }

  return (await response.json()) as ApiResponse<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  return (await request<T>(path)).data;
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
): Promise<ApiResponse<T>> {
  return request<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

// For endpoints whose body is the payload itself (no { data } wrapper) —
// e.g. GET /purchases and GET /stock-movements return { items, total, ... }.
export async function apiRaw<T>(path: string): Promise<T> {
  return (await request<T>(path)) as unknown as T;
}
