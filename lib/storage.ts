import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getConfig } from "@/lib/config";

function sanitizeFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 100);
}

export function buildStorageKey(projectId: string, originalName: string): string {
  return `projects/${projectId}/${randomUUID()}-${sanitizeFileName(originalName)}`;
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
      access: "public",
      contentType: mime,
      token: config.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });
    return { driver: "blob", storageKey: blob.url };
  }

  const full = path.join(config.UPLOAD_DIR, key);
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
    const res = await fetch(storageKey);
    if (!res.ok) throw new Error("Blob object not found");
    return Buffer.from(await res.arrayBuffer());
  }
  const full = path.join(config.UPLOAD_DIR, storageKey);
  return readFile(full);
}

export async function deleteObject(
  storageKey: string,
  driver: string,
): Promise<void> {
  if (driver === "blob") {
    const { del } = await import("@vercel/blob");
    const config = getConfig();
    await del(storageKey, { token: config.BLOB_READ_WRITE_TOKEN });
    return;
  }
  const config = getConfig();
  const full = path.join(config.UPLOAD_DIR, storageKey);
  await unlink(full).catch(() => undefined);
}

export const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/zip",
]);
