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
import { safeInternalPath } from "../lib/safe-path";
import { sniffMime, assertLocalPath, safeDownloadName } from "../lib/storage";
import path from "node:path";
import os from "node:os";

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

describe("permissions / IDOR matrix", () => {
  it("scopes project access (foreign → deny)", () => {
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
      expect(loginRateLimit("9.9.9.9", email).allowed).toBe(true);
    }
    expect(loginRateLimit("9.9.9.9", email).allowed).toBe(false);
  });
});

describe("safeInternalPath", () => {
  it("allows relative app paths", () => {
    expect(safeInternalPath("/dashboard")).toBe("/dashboard");
    expect(safeInternalPath("/projects/abc")).toBe("/projects/abc");
  });

  it("blocks open redirects", () => {
    expect(safeInternalPath("https://evil.com")).toBe("/dashboard");
    expect(safeInternalPath("//evil.com")).toBe("/dashboard");
    expect(safeInternalPath("/\\evil")).toBe("/dashboard");
    expect(safeInternalPath("/projects/<script>")).toBe("/dashboard");
    expect(safeInternalPath(null)).toBe("/dashboard");
  });
});

describe("sniffMime", () => {
  it("detects pdf png jpeg zip", () => {
    expect(sniffMime(Buffer.from("%PDF-1.4"))).toBe("application/pdf");
    expect(
      sniffMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe("image/png");
    expect(sniffMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffMime(Buffer.from([0x50, 0x4b, 0x03, 0x04]))).toBe(
      "application/zip",
    );
    expect(sniffMime(Buffer.from("hello"))).toBeNull();
  });
});

describe("assertLocalPath", () => {
  it("rejects path traversal", () => {
    const root = path.join(os.tmpdir(), "portal-uploads-test");
    expect(() => assertLocalPath("../etc/passwd", root)).toThrow();
    expect(assertLocalPath("projects/a/b.pdf", root)).toContain("projects");
  });
});

describe("safeDownloadName", () => {
  it("strips header-breaking chars", () => {
    expect(safeDownloadName('a"b\nc.pdf')).not.toMatch(/["\n]/);
  });
});
