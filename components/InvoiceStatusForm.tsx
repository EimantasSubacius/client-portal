"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function InvoiceStatusForm({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Update failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
      >
        <option value="DRAFT">DRAFT</option>
        <option value="SENT">SENT</option>
        <option value="PAID">PAID</option>
      </select>
      <button
        type="button"
        onClick={save}
        className="rounded-xl bg-stone-900 px-3 py-2 text-sm text-white"
      >
        Update status
      </button>
      {error && <span className="text-sm text-rose-700">{error}</span>}
    </div>
  );
}
