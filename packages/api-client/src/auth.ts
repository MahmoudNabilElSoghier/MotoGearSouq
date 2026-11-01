import type { LoginInput } from "@motogearsouq/shared";
import { apiGet, apiSend, setAccessToken } from "./client";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export const authApi = {
  async login(
    input: LoginInput,
  ): Promise<{ accessToken: string; user: { id: string; email: string; role: string } }> {
    const res = (
      await apiSend<{
        accessToken: string;
        user: { id: string; email: string; role: string };
      }>("POST", "/auth/login", input)
    ).data;
    setAccessToken(res.accessToken);
    return res;
  },

  async refresh(): Promise<string> {
    const res = (await apiSend<{ accessToken: string }>("POST", "/auth/refresh")).data;
    setAccessToken(res.accessToken);
    return res.accessToken;
  },

  async logout(): Promise<void> {
    try {
      await apiSend("POST", "/auth/logout");
    } finally {
      setAccessToken(null);
    }
  },

  async me(): Promise<AuthUser> {
    return apiGet<AuthUser>("/auth/me");
  },
};
