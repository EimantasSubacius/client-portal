import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { CreateClientForm } from "@/components/CreateClientForm";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      clientProfile: { select: { companyName: true } },
      _count: { select: { projects: true, invoices: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Clients</h1>
      <p className="mt-1 text-stone-600">Create and manage client logins</p>

      <div className="mt-6">
        <CreateClientForm />
      </div>

      <ul className="mt-8 space-y-3">
        {clients.map((c) => (
          <li
            key={c.id}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <p className="font-medium">
              {c.clientProfile?.companyName || c.name}
            </p>
            <p className="text-sm text-stone-500">
              {c.name} · {c.email}
            </p>
            <p className="mt-1 text-xs text-stone-400">
              {c._count.projects} projects · {c._count.invoices} invoices
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
