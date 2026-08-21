import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getConfig } from "@/lib/config";

function sanitizeFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 100);
}

export function safeDownloadName(name: string): string {
  const cleaned = name.replace(/[\r\n"]/g, "").replace(/[^\w.\-+() ]/g, "_");
  return cleaned.slice(0, 100) || "download";
}

export function buildStorageKey(projectId: string, originalName: string): string {
  return `projects/${projectId}/${randomUUID()}-${sanitizeFileName(originalName)}`;
}

export function assertLocalPath(storageKey: string, uploadDir: string): string {
  const root = path.resolve(uploadDir);
  const full = path.resolve(root, storageKey);
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error("Invalid storage path");
  }
  return full;
}

/** Magic-byte MIME sniff. Returns null if unknown. */
export function sniffMime(bytes: Buffer): string | null {
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return "application/pdf";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)
  ) {
    return "application/zip";
  }
  return null;
}

export async function putObject(
  key: string,
  bytes: Buffer,
  mime: string,
): Promise<{ driver: "local" | "blob"; storageKey: string }> {
  const config = getConfig();
  if (config.STORAGE_DRIVER === "blob") {
    const { put } = await import("@vercel/blob");
    const blob = await put(key, bytes, {
      access: "private",
      contentType: mime,
      token: config.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });
    return { driver: "blob", storageKey: blob.url };
  }

  const full = assertLocalPath(key, config.UPLOAD_DIR);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
  return { driver: "local", storageKey: key };
}

export async function getObjectBytes(
  storageKey: string,
  driver: string,
): Promise<Buffer> {
  const config = getConfig();
  if (driver === "blob") {
    const { get } = await import("@vercel/blob");
    try {
      const result = await get(storageKey, {
        access: "private",
        token: config.BLOB_READ_WRITE_TOKEN,
      });
      if (!result?.stream) throw new Error("Blob object not found");
      const res = new Response(result.stream);
      return Buffer.from(await res.arrayBuffer());
    } catch {
      // Legacy public blobs (pre-hardening): fetch URL directly, still proxied via API
      const res = await fetch(storageKey);
      if (!res.ok) throw new Error("Blob object not found");
      return Buffer.from(await res.arrayBuffer());
    }
  }
  const full = assertLocalPath(storageKey, config.UPLOAD_DIR);
  return readFile(full);
}

/** Delete blob/local object. Best-effort; swallows missing-file errors. */
export async function deleteObject(
  storageKey: string,
  driver: string,
): Promise<void> {
  const config = getConfig();
  if (driver === "blob") {
    const { del } = await import("@vercel/blob");
    await del(storageKey, { token: config.BLOB_READ_WRITE_TOKEN }).catch(
      () => undefined,
    );
    return;
  }
  const full = assertLocalPath(storageKey, config.UPLOAD_DIR);
  await unlink(full).catch(() => undefined);
}

export const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/zip",
]);
