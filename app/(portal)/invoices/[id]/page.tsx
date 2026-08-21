import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatEUR } from "@/lib/money";
import { canViewInvoice } from "@/lib/permissions";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InvoiceStatusForm } from "@/components/InvoiceStatusForm";
import { PrintButton } from "@/components/PrintButton";

type Props = { params: Promise<{ id: string }> };

export default async function InvoiceDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          name: true,
          email: true,
          clientProfile: { select: { companyName: true } },
        },
      },
      project: { select: { id: true, title: true } },
    },
  });

  const user = {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name ?? "",
    role: session.user.role,
  };

  if (!invoice || !canViewInvoice(user, invoice)) notFound();

  return (
    <div>
      <Link href="/invoices" className="text-sm text-stone-500 hover:text-stone-800">
        ← Invoices
      </Link>

      <div
        id="invoice-print"
        className="mt-6 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-stone-500">Invoice</p>
            <h1 className="text-2xl font-semibold">{invoice.number}</h1>
          </div>
          <p className="text-2xl font-semibold">{formatEUR(invoice.amountCents)}</p>
        </div>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">Status</dt>
            <dd className="font-medium">{invoice.status}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Client</dt>
            <dd className="font-medium">
              {invoice.client.clientProfile?.companyName || invoice.client.name}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Email</dt>
            <dd>{invoice.client.email}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Due</dt>
            <dd>
              {invoice.dueDate
                ? invoice.dueDate.toISOString().slice(0, 10)
                : "Not set"}
            </dd>
          </div>
          {invoice.project && (
            <div>
              <dt className="text-stone-500">Project</dt>
              <dd>
                <Link
                  href={`/projects/${invoice.project.id}`}
                  className="text-teal-800 hover:underline"
                >
                  {invoice.project.title}
                </Link>
              </dd>
            </div>
          )}
        </dl>
        {invoice.note && (
          <p className="mt-6 whitespace-pre-wrap text-sm text-stone-700">
            {invoice.note}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <PrintButton />
        {user.role === "ADMIN" && (
          <InvoiceStatusForm id={invoice.id} status={invoice.status} />
        )}
      </div>
    </div>
  );
}
