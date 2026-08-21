import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatEUR } from "@/lib/money";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateInvoiceForm } from "@/components/CreateInvoiceForm";

export default async function InvoicesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const invoices = await prisma.invoice.findMany({
    where:
      session.user.role === "ADMIN"
        ? undefined
        : { clientUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      client: {
        select: {
          name: true,
          clientProfile: { select: { companyName: true } },
        },
      },
      project: { select: { title: true } },
    },
  });

  const clients =
    session.user.role === "ADMIN"
      ? await prisma.user.findMany({
          where: { role: "CLIENT" },
          select: { id: true, name: true, email: true },
        })
      : [];

  const projects =
    session.user.role === "ADMIN"
      ? await prisma.project.findMany({
          select: { id: true, title: true, clientUserId: true },
        })
      : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Invoices</h1>
      <p className="mt-1 text-stone-600">EUR billing</p>

      {session.user.role === "ADMIN" && (
        <div className="mt-6">
          <CreateInvoiceForm clients={clients} projects={projects} />
        </div>
      )}

      <ul className="mt-8 space-y-3">
        {invoices.length === 0 && (
          <li className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-500">
            No invoices yet.
          </li>
        )}
        {invoices.map((inv) => (
          <li key={inv.id}>
            <Link
              href={`/invoices/${inv.id}`}
              className="block rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-teal-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{inv.number}</p>
                <span className="text-sm">{formatEUR(inv.amountCents)}</span>
              </div>
              <p className="mt-1 text-sm text-stone-500">
                {inv.status}
                {session.user.role === "ADMIN" &&
                  ` · ${inv.client.clientProfile?.companyName || inv.client.name}`}
                {inv.project ? ` · ${inv.project.title}` : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
