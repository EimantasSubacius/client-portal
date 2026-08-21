"use client";

import { FormEvent, useState } from "react";

type FileRow = {
  id: string;
  originalName: string;
  sizeBytes: number;
  createdAt: string;
};

type MessageRow = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; role: string };
};

export function ProjectExtras({
  projectId,
  isAdmin,
  currentUserId,
  initialFiles,
  initialMessages,
}: {
  projectId: string;
  isAdmin: boolean;
  currentUserId: string;
  initialFiles: FileRow[];
  initialMessages: MessageRow[];
}) {
  const [files, setFiles] = useState(initialFiles);
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("projectId", projectId);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/files", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      setFiles((prev) => [
        {
          id: data.data.id,
          originalName: data.data.originalName,
          sizeBytes: data.data.sizeBytes,
          createdAt: data.data.createdAt,
        },
        ...prev,
      ]);
      form.reset();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send");
        return;
      }
      setMessages((prev) => [...prev, data.data]);
      setBody("");
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function removeFile(id: string) {
    if (!isAdmin) return;
    const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      <section>
        <h2 className="text-lg font-semibold">Files</h2>
        <form onSubmit={upload} className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="file"
            required
            accept=".pdf,.png,.jpg,.jpeg,.webp,.zip"
            className="text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-stone-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            Upload
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {files.length === 0 && (
            <li className="text-sm text-stone-500">No files yet.</li>
          )}
          {files.map((f) => (
            <li
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm"
            >
              <a
                className="text-teal-800 hover:underline"
                href={`/api/files/${f.id}`}
              >
                {f.originalName}
              </a>
              <span className="text-stone-500">
                {(f.sizeBytes / 1024).toFixed(1)} KB
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  className="text-rose-700 hover:underline"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Messages</h2>
        <div className="mt-3 space-y-2">
          {messages.length === 0 && (
            <p className="text-sm text-stone-500">No messages yet.</p>
          )}
          {messages.map((m) => {
            const mine = m.author.id === currentUserId;
            return (
              <div
                key={m.id}
                className={`max-w-xl rounded-2xl px-4 py-3 text-sm ${
                  mine
                    ? "ml-auto bg-teal-900 text-teal-50"
                    : "bg-white border border-stone-200"
                }`}
              >
                <p className="text-xs opacity-70 mb-1">
                  {m.author.name} · {new Date(m.createdAt).toLocaleString()}
                </p>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            );
          })}
        </div>
        <form onSubmit={sendMessage} className="mt-4 flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a message"
            required
            className="flex-1 rounded-xl border border-stone-300 px-3 py-2"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
