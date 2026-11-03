import { test, describe } from "node:test";
import assert from "node:assert";
import { PasswordResetService } from "../src/auth/password-reset.service";
import { hashPassword, verifyPassword } from "../src/common/crypto/password";

type PrismaArgs = Record<string, unknown>;
type PrismaRecord = Record<string, unknown>;

function createMockPrisma() {
  const store: Record<string, PrismaRecord[]> = {
    customer: [],
    passwordReset: [],
    refreshToken: [],
  };

  const mockClient = {
    customer: {
      findUnique: async (args: PrismaArgs) => {
        const { where } = args as { where?: PrismaRecord };
        if (!where) return null;
        const recs = store.customer.filter((c: PrismaRecord) => {
          if (where.id) return c.id === where.id;
          if (where.email) return c.email?.toString().toLowerCase() === where.email.toString().toLowerCase();
          return true;
        });
        return (recs[0] as PrismaRecord) || null;
      },
      findFirst: async (args: PrismaArgs) => {
        const { where } = args as { where?: PrismaRecord };
        if (!where) return null;
        const recs = store.customer.filter((c: PrismaRecord) => {
          if (where.email) {
            const targetEmail =
              typeof where.email === "string" ? where.email : (where.email as PrismaRecord).equals;
            return c.email?.toString().toLowerCase() === targetEmail.toString().toLowerCase();
          }
          return true;
        });
        return (recs[0] as PrismaRecord) || null;
      },
      create: async (args: PrismaArgs) => {
        const rec = { id: `cust-${Date.now()}`, isActive: true, ...(args.data as PrismaRecord) };
        store.customer.push(rec);
        return rec;
      },
      update: async (args: PrismaArgs) => {
        const { where, data } = args as { where?: PrismaRecord; data?: PrismaRecord };
        if (!where) throw new Error("Not found");
        const idx = store.customer.findIndex((c: PrismaRecord) => c.id === where.id);
        if (idx === -1) throw new Error("Not found");
        store.customer[idx] = { ...store.customer[idx], ...data };
        return store.customer[idx];
      },
    },
    passwordReset: {
      create: async (args: PrismaArgs) => {
        const rec: PrismaRecord = {
          id: `pr-${Date.now()}`,
          createdAt: new Date(),
          usedAt: null,
          ...(args.data as PrismaRecord),
        };
        store.passwordReset.push(rec);
        return rec;
      },
      findUnique: async (args: PrismaArgs) => {
        const { where, include } = args as { where?: PrismaRecord; include?: PrismaRecord };
        if (!where) return null;
        let rec = store.passwordReset.find((r: PrismaRecord) => r.token === where.token);
        if (!rec) return null;
        if (include?.customer) {
          const customer = store.customer.find((c: PrismaRecord) => c.id === rec.customerId);
          rec = { ...rec, customer };
        }
        return rec;
      },
      update: async (args: PrismaArgs) => {
        const { where, data } = args as { where?: PrismaRecord; data?: PrismaRecord };
        if (!where) throw new Error("Not found");
        const idx = store.passwordReset.findIndex((r: PrismaRecord) => r.id === where.id);
        if (idx === -1) throw new Error("Not found");
        store.passwordReset[idx] = { ...store.passwordReset[idx], ...data };
        return store.passwordReset[idx];
      },
    },
    $disconnect: async () => {},
  };

  return {
    get: () => mockClient,
    store,
  };
}

