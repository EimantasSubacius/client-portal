"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CreateClientForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          companyName,
          temporaryPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setEmail("");
      setName("");
      setCompanyName("");
      setTemporaryPassword("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-3"
    >
      <p className="text-sm font-medium">New client</p>
      <input
        required
        placeholder="Company name"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        className="w-full rounded-xl border border-stone-300 px-3 py-2"
      />
      <input
        required
        placeholder="Contact name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl border border-stone-300 px-3 py-2"
      />
      <input
        required
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl border border-stone-300 px-3 py-2"
      />
      <input
        required
        type="text"
        minLength={8}
        placeholder="Temporary password"
        value={temporaryPassword}
        onChange={(e) => setTemporaryPassword(e.target.value)}
        className="w-full rounded-xl border border-stone-300 px-3 py-2"
      />
      {error && <p className="text-sm text-rose-700">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create client"}
      </button>
    </form>
  );
}
