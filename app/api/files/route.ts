import { jsonData, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth-helpers";
import { getConfig } from "@/lib/config";
import { prisma } from "@/lib/db";
import { canUploadFile, canViewProject } from "@/lib/permissions";
import {
  ALLOWED_MIME,
  buildStorageKey,
  putObject,
  sniffMime,
} from "@/lib/storage";

export async function POST(req: Request) {
  const authz = await requireUser();
  if (!authz.ok) return authz.response;

  const form = await req.formData();
  const projectId = String(form.get("projectId") || "");
  const file = form.get("file");

  if (!projectId || !(file instanceof File)) {
    return jsonError("validation", "projectId and file are required.", 400);
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || !canViewProject(authz.user, project)) {
    return jsonError("not_found", "Project not found.", 404);
  }
  if (!canUploadFile(authz.user, project)) {
    return jsonError("not_found", "Project not found.", 404);
  }

  const config = getConfig();
  if (file.size <= 0) {
    return jsonError("validation", "Empty file.", 400);
  }
  if (file.size > config.MAX_UPLOAD_BYTES) {
    return jsonError("payload_too_large", "File too large.", 413);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffMime(bytes);
  if (!sniffed || !ALLOWED_MIME.has(sniffed)) {
    return jsonError(
      "unsupported_media",
      "File type not allowed (content check failed).",
      415,
    );
  }

  try {
    const key = buildStorageKey(projectId, file.name);
    const stored = await putObject(key, bytes, sniffed);

    const asset = await prisma.fileAsset.create({
      data: {
        projectId,
        uploadedById: authz.user.id,
        originalName: file.name,
        mimeType: sniffed,
        sizeBytes: file.size,
        storageKey: stored.storageKey,
        storageDriver: stored.driver,
      },
    });

    return jsonData(asset, 201);
  } catch (e) {
    console.error(e);
    return jsonError("internal", "Upload failed.", 500);
  }
}
