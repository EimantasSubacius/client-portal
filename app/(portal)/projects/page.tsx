import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateProjectForm } from "@/components/CreateProjectForm";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projects = await prisma.project.findMany({
    where:
      session.user.role === "ADMIN"
        ? undefined
        : { clientUserId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      client: {
        select: {
          name: true,
          clientProfile: { select: { companyName: true } },
        },
      },
    },
  });

  const clients =
    session.user.role === "ADMIN"
      ? await prisma.user.findMany({
          where: { role: "CLIENT" },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="mt-1 text-stone-600">
            {session.user.role === "ADMIN"
              ? "All client projects"
              : "Your projects"}
          </p>
        </div>
      </div>

      {session.user.role === "ADMIN" && (
        <div className="mt-6">
          <CreateProjectForm clients={clients} />
        </div>
      )}

      <ul className="mt-8 space-y-3">
        {projects.length === 0 && (
          <li className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-500">
            No projects yet.
          </li>
        )}
        {projects.map((p) => (
          <li key={p.id}>
            <Link
              href={`/projects/${p.id}`}
              className="block rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-teal-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{p.title}</p>
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs uppercase tracking-wide text-stone-600">
                  {p.status}
                </span>
              </div>
              {session.user.role === "ADMIN" && (
                <p className="mt-1 text-sm text-stone-500">
                  {p.client.clientProfile?.companyName || p.client.name}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
