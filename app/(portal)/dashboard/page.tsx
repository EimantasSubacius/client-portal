import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatEUR } from "@/lib/money";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  if (session.user.role === "ADMIN") {
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

    return (
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-stone-600">Admin overview</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card label="Active projects" value={String(activeProjects)} />
          <Card
            label="Unpaid invoices"
            value={`${unpaid._count} · ${formatEUR(unpaid._sum.amountCents ?? 0)}`}
          />
          <Card label="Unread messages" value={String(unread)} />
          <Card label="Clients" value={String(clients)} href="/clients" />
        </div>
      </div>
    );
  }

  const [activeProjects, nextInvoice, unread] = await Promise.all([
    prisma.project.count({
      where: { clientUserId: session.user.id, status: "ACTIVE" },
    }),
    prisma.invoice.findFirst({
      where: { clientUserId: session.user.id, status: "SENT" },
      orderBy: { dueDate: "asc" },
    }),
    prisma.message.count({
      where: {
        readByClientAt: null,
        author: { role: "ADMIN" },
        project: { clientUserId: session.user.id },
      },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-stone-600">Welcome back, {session.user.name}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card label="Active projects" value={String(activeProjects)} href="/projects" />
        <Card
          label="Next invoice due"
          value={
            nextInvoice
              ? `${nextInvoice.number} · ${formatEUR(nextInvoice.amountCents)}`
              : "None"
          }
          href="/invoices"
        />
        <Card label="Unread messages" value={String(unread)} href="/projects" />
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
