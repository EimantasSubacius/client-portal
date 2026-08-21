"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm"
    >
      Print / Save PDF
    </button>
  );
}
