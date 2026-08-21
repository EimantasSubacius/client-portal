import { jsonData, jsonError } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { canEditProject } from "@/lib/permissions";
import { createProjectSchema } from "@/lib/validations";

export async function GET() {
  const authz = await requireUser();
  if (!authz.ok) return authz.response;

  const projects = await prisma.project.findMany({
    where:
      authz.user.role === "ADMIN"
        ? undefined
        : { clientUserId: authz.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          clientProfile: { select: { companyName: true } },
        },
      },
    },
  });

  return jsonData(projects);
}

export async function POST(req: Request) {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.response;
  if (!canEditProject(authz.user)) {
    return jsonError("forbidden", "Admin only.", 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("validation", "Invalid JSON.", 400);
  }

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation", parsed.error.issues[0]?.message ?? "Invalid", 400);
  }

  const client = await prisma.user.findFirst({
    where: { id: parsed.data.clientUserId, role: "CLIENT" },
  });
  if (!client) {
    return jsonError("not_found", "Client not found.", 404);
  }

  const project = await prisma.project.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      status: parsed.data.status,
      clientUserId: parsed.data.clientUserId,
    },
  });

  return jsonData(project, 201);
}
