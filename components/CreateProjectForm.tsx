"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CreateProjectForm({
  clients,
}: {
  clients: { id: string; name: string; email: string }[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [clientUserId, setClientUserId] = useState(clients[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, clientUserId, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setTitle("");
      setDescription("");
      router.push(`/projects/${data.data.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (clients.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        Create a client first before adding projects.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-3"
    >
      <p className="text-sm font-medium">New project</p>
      <input
        required
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-xl border border-stone-300 px-3 py-2"
      />
      <select
        required
        value={clientUserId}
        onChange={(e) => setClientUserId(e.target.value)}
        className="w-full rounded-xl border border-stone-300 px-3 py-2"
      >
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.email})
          </option>
        ))}
      </select>
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded-xl border border-stone-300 px-3 py-2"
        rows={3}
      />
      {error && <p className="text-sm text-rose-700">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create project"}
      </button>
    </form>
  );
}
