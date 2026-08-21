import { jsonError } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { canDeleteFile, canViewProject } from "@/lib/permissions";
import {
  deleteObject,
  getObjectBytes,
  safeDownloadName,
} from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const authz = await requireUser();
  if (!authz.ok) return authz.response;
  const { id } = await ctx.params;

  const file = await prisma.fileAsset.findUnique({
    where: { id },
    include: { project: true },
  });
  if (!file || !canViewProject(authz.user, file.project)) {
    return jsonError("not_found", "File not found.", 404);
  }

  try {
    // Always proxy bytes (never 302 to public blob URL)
    const bytes = await getObjectBytes(file.storageKey, file.storageDriver);
    const filename = safeDownloadName(file.originalName);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.error(e);
    return jsonError("not_found", "File not found.", 404);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.response;
  if (!canDeleteFile(authz.user)) {
    return jsonError("forbidden", "Admin only.", 403);
  }
  const { id } = await ctx.params;

  const file = await prisma.fileAsset.findUnique({ where: { id } });
  if (!file) return jsonError("not_found", "File not found.", 404);

  // Blob GC before DB row delete
  await deleteObject(file.storageKey, file.storageDriver);
  await prisma.fileAsset.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
