import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewProject } from "@/lib/permissions";
import { formatEUR } from "@/lib/money";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ProjectExtras } from "@/components/ProjectExtras";

type Props = { params: Promise<{ id: string }> };

export default async function ProjectDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          name: true,
          email: true,
          clientProfile: { select: { companyName: true } },
        },
      },
      files: { orderBy: { createdAt: "desc" } },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
        include: { author: { select: { id: true, name: true, role: true } } },
      },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });

  const user = {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name ?? "",
    role: session.user.role,
  };

  if (!project || !canViewProject(user, project)) notFound();

  const now = new Date();
  if (user.role === "ADMIN") {
    await prisma.message.updateMany({
      where: {
        projectId: id,
        readByAdminAt: null,
        author: { role: "CLIENT" },
      },
      data: { readByAdminAt: now },
    });
  } else {
    await prisma.message.updateMany({
      where: {
        projectId: id,
        readByClientAt: null,
        author: { role: "ADMIN" },
      },
      data: { readByClientAt: now },
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/projects" className="text-sm text-stone-500 hover:text-stone-800">
          ← Projects
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{project.title}</h1>
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs uppercase tracking-wide">
            {project.status}
          </span>
        </div>
        <p className="mt-2 text-stone-600 whitespace-pre-wrap">
          {project.description || "No description."}
        </p>
        {user.role === "ADMIN" && (
          <p className="mt-2 text-sm text-stone-500">
            Client: {project.client.clientProfile?.companyName || project.client.name} (
            {project.client.email})
          </p>
        )}
      </div>

      <section>
        <h2 className="text-lg font-semibold">Linked invoices</h2>
        <ul className="mt-3 space-y-2">
          {project.invoices.length === 0 && (
            <li className="text-sm text-stone-500">No invoices linked.</li>
          )}
          {project.invoices.map((inv) => (
            <li key={inv.id}>
              <Link
                href={`/invoices/${inv.id}`}
                className="text-sm text-teal-800 hover:underline"
              >
                {inv.number} · {formatEUR(inv.amountCents)} · {inv.status}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ProjectExtras
        projectId={project.id}
        isAdmin={user.role === "ADMIN"}
        currentUserId={user.id}
        initialFiles={project.files.map((f) => ({
          id: f.id,
          originalName: f.originalName,
          sizeBytes: f.sizeBytes,
          createdAt: f.createdAt.toISOString(),
        }))}
        initialMessages={project.messages.map((m) => ({
          id: m.id,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
          author: m.author,
        }))}
      />
    </div>
  );
}
