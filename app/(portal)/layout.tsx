import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

const adminLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/invoices", label: "Invoices" },
  { href: "/clients", label: "Clients" },
];

const clientLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "My projects" },
  { href: "/invoices", label: "Invoices" },
];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const links =
    session.user.role === "ADMIN" ? adminLinks : clientLinks;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col md:flex-row">
        <aside className="border-b border-stone-200 bg-white md:w-56 md:border-b-0 md:border-r">
          <div className="px-5 py-5">
            <Link href="/dashboard" className="font-semibold tracking-tight">
              Client Portal
            </Link>
            <p className="mt-1 text-xs text-stone-500">
              {session.user.role === "ADMIN" ? "Admin" : "Client"}
            </p>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 whitespace-nowrap"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <form
            className="px-3 pb-5"
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-stone-500 hover:bg-stone-100"
            >
              Sign out
            </button>
          </form>
        </aside>
        <main className="flex-1 px-5 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
