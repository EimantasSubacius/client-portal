import { jsonData, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export async function GET() {
  const authz = await requireUser();
  if (!authz.ok) return authz.response;

  if (authz.user.role === "ADMIN") {
    const [activeProjects, unpaid, unread, clients] = await Promise.all([
      prisma.project.count({ where: { status: "ACTIVE" } }),
      prisma.invoice.aggregate({
        where: { status: "SENT" },
        _sum: { amountCents: true },
        _count: true,
      }),
      prisma.message.count({
        where: { readByAdminAt: null, author: { role: "CLIENT" } },
      }),
      prisma.user.count({ where: { role: "CLIENT" } }),
    ]);

    return jsonData({
      role: "ADMIN",
      activeProjects,
      unpaidCount: unpaid._count,
      unpaidCents: unpaid._sum.amountCents ?? 0,
      unreadMessages: unread,
      clients,
    });
  }

  const [activeProjects, nextInvoice, unread, recentFiles] = await Promise.all([
    prisma.project.count({
      where: { clientUserId: authz.user.id, status: "ACTIVE" },
    }),
    prisma.invoice.findFirst({
      where: { clientUserId: authz.user.id, status: "SENT" },
      orderBy: { dueDate: "asc" },
    }),
    prisma.message.count({
      where: {
        readByClientAt: null,
        author: { role: "ADMIN" },
        project: { clientUserId: authz.user.id },
      },
    }),
    prisma.fileAsset.findMany({
      where: { project: { clientUserId: authz.user.id } },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { project: { select: { title: true } } },
    }),
  ]);

  return jsonData({
    role: "CLIENT",
    activeProjects,
    nextInvoice,
    unreadMessages: unread,
    recentFiles,
  });
}
