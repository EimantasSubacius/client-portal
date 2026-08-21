import { jsonData, jsonError } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { canEditProject, canViewProject } from "@/lib/permissions";
import { updateProjectSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const authz = await requireUser();
  if (!authz.ok) return authz.response;
  const { id } = await ctx.params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          clientProfile: { select: { companyName: true } },
        },
      },
      files: { orderBy: { createdAt: "desc" } },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
        include: { author: { select: { id: true, name: true, role: true } } },
      },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!project || !canViewProject(authz.user, project)) {
    return jsonError("not_found", "Project not found.", 404);
  }

  // mark messages read
  const now = new Date();
  if (authz.user.role === "ADMIN") {
    await prisma.message.updateMany({
      where: {
        projectId: id,
        readByAdminAt: null,
        author: { role: "CLIENT" },
      },
      data: { readByAdminAt: now },
    });
  } else {
    await prisma.message.updateMany({
      where: {
        projectId: id,
        readByClientAt: null,
        author: { role: "ADMIN" },
      },
      data: { readByClientAt: now },
    });
  }

  return jsonData(project);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.response;
  if (!canEditProject(authz.user)) {
    return jsonError("forbidden", "Admin only.", 403);
  }
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("validation", "Invalid JSON.", 400);
  }
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation", parsed.error.issues[0]?.message ?? "Invalid", 400);
  }

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return jsonError("not_found", "Project not found.", 404);

  const project = await prisma.project.update({
    where: { id },
    data: parsed.data,
  });
  return jsonData(project);
}
