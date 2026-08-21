import { jsonData, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { canViewProject } from "@/lib/permissions";
import { messageRateLimit } from "@/lib/rate-limit";
import { postMessageSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const authz = await requireUser();
  if (!authz.ok) return authz.response;
  const { id } = await ctx.params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || !canViewProject(authz.user, project)) {
    return jsonError("not_found", "Project not found.", 404);
  }

  const messages = await prisma.message.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { author: { select: { id: true, name: true, role: true } } },
  });
  return jsonData(messages);
}

export async function POST(req: Request, ctx: Ctx) {
  const authz = await requireUser();
  if (!authz.ok) return authz.response;
  const { id } = await ctx.params;

  const limit = messageRateLimit(authz.user.id);
  if (!limit.allowed) {
    return jsonError("rate_limited", "Too many messages. Try again later.", 429);
  }

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || !canViewProject(authz.user, project)) {
    return jsonError("not_found", "Project not found.", 404);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("validation", "Invalid JSON.", 400);
  }
  const parsed = postMessageSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation", parsed.error.issues[0]?.message ?? "Invalid", 400);
  }

  const message = await prisma.message.create({
    data: {
      projectId: id,
      authorId: authz.user.id,
      body: parsed.data.body,
    },
    include: { author: { select: { id: true, name: true, role: true } } },
  });

  return jsonData(message, 201);
}
