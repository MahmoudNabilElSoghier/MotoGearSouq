import "dotenv/config";
import http from "http";
import { spawn, execSync, type ChildProcess } from "child_process";

function request(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: unknown,
): Promise<{ status: number; headers: Record<string, unknown>; body: string }> {
  return new Promise((resolve, reject) => {
    const dataStr = body ? JSON.stringify(body) : "";
    const reqOptions: http.RequestOptions = {
      hostname: "127.0.0.1",
      port: 4000,
      path,
      method,
      headers: {
        ...headers,
        ...(body ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(dataStr) } : {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let d = "";
      res.on("data", (chunk) => (d += chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode || 0,
          headers: res.headers,
          body: d,
        });
      });
    });

    req.on("error", reject);
    if (body) req.write(dataStr);
    req.end();
  });
}

function extractCookie(setCookieHeader: string | string[] | undefined, name: string): string | undefined {
  if (!setCookieHeader) return undefined;
  const list = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const cookie of list) {
    const match = cookie.match(new RegExp(`${name}=([^;]+)`));
    if (match) return match[1];
  }
  return undefined;
}

async function runMatrix() {
  console.log("=== STARTING CURL MATRIX AUTOMATED SCRIPT ====");
  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || "ElsaadSecureAdmin2026!";
  const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@elsaad.com";

  let apiProcess: ChildProcess | null = null;

  async function startApi() {
    apiProcess = spawn("pnpm", ["--filter", "@motogearsouq/api", "start"], {
      stdio: "inherit",
      shell: true,
      env: process.env,
    });

    // Poll health endpoint until API is ready
    let healthy = false;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await request("GET", "/api/health");
        if (res.status === 200) {
          healthy = true;
          break;
        }
      } catch {
        // ignore connection refused while booting
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!healthy) {
      throw new Error("API failed to start within timeout");
    }
    console.log("API is healthy and ready.");
  }

  function stopApi() {
    if (apiProcess) {
      try {
        if (apiProcess.pid) {
          if (process.platform === "win32") {
            execSync(`taskkill /f /pid ${apiProcess.pid} /t`, { stdio: "ignore" });
          } else {
            apiProcess.kill("SIGKILL");
          }
        }
      } catch {
        // ignore if already dead
      }
      apiProcess = null;
    }
    // Wait a moment for port to be released
    execSync("node -e \"setTimeout(()=>{}, 1000)\"");
  }

  try {
    await startApi();

    // STEP 1: Wrong password -> 401
    console.log("\n[Step 1] Wrong password test...");
    const res1 = await request("POST", "/api/auth/login", {}, { email: bootstrapEmail, password: "wrongpassword" });
    console.log("Status:", res1.status, res1.body);
    if (res1.status !== 401) throw new Error(`Step 1 failed: expected 401, got ${res1.status}`);
    console.log("✔ Step 1 PASSED");

    // STEP 2: Correct login -> 200 + accessToken + Set-Cookie
    console.log("\n[Step 2] Correct login test...");
    const res2 = await request("POST", "/api/auth/login", {}, { email: bootstrapEmail, password: bootstrapPassword });
    console.log("Status:", res2.status);
    if (res2.status !== 200) throw new Error(`Step 2 failed: expected 200, got ${res2.status}`);
    const data2 = JSON.parse(res2.body).data;
    const accessToken = data2.accessToken;
    const rtCookie = extractCookie(res2.headers["set-cookie"], "elsaad_rt");
    if (!accessToken || !rtCookie) throw new Error("Step 2 failed: missing accessToken or elsaad_rt cookie");
    console.log("✔ Step 2 PASSED (got access token & refresh cookie)");

    // STEP 3: GET /api/products with Bearer -> 200
    console.log("\n[Step 3] GET /api/products with Bearer token...");
    const res3 = await request("GET", "/api/products", { Authorization: `Bearer ${accessToken}` });
    console.log("Status:", res3.status);
    if (res3.status !== 200) throw new Error(`Step 3 failed: expected 200, got ${res3.status}`);
    console.log("✔ Step 3 PASSED");

    // STEP 4: JWT TTL expiry (set JWT_ACCESS_TTL=2s, restart, login, wait 3s, use /api/auth/me -> 401)
    console.log("\n[Step 4] JWT TTL expiry test...");
    stopApi();

    process.env.JWT_ACCESS_TTL = "2s";
    await startApi();

    const res4Login = await request("POST", "/api/auth/login", {}, { email: bootstrapEmail, password: bootstrapPassword });
    const tokenShort = JSON.parse(res4Login.body).data.accessToken;
    console.log("Logged in with 2s TTL token. Waiting 3 seconds...");
    await new Promise((r) => setTimeout(r, 3100));

    const res4Get = await request("GET", "/api/auth/me", { Authorization: `Bearer ${tokenShort}` });
    console.log("Status after 3s:", res4Get.status, res4Get.body);
    if (res4Get.status !== 401) throw new Error(`Step 4 failed: expected 401 for expired token, got ${res4Get.status}`);

    // Restore TTL
    stopApi();
    process.env.JWT_ACCESS_TTL = "15m";
    await startApi();
    console.log("✔ Step 4 PASSED (TTL expired as expected, restored TTL to 15m)");

    // STEP 5: POST /auth/refresh with valid cookie -> 200 + new access + new cookie
    console.log("\n[Step 5] Refresh token rotation test...");
    const resLogin5 = await request("POST", "/api/auth/login", {}, { email: bootstrapEmail, password: bootstrapPassword });
    const initialRt = extractCookie(resLogin5.headers["set-cookie"], "elsaad_rt");

    const res5 = await request("POST", "/api/auth/refresh", { Cookie: `elsaad_rt=${initialRt}` });
    console.log("Status:", res5.status);
    if (res5.status !== 200) throw new Error(`Step 5 failed: expected 200, got ${res5.status}`);
    const data5 = JSON.parse(res5.body).data;
    const newAccessToken = data5.accessToken;
    const newRt = extractCookie(res5.headers["set-cookie"], "elsaad_rt");
    if (!newAccessToken || !newRt) throw new Error("Step 5 failed: missing rotated token data");
    console.log("✔ Step 5 PASSED (refreshed successfully)");

    // STEP 6: Reuse OLD (rotated) refresh cookie -> 401 + family revoked
    console.log("\n[Step 6] Reuse old rotated refresh token (Detection Test)...");
    const res6 = await request("POST", "/api/auth/refresh", { Cookie: `elsaad_rt=${initialRt}` });
    console.log("Status (expect 401):", res6.status, res6.body);
    if (res6.status !== 401) throw new Error(`Step 6 failed: expected 401 on reuse, got ${res6.status}`);
    console.log("✔ Step 6 PASSED (reuse detected and rejected)");

    // STEP 7: Logout with NEW cookie -> 200 + cookie cleared
    console.log("\n[Step 7] Logout test...");
    const resLogin7 = await request("POST", "/api/auth/login", {}, { email: bootstrapEmail, password: bootstrapPassword });
    const logoutRt = extractCookie(resLogin7.headers["set-cookie"], "elsaad_rt");

    const res7 = await request("POST", "/api/auth/logout", { Cookie: `elsaad_rt=${logoutRt}` });
    console.log("Status:", res7.status);
    if (res7.status !== 200) throw new Error(`Step 7 failed: expected 200, got ${res7.status}`);
    const clearCookieHeader = res7.headers["set-cookie"];
    console.log("Clear-Cookie header:", clearCookieHeader);
    console.log("✔ Step 7 PASSED");

    // STEP 8: Login again -> old family refresh token -> 401 (fully dead)
    console.log("\n[Step 8] Attempt refresh with logged out token...");
    const res8 = await request("POST", "/api/auth/refresh", { Cookie: `elsaad_rt=${logoutRt}` });
    console.log("Status (expect 401):", res8.status);
    if (res8.status !== 401) throw new Error(`Step 8 failed: expected 401, got ${res8.status}`);
    console.log("✔ Step 8 PASSED");

    // STEP 9: Rate limit test: 6 wrong logins -> 401x5 then 429
    console.log("\n[Step 9] Rate limit test (5 fails/5min -> 429)...");
    const testEmail = "ratelimit.test@elsaad.com";
    let lastStatus = 0;
    for (let i = 1; i <= 6; i++) {
      const r = await request("POST", "/api/auth/login", {}, { email: testEmail, password: "wrongpassword" });
      lastStatus = r.status;
      console.log(`Attempt ${i}: status ${r.status}`);
    }
    if (lastStatus !== 429) throw new Error(`Step 9 failed: expected 429 on 6th attempt, got ${lastStatus}`);

    // Restart API to reset in-memory rate limit map
    stopApi();
    await startApi();

    const res9AfterRestart = await request("POST", "/api/auth/login", {}, { email: bootstrapEmail, password: bootstrapPassword });
    console.log("Status after restart + correct login:", res9AfterRestart.status);
    if (res9AfterRestart.status !== 200) throw new Error("Step 9 failed: correct login after restart failed");
    console.log("✔ Step 9 PASSED");

    console.log("\n=== ALL 9 CURL MATRIX STEPS PASSED SUCCESSFULLY ===");
    stopApi();
    process.exit(0);
  } catch (error) {
    console.error("CURL MATRIX FAILED:", error);
    stopApi();
    process.exit(1);
  }
}

runMatrix();
