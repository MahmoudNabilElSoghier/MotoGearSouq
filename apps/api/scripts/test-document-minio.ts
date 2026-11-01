import "dotenv/config";
import http from "http";
import crypto from "crypto";
import { spawn } from "child_process";

async function main() {
  process.env.STORAGE_DRIVER = "minio";
  console.log("Starting API with STORAGE_DRIVER=minio...");
  const api = spawn("pnpm", ["--filter", "@motogearsouq/api", "start"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  // Wait for API to boot
  await new Promise((resolve) => setTimeout(resolve, 6000));

  const adminApiKey = process.env.ADMIN_API_KEY || "change-me-generate-a-real-key";
  const content = Buffer.from("%PDF-1.4 test document content for minio upload test " + Date.now());
  const expectedMd5 = crypto.createHash("md5").update(content).digest("hex");

  const boundary = "----FormBoundary" + Math.random().toString(16);
  const formData = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="entityType"\r\n\r\nPRODUCT\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="entityId"\r\n\r\nprod-test-123\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="t.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
    content,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const reqOptions: http.RequestOptions = {
    hostname: "localhost",
    port: 4000,
    path: "/api/documents",
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data; boundary=" + boundary,
      "Content-Length": formData.length,
      "x-admin-api-key": adminApiKey,
    },
  };

  const uploadResult = await new Promise<{ status: number; body: string }>((resolve) => {
    const req = http.request(reqOptions, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode || 0, body: d }));
    });
    req.write(formData);
    req.end();
  });

  console.log("Upload response status:", uploadResult.status, uploadResult.body);
  if (uploadResult.status !== 201) {
    console.error("Upload failed");
    api.kill();
    process.exit(1);
  }

  const doc = JSON.parse(uploadResult.body).data;
  console.log("Uploaded document ID:", doc.id);

  // Get download URL
  const dlResult = await new Promise<{ status: number; body: string }>((resolve) => {
    http.get(`http://localhost:4000/api/documents/${doc.id}/download`, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode || 0, body: d }));
    });
  });

  console.log("Download URL response:", dlResult.status, dlResult.body);
  const dlInfo = JSON.parse(dlResult.body).data;
  console.log("Presigned URL:", dlInfo.url);

  if (dlInfo.url.includes("localhost:9010")) {
    console.log("PASS: Presigned URL points to localhost:9010");
  } else {
    console.error("FAIL: Presigned URL does not point to localhost:9010");
    api.kill();
    process.exit(1);
  }

  // Fetch file from presigned URL
  const fileBuffer = await new Promise<Buffer>((resolve) => {
    http.get(dlInfo.url, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    });
  });

  const downloadedMd5 = crypto.createHash("md5").update(fileBuffer).digest("hex");
  console.log("Expected MD5:", expectedMd5);
  console.log("Downloaded MD5:", downloadedMd5);

  if (expectedMd5 === downloadedMd5) {
    console.log("PASS: Downloaded file MD5 matches uploaded content!");
  } else {
    console.error("FAIL: MD5 mismatch!");
    api.kill();
    process.exit(1);
  }

  api.kill();
  console.log("Document upload/download MinIO smoke test PASSED.");
}

main().catch((err) => {
  console.error("Error in smoke test:", err);
  process.exit(1);
});
