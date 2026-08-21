"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export function CreateInvoiceForm({
  clients,
  projects,
}: {
  clients: { id: string; name: string; email: string }[];
  projects: { id: string; title: string; clientUserId: string }[];
}) {
  const router = useRouter();
  const [clientUserId, setClientUserId] = useState(clients[0]?.id ?? "");
  const [projectId, setProjectId] = useState("");
  const [amountEuros, setAmountEuros] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredProjects = useMemo(
    () => projects.filter((p) => p.clientUserId === clientUserId),
    [projects, clientUserId],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientUserId,
          projectId: projectId || null,
          amountEuros,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      router.push(`/invoices/${data.data.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (clients.length === 0) {
    return <p className="text-sm text-stone-500">Create a client first.</p>;
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-3"
    >
      <p className="text-sm font-medium">New invoice</p>
      <select
        value={clientUserId}
        onChange={(e) => {
          setClientUserId(e.target.value);
          setProjectId("");
        }}
        className="w-full rounded-xl border border-stone-300 px-3 py-2"
      >
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        className="w-full rounded-xl border border-stone-300 px-3 py-2"
      >
        <option value="">No project</option>
        {filteredProjects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
      <input
        required
        placeholder="Amount EUR (e.g. 1500.00)"
        value={amountEuros}
        onChange={(e) => setAmountEuros(e.target.value)}
        className="w-full rounded-xl border border-stone-300 px-3 py-2"
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full rounded-xl border border-stone-300 px-3 py-2"
      >
        <option value="DRAFT">DRAFT</option>
        <option value="SENT">SENT</option>
      </select>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create invoice"}
      </button>
    </form>
  );
}