describe("PasswordResetService", () => {
  test("forgotPassword returns same message regardless of email existence", async () => {
    const { get } = createMockPrisma();
    const service = new PasswordResetService({ get } as unknown as PrismaServiceMock);

    const result1 = await service.forgotPassword("nonexistent@example.com");
    const result2 = await service.forgotPassword("nonexistent@example.com");

    assert.strictEqual(result1.message, result2.message);
    assert.ok(result1.message.includes("إذا كان البريد الإلكتروني موجودًا"));
  });

  test("forgotPassword creates PasswordReset record and logs reset link", async () => {
    const { get, store } = createMockPrisma();
    await get().customer.create({
      data: { id: "cust-1", name: "Test", phone: "01000000000", email: "test@example.com", passwordHash: "hash" },
    });

    const service = new PasswordResetService({ get } as unknown as PrismaServiceMock);
    const result = await service.forgotPassword("test@example.com");

    assert.ok(result.message);
    assert.strictEqual(store.passwordReset.length, 1);
    assert.ok(store.passwordReset[0].token);
    assert.ok(store.passwordReset[0].customerId);
    assert.ok(store.passwordReset[0].expiresAt);
    assert.ok(new Date(store.passwordReset[0].expiresAt as string) > new Date());
  });

  test("resetPassword updates passwordHash and marks token used", async () => {
    const { get, store } = createMockPrisma();
    await get().customer.create({
      data: {
        id: "cust-1",
        name: "Test",
        phone: "01000000000",
        email: "test@example.com",
        passwordHash: hashPassword("old-password"),
      },
    });

    const service = new PasswordResetService({ get } as unknown as PrismaServiceMock);
    await service.forgotPassword("test@example.com");

    const token = store.passwordReset[0].token;
    assert.ok(token, "token should exist");

    const result = await service.resetPassword(token as string, "new-secure-password");

    assert.ok(result.message.includes("تم تحديث كلمة المرور"));
    assert.ok(store.passwordReset[0].usedAt);

    const customer = await get().customer.findUnique({ where: { id: "cust-1" } });
    assert.ok(customer?.passwordHash);
    assert.ok(verifyPassword("new-secure-password", customer.passwordHash as string));
    assert.ok(!verifyPassword("old-password", customer.passwordHash as string));
  });

  test("resetPassword rejects invalid token", async () => {
    const { get } = createMockPrisma();
    const service = new PasswordResetService({ get } as unknown as PrismaServiceMock);

    await assert.rejects(
      service.resetPassword("invalid-token", "new-password"),
      /رابط إعادة التعيين غير صالح/
    );
  });

  test("resetPassword rejects expired token", async () => {
    const { get } = createMockPrisma();
    await get().customer.create({
      data: { id: "cust-1", name: "Test", phone: "01000000000", email: "test@example.com", passwordHash: "hash" },
    });

    const service = new PasswordResetService({ get } as unknown as PrismaServiceMock);
    await get().passwordReset.create({
      data: {
        token: "expired-token",
        customerId: "cust-1",
        expiresAt: new Date(Date.now() - 10000),
      },
    });

    await assert.rejects(
      service.resetPassword("expired-token", "new-password"),
      /منتهي الصلاحية/
    );
  });

  test("resetPassword rejects already used token", async () => {
    const { get } = createMockPrisma();
    await get().customer.create({
      data: { id: "cust-1", name: "Test", phone: "01000000000", email: "test@example.com", passwordHash: "hash" },
    });

    const service = new PasswordResetService({ get } as unknown as PrismaServiceMock);
    await get().passwordReset.create({
      data: {
        token: "used-token",
        customerId: "cust-1",
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: new Date(),
      },
    });

    await assert.rejects(
      service.resetPassword("used-token", "new-password"),
      /تم استخدام رابط إعادة التعيين بالفعل/
    );
  });

  test("resetPassword rejects missing token or password", async () => {
    const { get } = createMockPrisma();
    const service = new PasswordResetService({ get } as unknown as PrismaServiceMock);

    await assert.rejects(service.resetPassword("", "password"), /مطلوب/);
    await assert.rejects(service.resetPassword("token", ""), /مطلوب/);
  });
});

interface PrismaServiceMock {
  get: () => {
    customer: {
      findUnique: (args: PrismaArgs) => Promise<PrismaRecord | null>;
      findFirst: (args: PrismaArgs) => Promise<PrismaRecord | null>;
      create: (args: PrismaArgs) => Promise<PrismaRecord>;
      update: (args: PrismaArgs) => Promise<PrismaRecord>;
    };
    passwordReset: {
      create: (args: PrismaArgs) => Promise<PrismaRecord>;
      findUnique: (args: PrismaArgs) => Promise<PrismaRecord | null>;
      update: (args: PrismaArgs) => Promise<PrismaRecord>;
    };
    $disconnect: () => Promise<void>;
  };
}
