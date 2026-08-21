import { jsonData, jsonError } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { canManageClients } from "@/lib/permissions";
import { createClientSchema } from "@/lib/validations";

export async function GET() {
  const authz = await requireUser();
  if (!authz.ok) return authz.response;
  if (!canManageClients(authz.user)) {
    return jsonError("forbidden", "Admin only.", 403);
  }

  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      clientProfile: { select: { companyName: true, notes: true } },
    },
  });

  return jsonData(clients);
}

export async function POST(req: Request) {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("validation", "Invalid JSON.", 400);
  }

  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation", parsed.error.issues[0]?.message ?? "Invalid", 400);
  }

  const email = parsed.data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return jsonError("conflict", "Email already registered.", 409);
  }

  const passwordHash = await hashPassword(parsed.data.temporaryPassword);
  const client = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      role: "CLIENT",
      passwordHash,
      clientProfile: {
        create: { companyName: parsed.data.companyName },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      clientProfile: { select: { companyName: true } },
    },
  });

  return jsonData(client, 201);
}
