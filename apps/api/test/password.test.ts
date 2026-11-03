import { test } from "node:test";
import assert from "node:assert";
import { hashPassword, verifyPassword } from "../src/common/crypto/password";

test("hashPassword produces a scrypt hash with correct format", () => {
  const hashed = hashPassword("test-password-123");
  assert.strictEqual(typeof hashed, "string");
  const parts = hashed.split(":");
  assert.strictEqual(parts.length, 4);
  assert.strictEqual(parts[0], "scrypt");
  assert.ok(Number.isInteger(Number(parts[1])));
  assert.ok(parts[2].length > 0);
  assert.ok(parts[3].length > 0);
});

test("verifyPassword returns true for correct password", () => {
  const hashed = hashPassword("correct-password");
  assert.ok(verifyPassword("correct-password", hashed));
});

test("verifyPassword returns false for wrong password", () => {
  const hashed = hashPassword("correct-password");
  assert.ok(!verifyPassword("wrong-password", hashed));
});

test("verifyPassword returns false for malformed hash", () => {
  assert.ok(!verifyPassword("anything", "not-a-valid-hash"));
  assert.ok(!verifyPassword("anything", "scrypt:bad:salt:hash"));
});

test("different passwords produce different hashes", () => {
  const h1 = hashPassword("password-a");
  const h2 = hashPassword("password-b");
  assert.notStrictEqual(h1, h2);
});

test("same password produces different hashes (random salt)", () => {
  const h1 = hashPassword("same-password");
  const h2 = hashPassword("same-password");
  assert.notStrictEqual(h1, h2);
});
