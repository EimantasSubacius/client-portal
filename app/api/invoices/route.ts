import { jsonData, jsonError } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { nextInvoiceNumber } from "@/lib/invoice-number";
import { parseEuroToCents } from "@/lib/money";
import { canManageInvoice } from "@/lib/permissions";
import { createInvoiceSchema } from "@/lib/validations";

export async function GET() {
  const authz = await requireUser();
  if (!authz.ok) return authz.response;

  const invoices = await prisma.invoice.findMany({
    where:
      authz.user.role === "ADMIN"
        ? undefined
        : { clientUserId: authz.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          clientProfile: { select: { companyName: true } },
        },
      },
      project: { select: { id: true, title: true } },
    },
  });

  return jsonData(invoices);
}

export async function POST(req: Request) {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.response;
  if (!canManageInvoice(authz.user)) {
    return jsonError("forbidden", "Admin only.", 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("validation", "Invalid JSON.", 400);
  }

  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation", parsed.error.issues[0]?.message ?? "Invalid", 400);
  }

  const client = await prisma.user.findFirst({
    where: { id: parsed.data.clientUserId, role: "CLIENT" },
  });
  if (!client) return jsonError("not_found", "Client not found.", 404);

  if (parsed.data.projectId) {
    const project = await prisma.project.findFirst({
      where: {
        id: parsed.data.projectId,
        clientUserId: parsed.data.clientUserId,
      },
    });
    if (!project) return jsonError("not_found", "Project not found.", 404);
  }

  let amountCents: number;
  try {
    amountCents = parseEuroToCents(parsed.data.amountEuros);
  } catch (e) {
    return jsonError(
      "validation",
      e instanceof Error ? e.message : "Invalid amount",
      400,
    );
  }

  let lastError: unknown;
  for (let i = 0; i < 3; i++) {
    try {
      const number = await nextInvoiceNumber();
      const invoice = await prisma.invoice.create({
        data: {
          number,
          clientUserId: parsed.data.clientUserId,
          projectId: parsed.data.projectId || null,
          amountCents,
          status: parsed.data.status,
          dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
          note: parsed.data.note || null,
        },
      });
      return jsonData(invoice, 201);
    } catch (e) {
      lastError = e;
    }
  }

  console.error(lastError);
  return jsonError("conflict", "Could not allocate invoice number.", 409);
}
