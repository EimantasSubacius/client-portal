import { describe, expect, it } from "vitest";
import {
  canDeleteFile,
  canManageInvoice,
  canUploadFile,
  canViewInvoice,
  canViewProject,
} from "../lib/permissions";
import { formatEUR, parseEuroToCents } from "../lib/money";
import { loginRateLimit } from "../lib/rate-limit";

const admin = {
  id: "admin1",
  email: "a@x.com",
  name: "A",
  role: "ADMIN" as const,
};
const client = {
  id: "client1",
  email: "c@x.com",
  name: "C",
  role: "CLIENT" as const,
};
const other = {
  id: "client2",
  email: "o@x.com",
  name: "O",
  role: "CLIENT" as const,
};

describe("permissions", () => {
  it("scopes project access", () => {
    const project = { clientUserId: "client1" };
    expect(canViewProject(admin, project)).toBe(true);
    expect(canViewProject(client, project)).toBe(true);
    expect(canViewProject(other, project)).toBe(false);
  });

  it("scopes invoice access", () => {
    const invoice = { clientUserId: "client1" };
    expect(canViewInvoice(admin, invoice)).toBe(true);
    expect(canViewInvoice(client, invoice)).toBe(true);
    expect(canViewInvoice(other, invoice)).toBe(false);
    expect(canManageInvoice(admin)).toBe(true);
    expect(canManageInvoice(client)).toBe(false);
  });

  it("upload and delete rules", () => {
    const project = { clientUserId: "client1" };
    expect(canUploadFile(client, project)).toBe(true);
    expect(canUploadFile(other, project)).toBe(false);
    expect(canDeleteFile(admin)).toBe(true);
    expect(canDeleteFile(client)).toBe(false);
  });
});

describe("money", () => {
  it("formats and parses EUR", () => {
    expect(formatEUR(150050)).toContain("1,500.50");
    expect(parseEuroToCents("1500.50")).toBe(150050);
    expect(() => parseEuroToCents("-1")).toThrow();
  });
});

describe("loginRateLimit", () => {
  it("blocks after 5 attempts", () => {
    const email = `rate-${Date.now()}@test.com`;
    for (let i = 0; i < 5; i++) {
      expect(loginRateLimit("1.1.1.1", email).allowed).toBe(true);
    }
    expect(loginRateLimit("1.1.1.1", email).allowed).toBe(false);
  });
});
