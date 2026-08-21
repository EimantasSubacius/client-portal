import { jsonData, jsonError } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import {
  canManageInvoice,
  canViewInvoice,
} from "@/lib/permissions";
import { updateInvoiceSchema } from "@/lib/validations";
import type { InvoiceStatus } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ["DRAFT", "SENT"],
  SENT: ["SENT", "PAID"],
  PAID: ["PAID"],
};

export async function GET(_req: Request, ctx: Ctx) {
  const authz = await requireUser();
  if (!authz.ok) return authz.response;
  const { id } = await ctx.params;

  const invoice = await prisma.invoice.findUnique({
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
      project: { select: { id: true, title: true } },
    },
  });

  if (!invoice || !canViewInvoice(authz.user, invoice)) {
    return jsonError("not_found", "Invoice not found.", 404);
  }
  return jsonData(invoice);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.response;
  if (!canManageInvoice(authz.user)) {
    return jsonError("forbidden", "Admin only.", 403);
  }
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("validation", "Invalid JSON.", 400);
  }
  const parsed = updateInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation", parsed.error.issues[0]?.message ?? "Invalid", 400);
  }

  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) return jsonError("not_found", "Invoice not found.", 404);

  if (!ALLOWED[existing.status].includes(parsed.data.status)) {
    return jsonError(
      "validation",
      `Cannot transition ${existing.status} → ${parsed.data.status}`,
      400,
    );
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data: { status: parsed.data.status },
  });
  return jsonData(invoice);
}
