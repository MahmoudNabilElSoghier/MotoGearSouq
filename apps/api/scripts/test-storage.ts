// Phase 7 storage smoke test. Exercises whichever driver STORAGE_DRIVER selects
// (default: local). For minio it exits 0 with SKIPPED when the server is
// unreachable, so CI/dev machines without Docker stay green:
//   pnpm --filter @motogearsouq/api test:storage
import "dotenv/config";
import { ConfigService } from "@nestjs/config";
import { LocalStorageProvider } from "../src/storage/local.provider";
import { MinioStorageProvider } from "../src/storage/minio.provider";
import type { StorageProvider } from "../src/storage/storage.types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`storage test failed: ${message}`);
  }
}

async function main(): Promise<void> {
  const config = new ConfigService(process.env);
  const driver = config.get<string>("STORAGE_DRIVER", "local");
  const provider: StorageProvider =
    driver === "minio"
      ? new MinioStorageProvider(config)
      : new LocalStorageProvider(config);

  console.log(`[storage-test] driver=${provider.driver}`);

  if (provider.driver === "minio") {
    await (provider as MinioStorageProvider).onModuleInit();
    if (!(await provider.healthCheck())) {
      console.log(
        "[storage-test] SKIPPED — MinIO unreachable. Start it with: docker compose up -d minio",
      );
      return;
    }
  } else {
    assert(await provider.healthCheck(), "local upload dir not writable");
  }

  const key = `test/harness/${Date.now()}-storage-test.txt`;
  const payload = Buffer.from(`elsaad storage test ${new Date().toISOString()}`);

  await provider.putObject(key, payload, "text/plain");
  console.log(`[storage-test] put OK  key=${key}`);

  const url = await provider.getDownloadUrl(key, 300);
  assert(typeof url === "string" && url.length > 0, "empty download URL");
  console.log(`[storage-test] url OK  ${url.slice(0, 96)}…`);

  if (provider.driver === "minio") {
    const response = await fetch(url);
    assert(response.ok, `presigned GET returned HTTP ${response.status}`);
    const body = Buffer.from(await response.arrayBuffer());
    assert(body.equals(payload), "downloaded bytes differ from uploaded bytes");
    console.log("[storage-test] presigned GET round-trip OK");
  } else {
    const stored = await (provider as LocalStorageProvider).readFile(key);
    assert(stored.equals(payload), "read-back bytes differ from uploaded bytes");
    console.log("[storage-test] local read-back OK");
  }

  await provider.deleteObject(key);
  await provider.deleteObject(key); // idempotent
  console.log("[storage-test] delete OK (idempotent)");

  console.log("[storage-test] PASSED");
}

main().catch((error: unknown) => {
  console.error("[storage-test]", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
